const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

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

// Search users
router.get('/search', authenticate, async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    }).select('_id username email');
    res.json(users);
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;