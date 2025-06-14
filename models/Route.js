const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  stops: [{
    name: {
      type: String,
      required: true
    },
    arrivalTime: {
      type: String
    },
    departureTime: {
      type: String
    }
  }],
  distance: {
    type: Number,
    default: 0
  },
  fare: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Route', routeSchema);
