const { Telegraf } = require('telegraf');

// Initialize bot with token and optimized timeout
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '', {
  telegram: {
    // Set a reasonable timeout (30 seconds)
    timeout: 30000,
    // Add retry configuration
    retryAfter: 1,
    // Disable webhook mode
    webhookReply: false
  }
});

module.exports = bot;
