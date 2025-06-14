const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String
  },
  phone: {
    type: String
  },
  language: {
    type: String,
    enum: ['english', 'hindi', 'punjabi'],
    default: 'english'
  },
  currentState: {
    type: String,
    default: 'START'
  },
  sessionData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
