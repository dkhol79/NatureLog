const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${ uniqueSuffix }-${ file.originalname }`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'audio/mpeg'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

module.exports = (journals, users, saveData) => {
  const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      req.user = jwt.verify(token, 'secret');
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  router.post('/', authenticate, upload.fields([
    { name: 'photos', maxCount: 5 },
    { name: 'videos', maxCount: 2 },
    { name: 'audio', maxCount: 1 },
  ]), async (req, res) => {
    const { title, content, category, lat, lng, location, isPublic, date } = req.body;

    console.log('Received request body:', req.body);

    const validCategories = [
      'Wildlife', 'Plants', 'Scenic Views', 'Weather', 'Birds', 'Geology', 'Water Bodies',
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    let weatherData;
    try {
      const apiKey = '3479fe09a904e4d13a8efb534ee2664d';
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${ lat }&lon=${ lng }&appid=${ apiKey }`
      );
      weatherData = response.data;
    } catch (err) {
      console.error('Weather API error:', err.message);
      weatherData = { main: { temp: 'N/A' } };
    }

    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const entry = {
      id: journals.length + 1,
      userId: req.user.id,
      username: user.username,
      title,
      content,
      category,
      geolocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
      location: location || 'Unknown',
      weather: weatherData,
      isPublic: isPublic === 'true',
      timestamp: new Date(),
      date: date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      photos: req.files.photos ? req.files.photos.map(f => f.path) : [],
      videos: req.files.videos ? req.files.videos.map(f => f.path) : [],
      audio: req.files.audio ? req.files.audio[0]?.path : null,
    };
    journals.push(entry);
    saveData();
    res.json(entry);
  });

  router.put('/:id', authenticate, upload.fields([
    { name: 'photos', maxCount: 5 },
    { name: 'videos', maxCount: 2 },
    { name: 'audio', maxCount: 1 },
  ]), async (req, res) => {
    const entryId = parseInt(req.params.id);
    const entryIndex = journals.findIndex(j => j.id === entryId);

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (journals[entryIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to edit this entry' });
    }

    const { title, content, category, lat, lng, location, isPublic, date } = req.body;

    const validCategories = [
      'Wildlife', 'Plants', 'Scenic Views', 'Weather', 'Birds', 'Geology', 'Water Bodies',
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    let weatherData;
    try {
      const apiKey = '3479fe09a904e4d13a8efb534ee2664d';
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${ lat }&lon=${ lng }&appid=${ apiKey }`
      );
      weatherData = response.data;
    } catch (err) {
      console.error('Weather API error:', err.message);
      weatherData = journals[entryIndex].weather;
    }

    const updatedEntry = {
      ...journals[entryIndex],
      title,
      content,
      category,
      geolocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
      location,
      weather: weatherData,
      isPublic: isPublic === 'true',
      date,
      photos: req.files.photos ? req.files.photos.map(f => f.path) : journals[entryIndex].photos,
      videos: req.files.videos ? req.files.videos.map(f => f.path) : journals[entryIndex].videos,
      audio: req.files.audio ? req.files.audio[0]?.path : journals[entryIndex].audio,
    };

    journals[entryIndex] = updatedEntry;
    saveData();
    res.json(updatedEntry);
  });

  router.get('/', authenticate, (req, res) => {
    const userJournals = journals.filter(j => j.userId === req.user.id).map(j => ({
      id: j.id,
      title: j.title,
      content: j.content,
      category: j.category,
      location: j.location,
      geolocation: j.geolocation,
      weather: j.weather,
      isPublic: j.isPublic,
      timestamp: j.timestamp,
      date: j.date,
      photos: j.photos,
      videos: j.videos,
      audio: j.audio,
    }));
    res.json(userJournals);
  });

  router.get('/community', (req, res) => {
    const publicJournals = journals
      .filter(j => j.isPublic)
      .map(j => ({
        id: j.id,
        title: j.title,
        content: j.content,
        category: j.category,
        location: j.location,
        geolocation: j.geolocation,
        weather: j.weather,
        username: j.username,
        timestamp: j.timestamp,
        date: j.date,
        photos: j.photos,
        videos: j.videos,
        audio: j.audio,
      }));
    res.json(publicJournals);
  });

  router.get('/:id', (req, res) => {
    const entry = journals.find(j => j.id === parseInt(req.params.id));
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      category: entry.category,
      location: entry.location,
      geolocation: entry.geolocation,
      weather: entry.weather,
      username: entry.username,
      isPublic: entry.isPublic,
      timestamp: entry.timestamp,
      date: entry.date,
      photos: entry.photos,
      videos: entry.videos,
      audio: entry.audio,
    });
  });

  return router;
};