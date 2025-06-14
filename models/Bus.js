const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    unique: true
  },
  routeNumber: {
    type: String,
    required: true
  },
  busType: {
    type: String,
    enum: ['AC', 'Non-AC'],
    default: 'Non-AC'
  },
  capacity: {
    type: Number,
    default: 40
  },
  currentLocation: {
    type: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Bus', busSchema);
