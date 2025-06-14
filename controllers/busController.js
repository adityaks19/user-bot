const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const { Markup } = require('telegraf');
const { getLocalizedMessage } = require('../utils/messageHandler');
const { updateState, updateSessionData } = require('../utils/sessionManager');

/**
 * Start bus tracking flow
 * @param {Object} ctx - Telegram context
 */
const startBusTracking = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Clear any existing session data for bus tracking
    await updateSessionData(telegramId, { busTracking: {} });
    
    // Show coming soon message with inline keyboard
    const comingSoonMessage = {
      english: '🚧 Bus Tracking Feature Coming Soon! 🚧\n\nWe\'re working hard to bring you real-time bus tracking. This feature will be available in the next update.',
      hindi: '🚧 बस ट्रैकिंग सुविधा जल्द आ रही है! 🚧\n\nहम आपको रीयल-टाइम बस ट्रैकिंग प्रदान करने के लिए कड़ी मेहनत कर रहे हैं। यह सुविधा अगले अपडेट में उपलब्ध होगी।',
      punjabi: '🚧 ਬੱਸ ਟਰੈਕਿੰਗ ਫੀਚਰ ਜਲਦੀ ਆ ਰਿਹਾ ਹੈ! 🚧\n\nਅਸੀਂ ਤੁਹਾਨੂੰ ਰੀਅਲ-ਟਾਈਮ ਬੱਸ ਟਰੈਕਿੰਗ ਪ੍ਰਦਾਨ ਕਰਨ ਲਈ ਸਖ਼ਤ ਮਿਹਨਤ ਕਰ ਰਹੇ ਹਾਂ। ਇਹ ਫੀਚਰ ਅਗਲੇ ਅੱਪਡੇਟ ਵਿੱਚ ਉਪਲਬਧ ਹੋਵੇਗਾ।'
    };
    
    // Send message with inline keyboard
    await ctx.reply(
      comingSoonMessage[language] || comingSoonMessage.english,
      Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Back to Main Menu', 'back_to_menu')]
      ])
    );
    
    // Update user state
    await updateState(telegramId, 'BUS_TRACKING_COMING_SOON');
  } catch (error) {
    console.error('Error in startBusTracking:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Start route information flow
 * @param {Object} ctx - Telegram context
 */
const startRouteInfo = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Clear any existing session data for route info
    await updateSessionData(telegramId, { routeInfo: {} });
    
    // Create message with route information
    const routeInfoMessage = {
      english: '📋 CTU Bus Routes Information 📋\n\nHere are the CTU bus routes:',
      hindi: '📋 CTU बस मार्ग जानकारी 📋\n\nयहां CTU बस मार्ग हैं:',
      punjabi: '📋 CTU ਬੱਸ ਰੂਟ ਜਾਣਕਾਰੀ 📋\n\nਇੱਥੇ CTU ਬੱਸ ਰੂਟ ਹਨ:'
    };
    
    // Send message with route information
    await ctx.reply(routeInfoMessage[language] || routeInfoMessage.english);
    
    // Send PDF document directly
    await ctx.replyWithDocument({ 
      source: '/home/aditya/ctu-clean/public/docs/ctu_buses.pdf',
      filename: 'CTU_Bus_Routes.pdf'
    });
    
    // Send follow-up message with back to menu button
    await ctx.reply(
      'Use the button below to return to the main menu:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Back to Main Menu', 'back_to_menu')]
      ])
    );
    
    // Update user state
    await updateState(telegramId, 'ROUTE_INFO_VIEWING');
  } catch (error) {
    console.error('Error in startRouteInfo:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.', 
      Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Back to Main Menu', 'back_to_menu')]
      ])
    );
  }
};

/**
 * Handle bus callbacks
 * @param {Object} ctx - Telegram context
 */
const handleBusCallbacks = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const callbackData = ctx.callbackQuery.data;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    
    if (!user) {
      await ctx.answerCbQuery('User not found. Please restart the bot.');
      return;
    }
    
    const language = user?.language || 'english';
    
    await ctx.answerCbQuery();
    
    // Handle different bus callbacks
    if (callbackData === 'bus_track') {
      // User wants to track a bus
      await startBusTracking(ctx);
    } 
    else if (callbackData === 'bus_back_to_menu') {
      // User wants to go back to main menu
      const userController = require('./userController');
      await userController.showMainMenu(ctx);
    }
    // Add more callback handlers as needed
    
  } catch (error) {
    console.error('Error in handleBusCallbacks:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Handle route callbacks
 * @param {Object} ctx - Telegram context
 */
const handleRouteCallbacks = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const callbackData = ctx.callbackQuery.data;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    
    if (!user) {
      await ctx.answerCbQuery('User not found. Please restart the bot.');
      return;
    }
    
    const language = user?.language || 'english';
    
    await ctx.answerCbQuery();
    
    // Handle different route callbacks
    if (callbackData === 'route_info') {
      // User wants to see route information
      await startRouteInfo(ctx);
    } 
    else if (callbackData === 'route_back_to_menu') {
      // User wants to go back to main menu
      const userController = require('./userController');
      await userController.showMainMenu(ctx);
    }
    // Add more callback handlers as needed
    
  } catch (error) {
    console.error('Error in handleRouteCallbacks:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

module.exports = {
  startBusTracking,
  startRouteInfo,
  handleBusCallbacks,
  handleRouteCallbacks
};
