const User = require('../models/User');
const { Markup } = require('telegraf');

/**
 * Handle start command
 * @param {Object} ctx - Telegram context
 */
const handleStart = async (ctx) => {
  try {
    const { id: telegramId, first_name, last_name } = ctx.from;
    
    // Find or create user
    let user = await User.findOne({ telegramId: telegramId.toString() });
    
    if (!user) {
      // Create new user
      user = new User({
        telegramId: telegramId.toString(),
        language: 'english',
        currentState: 'START',
        sessionData: {}
      });
      
      await user.save();
    } else {
      // Reset user state
      user.currentState = 'START';
      user.sessionData = {};
      await user.save();
    }
    
    // Send welcome message
    const welcomeMessage = {
      english: `Hey motherfucker to CTU Transport Bot 🚌\n\nI can help you with:\n- Buying bus tickets\n- Purchasing bus passes\n- Tracking buses\n- Finding routes\n\nPlease select your preferred language:`,
      hindi: `CTU Transport Bot में आपका स्वागत है 🚌\n\nमैं आपकी इनमें मदद कर सकता हूं:\n- बस टिकट खरीदना\n- बस पास खरीदना\n- बसों को ट्रैक करना\n- मार्ग खोजना\n\nकृपया अपनी पसंदीदा भाषा चुनें:`,
      punjabi: `CTU Transport Bot ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ 🚌\n\nਮੈਂ ਤੁਹਾਡੀ ਇਹਨਾਂ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ:\n- ਬੱਸ ਟਿਕਟ ਖਰੀਦਣਾ\n- ਬੱਸ ਪਾਸ ਖਰੀਦਣਾ\n- ਬੱਸਾਂ ਨੂੰ ਟਰੈਕ ਕਰਨਾ\n- ਰੂਟ ਲੱਭਣਾ\n\nਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਚੁਣੋ:`
    };
    
    await ctx.reply(welcomeMessage[user.language] || welcomeMessage.english);
    
    // Show language options with inline keyboard
    await ctx.reply("Select your language / अपनी भाषा चुनें / ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ:", 
      Markup.inlineKeyboard([
        [Markup.button.callback('English', 'lang_english')],
        [Markup.button.callback('हिंदी (Hindi)', 'lang_hindi')],
        [Markup.button.callback('ਪੰਜਾਬੀ (Punjabi)', 'lang_punjabi')]
      ])
    );
    
    // Update user state
    await User.findOneAndUpdate(
      { telegramId: telegramId.toString() },
      { currentState: 'SELECTING_LANGUAGE' }
    );
  } catch (error) {
    console.error('Error in handleStart:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Handle language selection callback
 * @param {Object} ctx - Telegram context
 */
const handleLanguageCallback = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const callbackData = ctx.callbackQuery.data;
    
    // Determine selected language
    let language;
    if (callbackData === 'lang_english') {
      language = 'english';
    } else if (callbackData === 'lang_hindi') {
      language = 'hindi';
    } else if (callbackData === 'lang_punjabi') {
      language = 'punjabi';
    } else {
      // Invalid selection, default to English
      language = 'english';
    }
    
    // Update user language
    await User.findOneAndUpdate(
      { telegramId: telegramId.toString() },
      { language }
    );
    
    // Show confirmation message
    const confirmationMessage = {
      english: 'Language set to English.',
      hindi: 'भाषा हिंदी पर सेट की गई।',
      punjabi: 'ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਤੇ ਸੈੱਟ ਕੀਤੀ ਗਈ।'
    };
    
    await ctx.answerCbQuery(confirmationMessage[language]);
    await ctx.editMessageText(confirmationMessage[language]);
    
    // Show main menu
    await showMainMenu(ctx, language);
  } catch (error) {
    console.error('Error in handleLanguageCallback:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Show main menu
 * @param {Object} ctx - Telegram context
 * @param {string} language - User language
 */
const showMainMenu = async (ctx, language) => {
  try {
    const { id: telegramId } = ctx.from;
    
    // Main menu message
    const mainMenuMessage = {
      english: 'Main Menu:',
      hindi: 'मुख्य मेनू:',
      punjabi: 'ਮੁੱਖ ਮੇਨੂ:'
    };
    
    // Create inline keyboard for main menu
    const mainMenuKeyboard = [
      [Markup.button.callback('🎫 Buy Bus Ticket', 'menu_buy_ticket')],
      [Markup.button.callback('📝 Buy Bus Pass', 'menu_buy_pass')],
      [Markup.button.callback('🔍 View My Passes', 'menu_view_passes')],
      [Markup.button.callback('🚌 Track Bus', 'menu_track_bus')],
      [Markup.button.callback('🗺️ View Routes', 'menu_view_routes')],
      [Markup.button.callback('📞 Customer Support', 'menu_customer_support')]
    ];
    
    // Localize button text
    if (language === 'hindi') {
      mainMenuKeyboard[0][0] = Markup.button.callback('🎫 बस टिकट खरीदें', 'menu_buy_ticket');
      mainMenuKeyboard[1][0] = Markup.button.callback('📝 बस पास खरीदें', 'menu_buy_pass');
      mainMenuKeyboard[2][0] = Markup.button.callback('🔍 मेरे पास देखें', 'menu_view_passes');
      mainMenuKeyboard[3][0] = Markup.button.callback('🚌 बस ट्रैक करें', 'menu_track_bus');
      mainMenuKeyboard[4][0] = Markup.button.callback('🗺️ मार्ग देखें', 'menu_view_routes');
      mainMenuKeyboard[5][0] = Markup.button.callback('📞 ग्राहक सहायता', 'menu_customer_support');
    } else if (language === 'punjabi') {
      mainMenuKeyboard[0][0] = Markup.button.callback('🎫 ਬੱਸ ਟਿਕਟ ਖਰੀਦੋ', 'menu_buy_ticket');
      mainMenuKeyboard[1][0] = Markup.button.callback('📝 ਬੱਸ ਪਾਸ ਖਰੀਦੋ', 'menu_buy_pass');
      mainMenuKeyboard[2][0] = Markup.button.callback('🔍 ਮੇਰੇ ਪਾਸ ਵੇਖੋ', 'menu_view_passes');
      mainMenuKeyboard[3][0] = Markup.button.callback('🚌 ਬੱਸ ਟਰੈਕ ਕਰੋ', 'menu_track_bus');
      mainMenuKeyboard[4][0] = Markup.button.callback('🗺️ ਰੂਟ ਵੇਖੋ', 'menu_view_routes');
      mainMenuKeyboard[5][0] = Markup.button.callback('📞 ਗਾਹਕ ਸਹਾਇਤਾ', 'menu_customer_support');
    }
    
    // Send main menu
    await ctx.reply(mainMenuMessage[language] || mainMenuMessage.english, 
      Markup.inlineKeyboard(mainMenuKeyboard)
    );
    
    // Update user state
    await User.findOneAndUpdate(
      { telegramId: telegramId.toString() },
      { currentState: 'MAIN_MENU' }
    );
  } catch (error) {
    console.error('Error in showMainMenu:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Handle main menu callbacks
 * @param {Object} ctx - Telegram context
 */
const handleMainMenuCallback = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const callbackData = ctx.callbackQuery.data;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    await ctx.answerCbQuery();
    
    // Handle different menu options
    switch (callbackData) {
      case 'menu_buy_ticket':
        // Go directly to source region selection
        const ticketController = require('./ticketController');
        await ticketController.showSourceRegionSelection(ctx);
        break;
        
      case 'menu_buy_pass':
        const passController = require('./passController');
        await passController.startPassPurchase(ctx);
        break;
        
      case 'menu_view_passes':
        const passController2 = require('./passController');
        await passController2.viewPurchasedPasses(ctx);
        break;
        
      case 'menu_track_bus':
        const busController = require('./busController');
        await busController.startBusTracking(ctx);
        break;
        
      case 'menu_view_routes':
        const busController2 = require('./busController');
        await busController2.startRouteInfo(ctx);
        break;
        
      case 'menu_customer_support':
        await handleCustomerSupport(ctx, language);
        break;
        
      default:
        await ctx.reply('Invalid option. Please try again.');
        await showMainMenu(ctx, language);
    }
  } catch (error) {
    console.error('Error in handleMainMenuCallback:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Handle customer support
 * @param {Object} ctx - Telegram context
 * @param {string} language - User language
 */
const handleCustomerSupport = async (ctx, language) => {
  try {
    // Customer support message
    const supportMessage = {
      english: 'For customer support, please contact:\n\n' +
               '📞 Helpline: 0172-2704124\n' +
               '📧 Email: ctu-chd@nic.in\n' +
               '🌐 Website: https://chdctu.gov.in\n\n' +
               'Operating Hours: 9:00 AM - 5:00 PM (Monday to Saturday)',
      hindi: 'ग्राहक सहायता के लिए, कृपया संपर्क करें:\n\n' +
             '📞 हेल्पलाइन: 0172-2704124\n' +
             '📧 ईमेल: ctu-chd@nic.in\n' +
             '🌐 वेबसाइट: https://chdctu.gov.in\n\n' +
             'कार्य समय: सुबह 9:00 - शाम 5:00 (सोमवार से शनिवार)',
      punjabi: 'ਗਾਹਕ ਸਹਾਇਤਾ ਲਈ, ਕਿਰਪਾ ਕਰਕੇ ਸੰਪਰਕ ਕਰੋ:\n\n' +
               '📞 ਹੈਲਪਲਾਈਨ: 0172-2704124\n' +
               '📧 ਈਮੇਲ: ctu-chd@nic.in\n' +
               '🌐 ਵੈੱਬਸਾਈਟ: https://chdctu.gov.in\n\n' +
               'ਕੰਮ ਦੇ ਘੰਟੇ: ਸਵੇਰੇ 9:00 - ਸ਼ਾਮ 5:00 (ਸੋਮਵਾਰ ਤੋਂ ਸ਼ਨੀਵਾਰ)'
    };
    
    await ctx.editMessageText(supportMessage[language] || supportMessage.english, 
      Markup.inlineKeyboard([
        [Markup.button.callback('Back to Main Menu', 'back_to_menu')]
      ])
    );
    
    // Update user state
    await User.findOneAndUpdate(
      { telegramId: ctx.from.id.toString() },
      { currentState: 'CUSTOMER_SUPPORT' }
    );
  } catch (error) {
    console.error('Error in handleCustomerSupport:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Handle help command
 * @param {Object} ctx - Telegram context
 */
const handleHelp = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Help message
    const helpMessage = {
      english: 'Here\'s how to use this bot:\n\n' +
               '• /start - Start the bot\n' +
               '• /menu - Show main menu\n' +
               '• /language - Change language\n' +
               '• /help - Show this help message\n' +
               '• /reset - Reset the conversation\n\n' +
               'You can navigate through the menus by tapping on the buttons.',
      hindi: 'इस बॉट का उपयोग कैसे करें:\n\n' +
             '• /start - बॉट शुरू करें\n' +
             '• /menu - मुख्य मेनू दिखाएं\n' +
             '• /language - भाषा बदलें\n' +
             '• /help - यह सहायता संदेश दिखाएं\n' +
             '• /reset - वार्तालाप रीसेट करें\n\n' +
             'आप बटन पर टैप करके मेनू में नेविगेट कर सकते हैं।',
      punjabi: 'ਇਸ ਬੋਟ ਦੀ ਵਰਤੋਂ ਕਿਵੇਂ ਕਰਨੀ ਹੈ:\n\n' +
               '• /start - ਬੋਟ ਸ਼ੁਰੂ ਕਰੋ\n' +
               '• /menu - ਮੁੱਖ ਮੇਨੂ ਦਿਖਾਓ\n' +
               '• /language - ਭਾਸ਼ਾ ਬਦਲੋ\n' +
               '• /help - ਇਹ ਮਦਦ ਸੰਦੇਸ਼ ਦਿਖਾਓ\n' +
               '• /reset - ਗੱਲਬਾਤ ਰੀਸੈਟ ਕਰੋ\n\n' +
               'ਤੁਸੀਂ ਬਟਨਾਂ ਤੇ ਟੈਪ ਕਰਕੇ ਮੇਨੂ ਵਿੱਚ ਨੈਵੀਗੇਟ ਕਰ ਸਕਦੇ ਹੋ।'
    };
    
    await ctx.reply(helpMessage[language] || helpMessage.english, 
      Markup.inlineKeyboard([
        [Markup.button.callback('Back to Main Menu', 'back_to_menu')]
      ])
    );
  } catch (error) {
    console.error('Error in handleHelp:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Handle language command
 * @param {Object} ctx - Telegram context
 */
const handleLanguageCommand = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    
    // Show language options with inline keyboard
    await ctx.reply("Select your language / अपनी भाषा चुनें / ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ:", 
      Markup.inlineKeyboard([
        [Markup.button.callback('English', 'lang_english')],
        [Markup.button.callback('हिंदी (Hindi)', 'lang_hindi')],
        [Markup.button.callback('ਪੰਜਾਬੀ (Punjabi)', 'lang_punjabi')]
      ])
    );
    
    // Update user state
    await User.findOneAndUpdate(
      { telegramId: telegramId.toString() },
      { currentState: 'SELECTING_LANGUAGE' }
    );
  } catch (error) {
    console.error('Error in handleLanguageCommand:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Handle menu command
 * @param {Object} ctx - Telegram context
 */
const handleMenuCommand = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Show main menu
    await showMainMenu(ctx, language);
  } catch (error) {
    console.error('Error in handleMenuCommand:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Handle back to menu callback
 * @param {Object} ctx - Telegram context
 */
const handleBackToMenuCallback = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    await ctx.answerCbQuery();
    
    // Show main menu
    await showMainMenu(ctx, language);
  } catch (error) {
    console.error('Error in handleBackToMenuCallback:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

module.exports = {
  handleStart,
  handleLanguageCallback,
  handleMainMenuCallback,
  showMainMenu,
  handleHelp,
  handleLanguageCommand,
  handleMenuCommand,
  handleBackToMenuCallback,
  handleCustomerSupport
};
