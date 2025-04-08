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

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// Initialize multer without fields (we'll specify fields in the routes)
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'audio/mpeg'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: image/jpeg, image/png, video/mp4, audio/mpeg`));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Define the fields for file uploads
const uploadFields = [
  { name: 'photos', maxCount: 5 },
  { name: 'videos', maxCount: 2 },
  { name: 'audio', maxCount: 1 },
];

// Helper function to parse "Town, State" from full address
const parseTownState = (address) => {
  if (!address) return 'Unknown';
  const parts = address.split(', ').map(part => part.trim());
  if (parts.length >= 3) return `${parts[1]}, ${parts[2]}`;
  return address;
};

// Middleware to authenticate JWT
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified, user ID:', req.user.id);
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// POST: Create a new journal entry
router.post('/', authenticate, upload.fields(uploadFields), async (req, res) => {
  const { title, content, category, lat, lng, location, isPublic, date } = req.body;

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

  let weatherData = { main: { temp: 'N/A' } };
  if (lat && lng) {
    try {
      const apiKey = '3479fe09a904e4d13a8efb534ee2664d';
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}`
      );
      weatherData = response.data;
      console.log('Weather data fetched:', weatherData);
    } catch (err) {
      console.error('Weather API error:', err.message);
    }
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    console.log('User not found:', req.user.id);
    return res.status(404).json({ error: 'User not found' });
  }

  const parsedLocation = parseTownState(location);

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

// GET: Fetch all user journals
router.get('/', authenticate, async (req, res) => {
  try {
    const userJournals = await Journal.find({ userId: req.user.id });
    res.json(userJournals);
  } catch (err) {
    console.error('Error fetching journals:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Fetch community journals
router.get('/community', async (req, res) => {
  try {
    const publicJournals = await Journal.find({ isPublic: true });
    res.json(publicJournals);
  } catch (err) {
    console.error('Error fetching community journals:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Fetch a single journal entry
router.get('/:id', authenticate, async (req, res) => {
  try {
    const entry = await Journal.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    if (entry.userId.toString() !== req.user.id && !entry.isPublic) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(entry);
  } catch (err) {
    console.error('Error fetching journal:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT: Update a journal entry
router.put('/:id', authenticate, upload.fields(uploadFields), async (req, res) => {
  const { title, content, category, location, isPublic, date, lat, lng } = req.body;

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

    if (lat && lng) {
      updateData.geolocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
      try {
        const apiKey = '3479fe09a904e4d13a8efb534ee2664d';
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}`
        );
        updateData.weather = response.data;
      } catch (err) {
        console.error('Weather API error during update:', err.message);
        updateData.weather = existingEntry.weather;
      }
    }

    updateData.photos = req.files?.photos?.map(f => f.path) || existingEntry.photos;
    updateData.videos = req.files?.videos?.map(f => f.path) || existingEntry.videos;
    updateData.audio = req.files?.audio?.[0]?.path || existingEntry.audio;

    const updatedEntry = await Journal.findByIdAndUpdate(
      req.params.id,
      { $set: updateData }, // Use $set to update only specified fields
      { new: true, runValidators: true } // Type-safe options
    );
    res.json(updatedEntry);
  } catch (err) {
    console.error('Error updating journal:', err);
    res.status(500).json({ error: 'Failed to update journal entry', details: err.message });
  }
});

// DELETE: Delete a journal entry
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