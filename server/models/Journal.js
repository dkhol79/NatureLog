const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Wildlife', 'Plants', 'Scenic Views', 'Weather', 'Birds', 'Geology', 'Water Bodies'],
  },
  geolocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  location: { type: String, required: true },
  weather: { type: Object, default: { main: { temp: 'N/A' } } },
  isPublic: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  date: { type: String, required: true },
  photos: [{ type: String }],
  videos: [{ type: String }],
  audio: { type: String },
  plantsObserved: [{
    commonName: { type: String, required: true },
    scientificName: { type: String, required: true },
    photo: { type: String },
    notes: { type: String, default: '' },
  }],
  animalsObserved: [{
    commonName: { type: String, required: true },
    scientificName: { type: String, required: true },
    photo: { type: String },
    notes: { type: String, default: '' },
  }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  }],
});

// Add indexes for better query performance
journalSchema.index({ userId: 1 });
journalSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Journal', journalSchema);