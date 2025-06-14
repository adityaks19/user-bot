const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  passengers: {
    type: Number,
    default: 1,
    min: 1
  },
  busNumber: {
    type: String,
    required: true
  },
  routeNumber: {
    type: String,
    required: true
  },
  fare: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  qrCode: {
    type: String
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired', 'cancelled'],
    default: 'active'
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);
