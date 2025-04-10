// server\routes\account.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Journal = require('../models/Journal');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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

// GET user account info
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User data from DB:', user);

    res.json({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      username: user.username || '',
      preferences: user.preferences || {
        categories: {
          Plants: false,
          Wildlife: false,
          Weather: false,
          'Scenic Views': false,
        },
        favoriteLocations: [],
      },
    });
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// PUT update account info
router.put('/', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, email, username } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email) user.email = email;
    if (username) user.username = username;

    await user.save();

    res.json({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      username: user.username,
      preferences: user.preferences || {
        categories: {
          Plants: false,
          Wildlife: false,
          Weather: false,
          'Scenic Views': false,
        },
        favoriteLocations: [],
      },
    });
  } catch (err) {
    console.error('Error updating account:', err);
    res.status(500).json({ errorACM: 'Server error', details: err.message });
  }
});

// PUT update password - CORRECTED VERSION
router.put('/password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if both passwords are provided
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Both old and new passwords are required' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect old password' });
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// PUT update preferences
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.preferences = {
      ...user.preferences,
      ...req.body,
    };
    await user.save();
    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences,
    });
  } catch (err) {
    console.error('Error updating preferences:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// DELETE account
router.delete('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.findByIdAndDelete(req.user.id);
    await Journal.deleteMany({ userId: req.user.id });
    res.json({ message: 'Account and associated journals deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;