const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Community = require('../models/Community');
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

// Create a new community
router.post('/', authenticate, async (req, res) => {
  const { name, description, categories, rules, communityType, isMature } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Community name is required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
      return res.status(400).json({ error: 'Community name already exists' });
    }

    const community = new Community({
      name,
      description: description || '',
      categories: categories || {
        Plants: false,
        Wildlife: false,
        Weather: false,
        'Scenic Views': false,
        Birds: false,
        Geology: false,
        'Water Bodies': false,
      },
      rules: rules || '',
      communityType: communityType || 'public',
      isMature: isMature || false,
      adminId: req.user.id,
      adminUsername: user.username,
      members: [req.user.id],
      admins: [req.user.id], // Creator is admin
    });

    await community.save();
    res.status(201).json(community);
  } catch (err) {
    console.error('Error creating community:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get user's communities
router.get('/', authenticate, async (req, res) => {
  try {
    const communities = await Community.find({
      $or: [{ adminId: req.user.id }, { members: req.user.id }],
    }).sort({ createdAt: -1 });
    res.json(communities);
  } catch (err) {
    console.error('Error fetching communities:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single community
router.get('/:id', authenticate, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id).populate('members', 'username email');
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Check access permissions
    if (
      community.communityType === 'private' &&
      !community.members.includes(req.user.id) &&
      !community.admins.includes(req.user.id)
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const membersDetails = community.members.map((member) => ({
      _id: member._id,
      username: member.username,
      email: member.email,
      isAdmin: community.admins.includes(member._id),
    }));

    res.json({
      ...community.toJSON(),
      membersDetails,
      isAdmin: community.admins.includes(req.user.id),
    });
  } catch (err) {
    console.error('Error fetching community:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update community
router.put('/:id', authenticate, async (req, res) => {
  const { name, description, categories, rules, communityType, isMature } = req.body;

  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    if (!community.admins.includes(req.user.id)) {
      return res.status(403).json({ error: 'Only admins can update the community' });
    }

    if (name) community.name = name;
    if (description !== undefined) community.description = description;
    if (categories) community.categories = categories;
    if (rules !== undefined) community.rules = rules;
    if (communityType) community.communityType = communityType;
    if (isMature !== undefined) community.isMature = isMature;

    await community.save();
    res.json(community);
  } catch (err) {
    console.error('Error updating community:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Add member
router.post('/:id/members', authenticate, async (req, res) => {
  const { userId } = req.body;

  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    if (!community.admins.includes(req.user.id)) {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    if (community.bannedUsers.includes(userId)) {
      return res.status(400).json({ error: 'User is banned from this community' });
    }

    if (!community.members.includes(userId)) {
      community.members.push(userId);
      await community.save();
    }

    res.json({ message: 'Member added successfully' });
  } catch (err) {
    console.error('Error adding member:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove member
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    if (!community.admins.includes(req.user.id)) {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    community.members = community.members.filter(
      (memberId) => memberId.toString() !== req.params.userId
    );
    community.admins = community.admins.filter(
      (adminId) => adminId.toString() !== req.params.userId
    );
    await community.save();
    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('Error removing member:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle admin status
router.put('/:id/admin', authenticate, async (req, res) => {
  const { userId, isAdmin } = req.body;

  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    if (!community.admins.includes(req.user.id)) {
      return res.status(403).json({ error: 'Only admins can manage admin status' });
    }

    if (isAdmin) {
      if (!community.admins.includes(userId)) {
        community.admins.push(userId);
      }
    } else {
      community.admins = community.admins.filter(
        (adminId) => adminId.toString() !== userId
      );
    }

    await community.save();
    res.json({ message: 'Admin status updated successfully' });
  } catch (err) {
    console.error('Error updating admin status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Ban member
router.post('/:id/ban', authenticate, async (req, res) => {
  const { userId } = req.body;

  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    if (!community.admins.includes(req.user.id)) {
      return res.status(403).json({ error: 'Only admins can ban members' });
    }

    if (!community.bannedUsers.includes(userId)) {
      community.bannedUsers.push(userId);
      community.members = community.members.filter(
        (memberId) => memberId.toString() !== userId
      );
      community.admins = community.admins.filter(
        (adminId) => adminId.toString() !== userId
      );
      await community.save();
    }

    res.json({ message: 'User banned successfully' });
  } catch (err) {
    console.error('Error banning member:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;