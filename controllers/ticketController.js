const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const { Markup } = require('telegraf');
const { updateState, updateSessionData } = require('../utils/sessionManager');
const { generateQRCode } = require('../utils/qrGenerator');

// Locations organized by sector ranges and regions
const locationsByRegion = {
  sectors1to20: [
    'Sector 1 (Capitol Complex)',
    'Sector 2',
    'Sector 3',
    'Sector 4',
    'Sector 5',
    'Sector 6',
    'Sector 7',
    'Sector 8',
    'Sector 9',
    'Sector 10',
    'Sector 11',
    'Sector 12',
    'Sector 14',
    'Sector 15',
    'Sector 16',
    'Sector 17 ISBT',
    'Sector 18',
    'Sector 19',
    'Sector 20'
  ],
  sectors21to40: [
    'Sector 21',
    'Sector 22',
    'Sector 23',
    'Sector 24',
    'Sector 25',
    'Sector 26',
    'Sector 27',
    'Sector 28',
    'Sector 29',
    'Sector 30',
    'Sector 31',
    'Sector 32',
    'Sector 33',
    'Sector 34',
    'Sector 35',
    'Sector 36',
    'Sector 37',
    'Sector 38',
    'Sector 39',
    'Sector 40'
  ],
  sectors41to61: [
    'Sector 41',
    'Sector 42',
    'Sector 43 ISBT',
    'Sector 44',
    'Sector 45',
    'Sector 46',
    'Sector 47',
    'Sector 48',
    'Sector 49',
    'Sector 50',
    'Sector 51',
    'Sector 52',
    'Sector 53',
    'Sector 54',
    'Sector 55',
    'Sector 56',
    'Sector 61'
  ],
  landmarks: [
    'PGI',
    'Panjab University',
    'Rock Garden',
    'Sukhna Lake',
    'Industrial Area',
    'IT Park',
    'Railway Station',
    'Bus Stand'
  ],
  neighboring: [
    'Panchkula',
    'Mohali',
    'Zirakpur',
    'Kharar',
    'Airport',
    'Manimajra',
    'Dhanas',
    'Sarangpur'
  ]
};

// All locations combined for reference
const allLocations = [
  ...locationsByRegion.sectors1to20,
  ...locationsByRegion.sectors21to40,
  ...locationsByRegion.sectors41to61,
  ...locationsByRegion.landmarks,
  ...locationsByRegion.neighboring
];

// Localized messages
const messages = {
  ticket_options: {
    english: 'What would you like to do?',
    hindi: 'आप क्या करना चाहेंगे?',
    punjabi: 'ਤੁਸੀਂ ਕੀ ਕਰਨਾ ਚਾਹੋਗੇ?'
  },
  select_source_region: {
    english: 'Please select the source region:',
    hindi: 'कृपया स्रोत क्षेत्र चुनें :',
    punjabi: 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਰੋਤ ਸਥਾਨ ਦਾ ਖੇਤਰ ਚੁਣੋ:'
  },
  select_source_location: {
    english: 'Please select your source location:',
    hindi: 'कृपया अपना स्रोत स्थान चुनें:',
    punjabi: 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਸਰੋਤ ਸਥਾਨ ਚੁਣੋ:'
  },
  back_to_menu: {
    english: 'Back to Main Menu',
    hindi: 'मुख्य मेनू पर वापस जाएं',
    punjabi: 'ਮੁੱਖ ਮੇਨੂ ਤੇ ਵਾਪਸ ਜਾਓ'
  },
  back_to_ticket_menu: {
    english: 'Back to Ticket Menu',
    hindi: 'टिकट मेनू पर वापस जाएं',
    punjabi: 'ਟਿਕਟ ਮੇਨੂ ਤੇ ਵਾਪਸ ਜਾਓ'
  },
  no_tickets: {
    english: 'You have no tickets purchased today.',
    hindi: 'आपने आज कोई टिकट नहीं खरीदा है।',
    punjabi: 'ਤੁਸੀਂ ਅੱਜ ਕੋਈ ਟਿਕਟ ਨਹੀਂ ਖਰੀਦਿਆ ਹੈ।'
  }
};

/**
 * Get localized message
 * @param {string} key - Message key
 * @param {string} language - Language code
 * @returns {string} - Localized message
 */
const getLocalizedMessage = (key, language = 'english') => {
  if (!messages[key]) {
    console.warn(`Message key not found: ${key}`);
    return key;
  }
  
  return messages[key][language] || messages[key].english;
};

/**
 * Start ticket booking flow
 * @param {Object} ctx - Telegram context
 */
const startTicketBooking = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Clear any existing session data for ticket booking
    await updateSessionData(telegramId, { ticketBooking: {} });
    
    // Create ticket options keyboard
    const ticketOptionsKeyboard = [
      [Markup.button.callback('🎫 Buy Bus Ticket', 'ticket_buy')],
      [Markup.button.callback('🔍 View Purchased Tickets', 'ticket_view')],
      [Markup.button.callback('⬅️ Back to Main Menu', 'back_to_menu')]
    ];
    
    // Localize button text
    if (language === 'hindi') {
      ticketOptionsKeyboard[0][0] = Markup.button.callback('🎫 बस टिकट खरीदें', 'ticket_buy');
      ticketOptionsKeyboard[1][0] = Markup.button.callback('🔍 खरीदे गए टिकट देखें', 'ticket_view');
      ticketOptionsKeyboard[2][0] = Markup.button.callback('⬅️ मुख्य मेनू पर वापस जाएं', 'back_to_menu');
    } else if (language === 'punjabi') {
      ticketOptionsKeyboard[0][0] = Markup.button.callback('🎫 ਬੱਸ ਟਿਕਟ ਖਰੀਦੋ', 'ticket_buy');
      ticketOptionsKeyboard[1][0] = Markup.button.callback('🔍 ਖਰੀਦੇ ਗਏ ਟਿਕਟ ਵੇਖੋ', 'ticket_view');
      ticketOptionsKeyboard[2][0] = Markup.button.callback('⬅️ ਮੁੱਖ ਮੇਨੂ ਤੇ ਵਾਪਸ ਜਾਓ', 'back_to_menu');
    }
    
    // Send ticket options with inline keyboard
    if (ctx.callbackQuery) {
      await ctx.editMessageText(getLocalizedMessage('ticket_options', language),
        Markup.inlineKeyboard(ticketOptionsKeyboard)
      );
    } else {
      await ctx.reply(getLocalizedMessage('ticket_options', language),
        Markup.inlineKeyboard(ticketOptionsKeyboard)
      );
    }
    
    // Update user state
    await updateState(telegramId, 'TICKET_SELECTING_OPTION');
  } catch (error) {
    console.error('Error in startTicketBooking:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Show source region selection
 * @param {Object} ctx - Telegram context
 */
const showSourceRegionSelection = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Region names in different languages
    const regionNames = {
      english: {
        sectors1to20: 'Sectors 1-20',
        sectors21to40: 'Sectors 21-40',
        sectors41to61: 'Sectors 41-61',
        landmarks: 'Landmarks',
        neighboring: 'Neighboring Areas'
      },
      hindi: {
        sectors1to20: 'सेक्टर 1-20',
        sectors21to40: 'सेक्टर 21-40',
        sectors41to61: 'सेक्टर 41-61',
        landmarks: 'प्रमुख स्थान',
        neighboring: 'पड़ोसी क्षेत्र'
      },
      punjabi: {
        sectors1to20: 'ਸੈਕਟਰ 1-20',
        sectors21to40: 'ਸੈਕਟਰ 21-40',
        sectors41to61: 'ਸੈਕਟਰ 41-61',
        landmarks: 'ਪ੍ਰਮੁੱਖ ਸਥਾਨ',
        neighboring: 'ਗੁਆਂਢੀ ਖੇਤਰ'
      }
    };
    
    // Save region names to session data for reference
    await updateSessionData(telegramId, { 
      ticketBooking: { 
        regionNames: regionNames[language] || regionNames.english
      } 
    });
    
    // Create keyboard for region selection
    const keyboard = [];
    Object.keys(locationsByRegion).forEach(region => {
      keyboard.push([
        Markup.button.callback(
          regionNames[language]?.[region] || regionNames.english[region],
          `ticket_source_region_${region}`
        )
      ]);
    });
    
    // Add back button
    keyboard.push([
      Markup.button.callback(
        '⬅️ ' + getLocalizedMessage('back_to_ticket_menu', language),
        'ticket_back_to_options'
      )
    ]);
    
    // Send message with inline keyboard
    await ctx.editMessageText(
      getLocalizedMessage('select_source_region', language),
      Markup.inlineKeyboard(keyboard)
    );
    
    // Update user state
    await updateState(telegramId, 'TICKET_SELECTING_SOURCE_REGION');
  } catch (error) {
    console.error('Error in showSourceRegionSelection:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Show source locations for selected region
 * @param {Object} ctx - Telegram context
 * @param {string} region - Selected region
 */
const showSourceLocations = async (ctx, region) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Save selected region to session data
    await updateSessionData(telegramId, { 
      ticketBooking: { 
        ...user.sessionData.ticketBooking,
        sourceRegion: region
      } 
    });
    
    // Get locations for the selected region
    const locations = locationsByRegion[region];
    
    // Create keyboard with locations
    const keyboard = [];
    
    // Split locations into chunks of 2 for better display
    for (let i = 0; i < locations.length; i += 2) {
      const row = [];
      row.push(Markup.button.callback(locations[i], `ticket_source_${i}`));
      
      if (i + 1 < locations.length) {
        row.push(Markup.button.callback(locations[i + 1], `ticket_source_${i + 1}`));
      }
      
      keyboard.push(row);
    }
    
    // Add back button
    keyboard.push([
      Markup.button.callback(
        '⬅️ Back to Regions',
        'ticket_back_to_source_regions'
      )
    ]);
    
    // Send message with inline keyboard
    await ctx.editMessageText(
      getLocalizedMessage('select_source_location', language),
      Markup.inlineKeyboard(keyboard)
    );
    
    // Update user state
    await updateState(telegramId, 'TICKET_SELECTING_SOURCE');
  } catch (error) {
    console.error('Error in showSourceLocations:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Show destination region selection
 * @param {Object} ctx - Telegram context
 */
const showDestinationRegionSelection = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    const regionNames = user.sessionData.ticketBooking.regionNames;
    
    // Create keyboard for region selection
    const keyboard = [];
    Object.keys(locationsByRegion).forEach(region => {
      keyboard.push([
        Markup.button.callback(
          regionNames[region],
          `ticket_dest_region_${region}`
        )
      ]);
    });
    
    // Add back button
    keyboard.push([
      Markup.button.callback(
        '⬅️ Back to Source Selection',
        'ticket_back_to_source'
      )
    ]);
    
    // Send message with inline keyboard
    await ctx.editMessageText(
      'Please select the destination:',
      Markup.inlineKeyboard(keyboard)
    );
    
    // Update user state
    await updateState(telegramId, 'TICKET_SELECTING_DESTINATION_REGION');
  } catch (error) {
    console.error('Error in showDestinationRegionSelection:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Show destination locations for selected region
 * @param {Object} ctx - Telegram context
 * @param {string} region - Selected region
 */
const showDestinationLocations = async (ctx, region) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    const source = user.sessionData.ticketBooking.source;
    
    // Save selected region to session data
    await updateSessionData(telegramId, { 
      ticketBooking: { 
        ...user.sessionData.ticketBooking,
        destinationRegion: region
      } 
    });
    
    // Get locations for the selected region, excluding the source
    const locations = locationsByRegion[region].filter(loc => loc !== source);
    
    // Create keyboard with locations
    const keyboard = [];
    
    // Split locations into chunks of 2 for better display
    for (let i = 0; i < locations.length; i += 2) {
      const row = [];
      row.push(Markup.button.callback(locations[i], `ticket_dest_${i}`));
      
      if (i + 1 < locations.length) {
        row.push(Markup.button.callback(locations[i + 1], `ticket_dest_${i + 1}`));
      }
      
      keyboard.push(row);
    }
    
    // Add back button
    keyboard.push([
      Markup.button.callback(
        '⬅️ Back to Regions',
        'ticket_back_to_dest_regions'
      )
    ]);
    
    // Send message with inline keyboard
    await ctx.editMessageText(
      'Please select your destination:',
      Markup.inlineKeyboard(keyboard)
    );
    
    // Update user state
    await updateState(telegramId, 'TICKET_SELECTING_DESTINATION');
  } catch (error) {
    console.error('Error in showDestinationLocations:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Handle ticket callbacks
 * @param {Object} ctx - Telegram context
 */
const handleTicketCallbacks = async (ctx) => {
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
    
    // Handle different ticket callbacks
    if (callbackData === 'ticket_buy') {
      // User wants to buy a ticket, show source region selection directly
      await showSourceRegionSelection(ctx);
    } 
    else if (callbackData === 'ticket_view') {
      // User wants to view purchased tickets
      await showPurchasedTickets(ctx);
    }
    else if (callbackData === 'ticket_back_to_options') {
      // User wants to go back to ticket options
      await startTicketBooking(ctx);
    }
    else if (callbackData === 'ticket_back_to_source_regions') {
      // User wants to go back to source region selection
      await showSourceRegionSelection(ctx);
    }
    else if (callbackData === 'ticket_back_to_source') {
      // User wants to go back to source selection
      const sourceRegion = user.sessionData.ticketBooking.sourceRegion;
      await showSourceLocations(ctx, sourceRegion);
    }
    else if (callbackData === 'ticket_back_to_dest_regions') {
      // User wants to go back to destination region selection
      await showDestinationRegionSelection(ctx);
    }
    else if (callbackData === 'ticket_back_to_destination') {
      // User wants to go back to destination selection
      const destRegion = user.sessionData.ticketBooking.destinationRegion;
      await showDestinationLocations(ctx, destRegion);
    }
    else if (callbackData === 'ticket_back_to_passengers') {
      // User wants to go back to passenger selection
      await showPassengerSelection(ctx);
    }
    else if (callbackData.startsWith('ticket_source_region_')) {
      // User selected a source region
      const region = callbackData.replace('ticket_source_region_', '');
      await showSourceLocations(ctx, region);
    }
    else if (callbackData.startsWith('ticket_source_')) {
      // User selected a source location
      const index = parseInt(callbackData.replace('ticket_source_', ''));
      const region = user.sessionData.ticketBooking.sourceRegion;
      const locations = locationsByRegion[region];
      
      if (index >= 0 && index < locations.length) {
        const source = locations[index];
        
        // Save source to session data
        await updateSessionData(telegramId, { 
          ticketBooking: { 
            ...user.sessionData.ticketBooking,
            source 
          } 
        });
        
        // Show destination region selection
        await showDestinationRegionSelection(ctx);
      } else {
        await ctx.reply('Invalid selection. Please try again.');
      }
    }
    else if (callbackData.startsWith('ticket_dest_region_')) {
      // User selected a destination region
      const region = callbackData.replace('ticket_dest_region_', '');
      await showDestinationLocations(ctx, region);
    }
    else if (callbackData.startsWith('ticket_dest_')) {
      // User selected a destination location
      const index = parseInt(callbackData.replace('ticket_dest_', ''));
      const region = user.sessionData.ticketBooking.destinationRegion;
      const source = user.sessionData.ticketBooking.source;
      const locations = locationsByRegion[region].filter(loc => loc !== source);
      
      if (index >= 0 && index < locations.length) {
        const destination = locations[index];
        
        // Save destination to session data
        await updateSessionData(telegramId, { 
          ticketBooking: { 
            ...user.sessionData.ticketBooking,
            destination 
          } 
        });
        
        // Show passenger selection
        await showPassengerSelection(ctx);
      } else {
        await ctx.reply('Invalid selection. Please try again.');
      }
    }
    else if (callbackData.startsWith('ticket_passengers_')) {
      // User selected number of passengers
      const passengers = parseInt(callbackData.replace('ticket_passengers_', ''));
      
      // Save passengers to session data
      await updateSessionData(telegramId, { 
        ticketBooking: { 
          ...user.sessionData.ticketBooking,
          passengers 
        } 
      });
      
      // Show available buses
      await showAvailableBuses(ctx);
    }
    else if (callbackData.startsWith('ticket_bus_')) {
      // User selected a bus
      const index = parseInt(callbackData.replace('ticket_bus_', ''));
      const buses = user.sessionData.ticketBooking.availableBuses;
      
      if (index >= 0 && index < buses.length) {
        const selectedBus = buses[index];
        
        // Save selected bus to session data
        await updateSessionData(telegramId, { 
          ticketBooking: { 
            ...user.sessionData.ticketBooking,
            selectedBus 
          } 
        });
        
        // Show booking confirmation
        await showBookingConfirmation(ctx);
      } else {
        await ctx.reply('Invalid selection. Please try again.');
      }
    }
    else if (callbackData === 'ticket_confirm') {
      // User confirmed booking, show payment options
      await showPaymentOptions(ctx);
    }
    else if (callbackData === 'ticket_cancel') {
      // User cancelled booking
      await ctx.editMessageText(
        'Booking cancelled. Would you like to try again?',
        Markup.inlineKeyboard([
          [Markup.button.callback('Try Again', 'ticket_buy')],
          [Markup.button.callback('Back to Main Menu', 'back_to_menu')]
        ])
      );
    }
    else if (callbackData.startsWith('ticket_payment_')) {
      // User selected a payment method
      const paymentMethod = callbackData.replace('ticket_payment_', '');
      await processPayment(ctx, paymentMethod);
    }
    // Add more callback handlers for other ticket booking steps
    
  } catch (error) {
    console.error('Error in handleTicketCallbacks:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Show passenger selection
 * @param {Object} ctx - Telegram context
 */
const showPassengerSelection = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Create keyboard for passenger selection - limited to 6 options as requested
    const keyboard = [
      [
        Markup.button.callback('1', 'ticket_passengers_1'),
        Markup.button.callback('2', 'ticket_passengers_2'),
        Markup.button.callback('3', 'ticket_passengers_3')
      ],
      [
        Markup.button.callback('4', 'ticket_passengers_4'),
        Markup.button.callback('5', 'ticket_passengers_5'),
        Markup.button.callback('6', 'ticket_passengers_6')
      ],
      [
        Markup.button.callback('⬅️ Back to Destination', 'ticket_back_to_destination')
      ]
    ];
    
    // Send message with inline keyboard
    await ctx.editMessageText(
      'How many passengers?',
      Markup.inlineKeyboard(keyboard)
    );
    
    // Update user state
    await updateState(telegramId, 'TICKET_ENTERING_PASSENGERS');
  } catch (error) {
    console.error('Error in showPassengerSelection:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Show purchased tickets
 * @param {Object} ctx - Telegram context
 */
const showPurchasedTickets = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Get today's date (start and end)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find tickets purchased today
    const tickets = await Ticket.find({
      userId: user._id,
      issuedAt: { $gte: today, $lt: tomorrow }
    }).sort({ issuedAt: -1 });
    
    if (tickets.length === 0) {
      // No tickets found
      await ctx.editMessageText(getLocalizedMessage('no_tickets', language),
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ ' + getLocalizedMessage('back_to_ticket_menu', language), 'ticket_back_to_options')]
        ])
      );
      
      await updateState(telegramId, 'TICKET_VIEWING');
      return;
    }
    
    // Show tickets
    const ticketListMessage = {
      english: `You have ${tickets.length} ticket(s) purchased today:`,
      hindi: `आपने आज ${tickets.length} टिकट खरीदे हैं:`,
      punjabi: `ਤੁਸੀਂ ਅੱਜ ${tickets.length} ਟਿਕਟ ਖਰੀਦੇ ਹਨ:`
    };
    
    // Create keyboard with ticket options
    const keyboard = [];
    tickets.forEach((ticket, index) => {
      keyboard.push([
        Markup.button.callback(
          `${ticket.source} → ${ticket.destination} (${ticket.busNumber})`,
          `ticket_view_${ticket._id}`
        )
      ]);
    });
    
    // Add back button
    keyboard.push([
      Markup.button.callback(
        '⬅️ ' + getLocalizedMessage('back_to_ticket_menu', language),
        'ticket_back_to_options'
      )
    ]);
    
    // Send message with inline keyboard
    await ctx.editMessageText(
      ticketListMessage[language] || ticketListMessage.english,
      Markup.inlineKeyboard(keyboard)
    );
    
    // Save tickets to session data
    await updateSessionData(telegramId, { 
      ticketViewing: { 
        tickets: tickets.map(ticket => ({
          id: ticket._id.toString(),
          source: ticket.source,
          destination: ticket.destination,
          busNumber: ticket.busNumber
        }))
      } 
    });
    
    await updateState(telegramId, 'TICKET_VIEWING');
  } catch (error) {
    console.error('Error in showPurchasedTickets:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Show available buses for the selected route
 * @param {Object} ctx - Telegram context
 */
const showAvailableBuses = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    const { source, destination, passengers } = user.sessionData.ticketBooking;
    
    // Mock data for available buses - in a real app, this would come from the database
    const availableBuses = [
      {
        id: 'bus1',
        busNumber: 'CTU-101',
        departureTime: '10:00 AM',
        arrivalTime: '10:45 AM',
        fare: 30,
        availableSeats: 25
      },
      {
        id: 'bus2',
        busNumber: 'CTU-203',
        departureTime: '11:30 AM',
        arrivalTime: '12:15 PM',
        fare: 30,
        availableSeats: 18
      },
      {
        id: 'bus3',
        busNumber: 'CTU-305',
        departureTime: '01:00 PM',
        arrivalTime: '01:45 PM',
        fare: 30,
        availableSeats: 32
      }
    ];
    
    // Save available buses to session data
    await updateSessionData(telegramId, { 
      ticketBooking: { 
        ...user.sessionData.ticketBooking,
        availableBuses 
      } 
    });
    
    // Create keyboard for bus selection
    const keyboard = [];
    availableBuses.forEach((bus, index) => {
      keyboard.push([
        Markup.button.callback(
          `${bus.busNumber} (${bus.departureTime} - ${bus.arrivalTime}) ₹${bus.fare * passengers}`,
          `ticket_bus_${index}`
        )
      ]);
    });
    
    // Add back button
    keyboard.push([
      Markup.button.callback(
        '⬅️ Back to Passenger Selection',
        'ticket_back_to_passengers'
      )
    ]);
    
    // Send message with inline keyboard
    await ctx.editMessageText(
      `Available buses from ${source} to ${destination} for ${passengers} passenger(s):`,
      Markup.inlineKeyboard(keyboard)
    );
    
    // Update user state
    await updateState(telegramId, 'TICKET_SELECTING_BUS');
  } catch (error) {
    console.error('Error in showAvailableBuses:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Show booking confirmation
 * @param {Object} ctx - Telegram context
 */
const showBookingConfirmation = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    const { source, destination, passengers, selectedBus } = user.sessionData.ticketBooking;
    const totalFare = selectedBus.fare * passengers;
    
    // Create confirmation message
    const confirmationMessage = `Please confirm your booking:
    
From: ${source}
To: ${destination}
Bus: ${selectedBus.busNumber}
Departure: ${selectedBus.departureTime}
Arrival: ${selectedBus.arrivalTime}
Passengers: ${passengers}
Total Fare: ₹${totalFare}`;
    
    // Create keyboard for confirmation
    const keyboard = [
      [
        Markup.button.callback('✅ Confirm Booking', 'ticket_confirm'),
        Markup.button.callback('❌ Cancel', 'ticket_cancel')
      ]
    ];
    
    // Send message with inline keyboard
    await ctx.editMessageText(
      confirmationMessage,
      Markup.inlineKeyboard(keyboard)
    );
    
    // Update user state
    await updateState(telegramId, 'TICKET_CONFIRMING');
  } catch (error) {
    console.error('Error in showBookingConfirmation:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Show payment options
 * @param {Object} ctx - Telegram context
 */
const showPaymentOptions = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    const { source, destination, passengers, selectedBus } = user.sessionData.ticketBooking;
    const totalFare = selectedBus.fare * passengers;
    
    // Create payment message
    const paymentMessage = `Please select a payment method:
    
From: ${source}
To: ${destination}
Bus: ${selectedBus.busNumber}
Departure: ${selectedBus.departureTime}
Arrival: ${selectedBus.arrivalTime}
Passengers: ${passengers}
Total Fare: ₹${totalFare}`;
    
    // Create keyboard for payment options
    const keyboard = [
      [
        Markup.button.callback('💳 Credit/Debit Card', 'ticket_payment_card'),
        Markup.button.callback('📱 UPI', 'ticket_payment_upi')
      ],
      [
        Markup.button.callback('🏦 Net Banking', 'ticket_payment_netbanking'),
        Markup.button.callback('💵 Cash on Bus', 'ticket_payment_cash')
      ],
      [
        Markup.button.callback('❌ Cancel', 'ticket_cancel')
      ]
    ];
    
    // Send message with inline keyboard
    await ctx.editMessageText(
      paymentMessage,
      Markup.inlineKeyboard(keyboard)
    );
    
    // Update user state
    await updateState(telegramId, 'TICKET_SELECTING_PAYMENT');
  } catch (error) {
    console.error('Error in showPaymentOptions:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Process payment (mock)
 * @param {Object} ctx - Telegram context
 * @param {string} paymentMethod - Selected payment method
 */
const processPayment = async (ctx, paymentMethod) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Show processing message
    await ctx.editMessageText('Processing payment...');
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Show payment success message
    await ctx.editMessageText(`Payment successful! Your payment of ₹${user.sessionData.ticketBooking.selectedBus.fare * user.sessionData.ticketBooking.passengers} has been processed via ${paymentMethod}.`);
    
    // Simulate ticket generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Save payment method to session data
    await updateSessionData(telegramId, { 
      ticketBooking: { 
        ...user.sessionData.ticketBooking,
        paymentMethod,
        paymentId: 'PAY' + Math.random().toString(36).substr(2, 9).toUpperCase()
      } 
    });
    
    // Process booking after payment
    await processBooking(ctx);
  } catch (error) {
    console.error('Error in processPayment:', error);
    await ctx.reply('Sorry, something went wrong with the payment. Please try again.');
  }
};

/**
 * Process booking and generate ticket
 * @param {Object} ctx - Telegram context
 */
const processBooking = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    const { source, destination, passengers, selectedBus, paymentMethod, paymentId } = user.sessionData.ticketBooking;
    const totalFare = selectedBus.fare * passengers;
    
    // Calculate validUntil date (24 hours from now for a one-day ticket)
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 24);
    
    // Generate a route number based on source and destination
    const routeNumber = `R${source.replace(/[^0-9]/g, '')}${destination.replace(/[^0-9]/g, '')}`;
    
    // Create new ticket in database
    const ticket = new Ticket({
      userId: user._id,
      source,
      destination,
      busNumber: selectedBus.busNumber,
      routeNumber: routeNumber || 'CTU-R1', // Fallback if route number generation fails
      passengers,
      fare: totalFare,
      paymentStatus: 'completed',
      paymentId: paymentId || 'PAY' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      issuedAt: new Date(),
      validUntil: validUntil
    });
    
    await ticket.save();
    
    // Generate QR code for ticket
    const ticketData = {
      id: ticket._id.toString(),
      source,
      destination,
      busNumber: selectedBus.busNumber,
      departureTime: selectedBus.departureTime,
      passengers,
      issuedAt: new Date().toISOString(),
      validUntil: validUntil.toISOString()
    };
    
    const qrCodeUrl = await generateQRCode(JSON.stringify(ticketData));
    
    // Save QR code URL to ticket
    ticket.qrCode = qrCodeUrl;
    await ticket.save();
    
    // Create ticket message
    const ticketMessage = `🎫 Ticket Confirmed!
    
From: ${source}
To: ${destination}
Bus: ${selectedBus.busNumber}
Route: ${ticket.routeNumber}
Departure: ${selectedBus.departureTime}
Arrival: ${selectedBus.arrivalTime}
Passengers: ${passengers}
Total Fare: ₹${totalFare}
Payment Method: ${paymentMethod || 'Online'}
Ticket ID: ${ticket._id.toString().substring(0, 8)}
Valid Until: ${validUntil.toLocaleString()}

Please show this ticket or QR code to the conductor.`;
    
    // Send ticket with QR code
    await ctx.editMessageText(ticketMessage);
    
    // Create a mock QR code message since we can't actually serve the file in this demo
    await ctx.reply('Here is your ticket QR code:');
    await ctx.reply(`[QR Code for Ticket ${ticket._id.toString().substring(0, 8)}]`);
    
    // Send follow-up message with options
    await ctx.reply(
      'Thank you for booking with CTU Transport!',
      Markup.inlineKeyboard([
        [Markup.button.callback('🎫 Book Another Ticket', 'ticket_buy')],
        [Markup.button.callback('🏠 Back to Main Menu', 'back_to_menu')]
      ])
    );
    
    // Update user state
    await updateState(telegramId, 'TICKET_BOOKED');
    
    // Automatically show main services after a short delay
    setTimeout(async () => {
      try {
        await showMainServices(ctx);
      } catch (error) {
        console.error('Error showing main services:', error);
      }
    }, 3000);
  } catch (error) {
    console.error('Error in processBooking:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Show main services menu
 * @param {Object} ctx - Telegram context
 */
const showMainServices = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    // const language = user?.language || 'english';
    
    // Create keyboard for main services
    // const keyboard = [
    //   [Markup.button.callback('🎫 Buy Bus Ticket', 'ticket_buy')],
    //   [Markup.button.callback('🔍 View Purchased Tickets', 'ticket_view')],
    //   [Markup.button.callback('🚌 Track Bus', 'track_bus')],
    //   [Markup.button.callback('🗺️ Find Route', 'find_route')],
    //   [Markup.button.callback('📱 Buy Bus Pass', 'buy_pass')],
    //   [Markup.button.callback('⚙️ Settings', 'settings')]
    // ];
    
    // // Localize button text based on language
    // if (language === 'hindi') {
    //   keyboard[0][0] = Markup.button.callback('🎫 बस टिकट खरीदें', 'ticket_buy');
    //   keyboard[1][0] = Markup.button.callback('🔍 खरीदे गए टिकट देखें', 'ticket_view');
    //   keyboard[2][0] = Markup.button.callback('🚌 बस ट्रैक करें', 'track_bus');
    //   keyboard[3][0] = Markup.button.callback('🗺️ मार्ग खोजें', 'find_route');
    //   keyboard[4][0] = Markup.button.callback('📱 बस पास खरीदें', 'buy_pass');
    //   keyboard[5][0] = Markup.button.callback('⚙️ सेटिंग्स', 'settings');
    // } else if (language === 'punjabi') {
    //   keyboard[0][0] = Markup.button.callback('🎫 ਬੱਸ ਟਿਕਟ ਖਰੀਦੋ', 'ticket_buy');
    //   keyboard[1][0] = Markup.button.callback('🔍 ਖਰੀਦੇ ਗਏ ਟਿਕਟ ਵੇਖੋ', 'ticket_view');
    //   keyboard[2][0] = Markup.button.callback('🚌 ਬੱਸ ਟਰੈਕ ਕਰੋ', 'track_bus');
    //   keyboard[3][0] = Markup.button.callback('🗺️ ਰੂਟ ਲੱਭੋ', 'find_route');
    //   keyboard[4][0] = Markup.button.callback('📱 ਬੱਸ ਪਾਸ ਖਰੀਦੋ', 'buy_pass');
    //   keyboard[5][0] = Markup.button.callback('⚙️ ਸੈਟਿੰਗਜ਼', 'settings');
    // }
    
    // // Send message with inline keyboard
    // await ctx.reply(
    //   '🚌 CTU Transport Services',
    //   Markup.inlineKeyboard(keyboard)
    // );
    
    // Update user state
    await updateState(telegramId, 'MAIN_MENU');
  } catch (error) {
    console.error('Error in showMainServices:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

// Export functions
module.exports = {
  startTicketBooking,
  showSourceRegionSelection,
  showSourceLocations,
  showDestinationRegionSelection,
  showDestinationLocations,
  showPassengerSelection,
  showAvailableBuses,
  showBookingConfirmation,
  showPaymentOptions,
  processPayment,
  processBooking,
  handleTicketCallbacks,
  showPurchasedTickets,
  showMainServices
};
