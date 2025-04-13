const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  categories: {
    Plants: { type: Boolean, default: false },
    Wildlife: { type: Boolean, default: false },
    Weather: { type: Boolean, default: false },
    'Scenic Views': { type: Boolean, default: false },
    Birds: { type: Boolean, default: false },
    Geology: { type: Boolean, default: false },
    'Water Bodies': { type: Boolean, default: false },
  },
  rules: { type: String, default: '' },
  communityType: {
    type: String,
    enum: ['public', 'restricted', 'private'],
    default: 'public',
  },
  isMature: { type: Boolean, default: false },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminUsername: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // New field for multiple admins
  bannedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for better query performance
communitySchema.index({ adminId: 1 });
communitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Community', communitySchema);