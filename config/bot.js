const { Telegraf } = require('telegraf');

// Initialize bot with token and extended timeout
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '', {
  telegram: {
    // Set a longer timeout (2 minutes)
    timeout: 120000
  }
});

module.exports = bot;
