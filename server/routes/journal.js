const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Journal = require('../models/Journal');
const User = require('../models/User');
require('dotenv').config();

const uploadDir = path.join(__dirname, '../Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'audio/mpeg'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: image/jpeg, image/png, video/mp4, audio/mpeg`));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadFields = [
  { name: 'photos', maxCount: 5 },
  { name: 'videos', maxCount: 2 },
  { name: 'audio', maxCount: 1 },
  { name: 'plantPhotos', maxCount: 10 },
  { name: 'animalPhotos', maxCount: 10 },
];

const parseTownState = (address) => {
  if (!address) return 'Unknown';
  const parts = address.split(', ').map(part => part.trim());
  if (parts.length >= 3) return `${parts[1]}, ${parts[2]}`;
  return address;
};

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    User.findById(decoded.id).then(user => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (user.tokenVersion !== decoded.tokenVersion) {
        return res.status(401).json({ error: 'Token is invalid due to password change' });
      }
      next();
    }).catch(err => {
      console.error('Error finding user:', err);
      res.status(500).json({ error: 'Server error' });
    });
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/', authenticate, upload.fields(uploadFields), async (req, res) => {
  const { title, content, category, lat, lng, location, isPublic, date, plantsObserved, animalsObserved } = req.body;

  console.log('POST /api/journal - Request body:', req.body);
  console.log('POST /api/journal - Uploaded files:', req.files);

  const validCategories = ['Wildlife', 'Plants', 'Scenic Views', 'Weather', 'Birds', 'Geology', 'Water Bodies'];

  if (!title || !content || !location || !date) {
    console.log('Missing required fields:', { title, content, location, date });
    return res.status(400).json({ error: 'Title, content, location, and date are required' });
  }
  if (!validCategories.includes(category)) {
    console.log('Invalid category:', category);
    return res.status(400).json({ error: 'Invalid category' });
  }

  let weatherData = null;
  if (lat && lng) {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY || '3479fe09a904e4d13a8efb534ee2664d';
      if (!apiKey) {
        console.error('OpenWeather API key is missing');
        weatherData = null;
      } else {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}`
        );
        weatherData = response.data;
        console.log('Weather data fetched:', weatherData);
      }
    } catch (err) {
      console.error('Weather API error:', err.message);
      weatherData = null;
    }
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    console.log('User not found:', req.user.id);
    return res.status(404).json({ error: 'User not found' });
  }

  const parsedLocation = parseTownState(location);

  let plants = [];
  let animals = [];
  try {
    plants = plantsObserved ? JSON.parse(plantsObserved) : [];
    animals = animalsObserved ? JSON.parse(animalsObserved) : [];
  } catch (err) {
    console.error('Error parsing plantsObserved or animalsObserved:', err.message);
    return res.status(400).json({ error: 'Invalid plantsObserved or animalsObserved data' });
  }

  const plantPhotoPaths = req.files?.plantPhotos?.map(f => f.path) || [];
  const animalPhotoPaths = req.files?.animalPhotos?.map(f => f.path) || [];

  const plantsWithPhotos = plants.map((plant, index) => ({
    commonName: plant.commonName,
    scientificName: plant.scientificName,
    photo: plantPhotoPaths[index] || plant.photo || null,
    notes: plant.notes || '', // Include notes
  }));

  const animalsWithPhotos = animals.map((animal, index) => ({
    commonName: animal.commonName,
    scientificName: animal.scientificName,
    photo: animalPhotoPaths[index] || animal.photo || null,
    notes: animal.notes || '', // Include notes
  }));

  const entry = new Journal({
    userId: req.user.id,
    title,
    content,
    category,
    geolocation: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined,
    location: parsedLocation,
    weather: weatherData,
    isPublic: isPublic === 'true',
    timestamp: new Date(),
    username: user.username,
    photos: req.files?.photos?.map(f => f.path) || [],
    videos: req.files?.videos?.map(f => f.path) || [],
    audio: req.files?.audio?.[0]?.path || null,
    date,
    plantsObserved: plantsWithPhotos,
    animalsObserved: animalsWithPhotos,
  });

  try {
    console.log('Saving journal entry:', entry);
    await entry.save();
    console.log('Journal entry saved:', entry._id);
    res.status(201).json(entry);
  } catch (err) {
    console.error('Error saving journal:', {
      message: err.message,
      stack: err.stack,
      entryData: entry,
    });
    res.status(500).json({ error: 'Failed to save journal entry', details: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const userJournals = await Journal.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json(userJournals);
  } catch (err) {
    console.error('Error fetching journals:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/community', async (req, res) => {
  try {
    const publicJournals = await Journal.find({ isPublic: true })
      .populate('userId', 'username')
      .sort({ timestamp: -1 });
    res.json(publicJournals);
  } catch (err) {
    console.error('Error fetching community journals:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const entry = await Journal.findById(req.params.id).populate('userId', 'username');
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    const token = req.headers.authorization?.split(' ')[1];
    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.error('Token verification failed:', err.message);
      }
    }

    if (!entry.isPublic && (!userId || entry.userId._id.toString() !== userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const entryJson = entry.toJSON();
    entryJson.userId = entry.userId._id.toString();
    entryJson.username = entry.userId.username;

    res.json(entryJson);
  } catch (err) {
    console.error('Error fetching journal:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticate, upload.fields(uploadFields), async (req, res) => {
  const { title, content, category, location, isPublic, date, lat, lng, plantsObserved, animalsObserved } = req.body;

  const validCategories = ['Wildlife', 'Plants', 'Scenic Views', 'Weather', 'Birds', 'Geology', 'Water Bodies'];

  try {
    const existingEntry = await Journal.findById(req.params.id);
    if (!existingEntry) return res.status(404).json({ error: 'Entry not found' });
    if (existingEntry.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (category) {
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
      }
      updateData.category = category;
    }
    if (location) updateData.location = parseTownState(location);
    if (isPublic !== undefined) updateData.isPublic = isPublic === 'true';
    if (date) updateData.date = date;

    if (plantsObserved) {
      try {
        const plants = JSON.parse(plantsObserved);
        const plantPhotoPaths = req.files?.plantPhotos?.map(f => f.path) || [];
        updateData.plantsObserved = plants.map((plant, index) => ({
          commonName: plant.commonName,
          scientificName: plant.scientificName,
          photo: plantPhotoPaths[index] || plant.photo || existingEntry.plantsObserved[index]?.photo || null,
          notes: plant.notes || existingEntry.plantsObserved[index]?.notes || '', // Preserve or update notes
        }));
      } catch (err) {
        console.error('Error parsing plantsObserved:', err.message);
        return res.status(400).json({ error: 'Invalid plantsObserved data' });
      }
    } else {
      updateData.plantsObserved = existingEntry.plantsObserved;
    }

    if (animalsObserved) {
      try {
        const animals = JSON.parse(animalsObserved);
        const animalPhotoPaths = req.files?.animalPhotos?.map(f => f.path) || [];
        updateData.animalsObserved = animals.map((animal, index) => ({
          commonName: animal.commonName,
          scientificName: animal.scientificName,
          photo: animalPhotoPaths[index] || animal.photo || existingEntry.animalsObserved[index]?.photo || null,
          notes: animal.notes || existingEntry.animalsObserved[index]?.notes || '', // Preserve or update notes
        }));
      } catch (err) {
        console.error('Error parsing animalsObserved:', err.message);
        return res.status(400).json({ error: 'Invalid animalsObserved data' });
      }
    } else {
      updateData.animalsObserved = existingEntry.animalsObserved;
    }

    if (lat && lng) {
      updateData.geolocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
      try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
          console.error('OpenWeather API key is missing');
          updateData.weather = existingEntry.weather;
        } else {
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}`
          );
          updateData.weather = response.data;
        }
      } catch (err) {
        console.error('Weather API error during update:', err.message);
        updateData.weather = existingEntry.weather;
      }
    } else {
      updateData.geolocation = existingEntry.geolocation;
      updateData.weather = existingEntry.weather;
    }

    updateData.photos = req.files?.photos?.map(f => f.path) || existingEntry.photos;
    updateData.videos = req.files?.videos?.map(f => f.path) || existingEntry.videos;
    updateData.audio = req.files?.audio?.[0]?.path || existingEntry.audio;

    const updatedEntry = await Journal.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    res.json(updatedEntry);
  } catch (err) {
    console.error('Error updating journal:', err);
    res.status(500).json({ error: 'Failed to update journal entry', details: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  console.log(`DELETE /api/journal/${req.params.id} - Request received`);
  console.log('User ID from token:', req.user.id);

  try {
    const entry = await Journal.findById(req.params.id);
    if (!entry) {
      console.log(`Entry ${req.params.id} not found`);
      return res.status(404).json({ error: 'Entry not found' });
    }
    console.log('Entry found:', { id: entry._id, userId: entry.userId });

    if (entry.userId.toString() !== req.user.id) {
      console.log(`Permission denied: Entry userId ${entry.userId} does not match req.user.id ${req.user.id}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    await Journal.findByIdAndDelete(req.params.id);
    console.log(`Entry ${req.params.id} deleted successfully`);
    res.status(200).json({ message: 'Entry deleted successfully' });
  } catch (err) {
    console.error('Error deleting journal:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

module.exports = router;