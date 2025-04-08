// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // In production, hash this
  username: { type: String, required: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  preferences: {
    categories: {
      Plants: { type: Boolean, default: false },
      Wildlife: { type: Boolean, default: false },
      Weather: { type: Boolean, default: false },
      'Scenic Views': { type: Boolean, default: false },
    },
    favoriteLocations: [{
      location: String,
      lat: Number,
      lng: Number,
    }],
  },
});

module.exports = mongoose.model('User', userSchema);