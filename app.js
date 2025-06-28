const { Telegraf, session } = require('telegraf');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

// Import configuration
const connectDB = require('./config/db');
const bot = require('./config/bot');

// Import controllers
const userController = require('./controllers/userController');
const ticketController = require('./controllers/ticketController');
const passController = require('./controllers/passController');
const busController = require('./controllers/busController');

// Import models
const User = require('./models/User');

// Connect to MongoDB Atlas
connectDB();

// Initialize Express app
const app = express();
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Set up bot middleware
bot.use(session());

// Remove keyboard middleware
bot.use(async (ctx, next) => {
  // Only remove keyboard for specific messages that need it
  if (ctx.message && ctx.message.text && !ctx.message.text.startsWith('/')) {
    // Check if the message is a document upload
    const user = await User.findOne({ telegramId: ctx.from.id.toString() });
    if (user && user.currentState === 'PASS_UPLOADING_DOCUMENT' && ctx.message.document) {
      // Don't show the "use inline buttons" message for document uploads
      return next();
    }
    
    // For other messages, show the inline buttons message
    await ctx.reply('Please use the inline buttons provided.', {
      reply_markup: { remove_keyboard: true }
    });
  }
  return next();
});

// Command handlers - these should always work regardless of state
bot.command('start', userController.handleStart);
bot.command('help', userController.handleHelp);
bot.command('language', userController.handleLanguageCommand);
bot.command('menu', userController.handleMenuCommand);
bot.command('reset', async (ctx) => {
  const { id: telegramId } = ctx.from;
  await User.findOneAndUpdate(
    { telegramId: telegramId.toString() },
    { currentState: 'START', sessionData: {} }
  );
  // Remove keyboard
  await ctx.reply('Bot has been reset. Starting over...', {
    reply_markup: { remove_keyboard: true }
  });
  return userController.handleStart(ctx);
});

// Handle callback queries with ultra-fast response
bot.on('callback_query', async (ctx) => {
  // Answer callback query IMMEDIATELY - no try/catch to avoid delays
  ctx.answerCbQuery().catch(() => {}); // Ignore any errors
  
  try {
    const callbackData = ctx.callbackQuery.data;
    
    // Handle language selection
    if (callbackData.startsWith('lang_')) {
      return userController.handleLanguageCallback(ctx);
    }
    
    // Handle main menu options
    if (callbackData.startsWith('menu_')) {
      return userController.handleMainMenuCallback(ctx);
    }
    
    // Handle back to menu
    if (callbackData === 'back_to_menu') {
      return userController.handleBackToMenuCallback(ctx);
    }
    
    // Handle ticket booking callbacks
    if (callbackData.startsWith('ticket_')) {
      return ticketController.handleTicketCallbacks(ctx);
    }
    
    // Handle bus tracking callbacks
    if (callbackData.startsWith('bus_')) {
      return busController.handleBusCallbacks(ctx);
    }
    
    // Handle route info callbacks
    if (callbackData.startsWith('route_')) {
      return busController.handleRouteCallbacks(ctx);
    }
    
    // Handle pass callbacks
    if (callbackData.startsWith('pass_')) {
      return passController.handlePassCallbacks(ctx);
    }
    
    // Unknown callback - just ignore
    
  } catch (error) {
    console.error('Error handling callback query:', error);
    // Don't send any error messages to avoid more issues
  }
});

// Handle user messages based on state
bot.on('message', async (ctx) => {
  try {
    // Check if it's a command - commands are handled separately
    if (ctx.message.text && ctx.message.text.startsWith('/')) {
      return; // Commands are handled by the command handlers above
    }
    
    const { id: telegramId } = ctx.from;
    const text = ctx.message.text;
    
    // Get user and current state
    const user = await User.findOne({ telegramId: telegramId.toString() });
    
    if (!user) {
      // If user doesn't exist, handle as new user
      return userController.handleStart(ctx);
    }
    
    // For most interactions, we'll use inline buttons instead of text messages
    // This section is mainly for handling document uploads or specific text inputs
    
    const state = user.currentState;
    
    switch (state) {
      case 'PASS_UPLOADING_DOCUMENT':
        return passController.handleDocumentUpload(ctx);
        
      case 'BUS_ENTERING_NUMBER':
        return busController.handleBusNumberInput(ctx);
        
      default:
        // For most states, guide user to use buttons
        await ctx.reply('Please use the buttons to navigate. If you don\'t see any buttons, use /menu to show the main menu or /reset to restart the bot.', {
          reply_markup: { remove_keyboard: true }
        });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    // Only send error message if it's not a timeout or duplicate error
    if (!error.message.includes('query is too old') && !error.message.includes('message is not modified')) {
      try {
        await ctx.reply('Sorry, something went wrong. Please use /reset to restart.');
      } catch (replyError) {
        console.error('Error sending error reply:', replyError);
      }
    }
  }
});

// Error handler
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again or use /start to restart the bot.');
});

// Start bot with improved error handling and retry logic
console.log('Attempting to start bot...');

// Function to test Telegram API connectivity with timeout
const testTelegramAPI = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`, {
      signal: controller.signal,
      timeout: 10000
    });
    
    clearTimeout(timeoutId);
    const data = await response.json();
    
    if (data.ok) {
      console.log('Telegram API connection test successful');
      return true;
    } else {
      console.error('Telegram API connection test failed:', data);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Telegram API connection timeout');
    } else {
      console.error('Error testing Telegram API connection:', error.message);
    }
    return false;
  }
};

const startBot = async () => {
  try {
    // Test API connection first
    console.log('Testing Telegram API connection...');
    const apiConnected = await testTelegramAPI();
    
    if (!apiConnected) {
      console.log('Could not connect to Telegram API. Will try to start bot anyway...');
    }
    
    // Add global error handler for the bot
    bot.catch((err, ctx) => {
      console.error('Bot error:', err);
      // Don't send error messages for timeout errors
      if (!err.message.includes('query is too old') && !err.message.includes('message is not modified')) {
        try {
          ctx.reply('Sorry, an error occurred. Please use /reset to restart.');
        } catch (replyError) {
          console.error('Error sending error reply:', replyError);
        }
      }
    });
    
    // Try to start the bot
    await bot.launch({
      allowedUpdates: ['message', 'callback_query'],
      dropPendingUpdates: true
    });
    console.log('Bot started successfully');
  } catch (error) {
    console.error('Error starting bot:', error);
    console.log('Retrying in 2 seconds...');
    
    // Try again after 2 seconds
    setTimeout(async () => {
      try {
        await bot.launch();
        console.log('Bot started on retry');
      } catch (retryError) {
        console.error('Failed to start bot on retry:', retryError);
        console.log('Please check your network connection and try again later.');
      }
    }, 2000);
  }
};

startBot();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});
