const mongoose = require('mongoose');

const passSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['daily', 'monthly', 'student', 'senior'],
    required: true
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
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
  documents: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'expired'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pass', passSchema);
