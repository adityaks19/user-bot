/**
 * Message handler utility for localization
 */

// Define messages in different languages
const messages = {
  // Ticket booking messages
  ticket_options: {
    english: 'What would you like to do?',
    hindi: 'आप क्या करना चाहेंगे?',
    punjabi: 'ਤੁਸੀਂ ਕੀ ਕਰਨਾ ਚਾਹੋਗੇ?'
  },
  select_source_region: {
    english: 'Please select the region of your source location:',
    hindi: 'कृपया अपने स्रोत स्थान का क्षेत्र चुनें:',
    punjabi: 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਸਰੋਤ ਸਥਾਨ ਦਾ ਖੇਤਰ ਚੁਣੋ:'
  },
  select_source_location: {
    english: 'Please select your source location:',
    hindi: 'कृपया अपना स्रोत स्थान चुनें:',
    punjabi: 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਸਰੋਤ ਸਥਾਨ ਚੁਣੋ:'
  },
  select_destination_region: {
    english: 'Please select the region of your destination:',
    hindi: 'कृपया अपने गंतव्य का क्षेत्र चुनें:',
    punjabi: 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਮੰਜ਼ਿਲ ਦਾ ਖੇਤਰ ਚੁਣੋ:'
  },
  select_destination_location: {
    english: 'Please select your destination:',
    hindi: 'कृपया अपना गंतव्य चुनें:',
    punjabi: 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਮੰਜ਼ਿਲ ਚੁਣੋ:'
  },
  enter_passengers: {
    english: 'How many passengers?',
    hindi: 'कितने यात्री?',
    punjabi: 'ਕਿੰਨੇ ਯਾਤਰੀ?'
  },
  enter_specific_passengers: {
    english: 'Please enter the specific number of passengers:',
    hindi: 'कृपया यात्रियों की विशिष्ट संख्या दर्ज करें:',
    punjabi: 'ਕਿਰਪਾ ਕਰਕੇ ਯਾਤਰੀਆਂ ਦੀ ਵਿਸ਼ੇਸ਼ ਸੰਖਿਆ ਦਰਜ ਕਰੋ:'
  },
  available_buses: {
    english: 'Available buses:',
    hindi: 'उपलब्ध बसें:',
    punjabi: 'ਉਪਲਬਧ ਬੱਸਾਂ:'
  },
  no_buses_available: {
    english: 'Sorry, no buses are available for this route at the moment.',
    hindi: 'क्षमा करें, इस मार्ग के लिए अभी कोई बस उपलब्ध नहीं है।',
    punjabi: 'ਮਾਫ਼ ਕਰਨਾ, ਇਸ ਰੂਟ ਲਈ ਇਸ ਸਮੇਂ ਕੋਈ ਬੱਸ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।'
  },
  payment_link: {
    english: 'Please complete payment using this link:',
    hindi: 'कृपया इस लिंक का उपयोग करके भुगतान पूरा करें:',
    punjabi: 'ਕਿਰਪਾ ਕਰਕੇ ਇਸ ਲਿੰਕ ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਭੁਗਤਾਨ ਪੂਰਾ ਕਰੋ:'
  },
  select_ticket_to_view: {
    english: 'Select a ticket to view details:',
    hindi: 'विवरण देखने के लिए एक टिकट चुनें:',
    punjabi: 'ਵੇਰਵੇ ਵੇਖਣ ਲਈ ਇੱਕ ਟਿਕਟ ਚੁਣੋ:'
  },
  ticket_qr_code: {
    english: 'Here is your ticket QR code:',
    hindi: 'यहां आपका टिकट QR कोड है:',
    punjabi: 'ਇੱਥੇ ਤੁਹਾਡਾ ਟਿਕਟ QR ਕੋਡ ਹੈ:'
  },
  
  // Navigation buttons
  back_to_main: {
    english: 'Back to Main Menu',
    hindi: 'मुख्य मेनू पर वापस जाएं',
    punjabi: 'ਮੁੱਖ ਮੇਨੂ ਤੇ ਵਾਪਸ ਜਾਓ'
  },
  back_to_ticket_menu: {
    english: 'Back to Ticket Menu',
    hindi: 'टिकट मेनू पर वापस जाएं',
    punjabi: 'ਟਿਕਟ ਮੇਨੂ ਤੇ ਵਾਪਸ ਜਾਓ'
  },
  back_to_regions: {
    english: 'Back to Regions',
    hindi: 'क्षेत्रों पर वापस जाएं',
    punjabi: 'ਖੇਤਰਾਂ ਤੇ ਵਾਪਸ ਜਾਓ'
  },
  back_to_source: {
    english: 'Back to Source Selection',
    hindi: 'स्रोत चयन पर वापस जाएं',
    punjabi: 'ਸਰੋਤ ਚੋਣ ਤੇ ਵਾਪਸ ਜਾਓ'
  },
  back_to_destination: {
    english: 'Back to Destination Selection',
    hindi: 'गंतव्य चयन पर वापस जाएं',
    punjabi: 'ਮੰਜ਼ਿਲ ਚੋਣ ਤੇ ਵਾਪਸ ਜਾਓ'
  },
  back_to_passengers: {
    english: 'Back to Passenger Selection',
    hindi: 'यात्री चयन पर वापस जाएं',
    punjabi: 'ਯਾਤਰੀ ਚੋਣ ਤੇ ਵਾਪਸ ਜਾਓ'
  },
  back_to_ticket_list: {
    english: 'Back to Ticket List',
    hindi: 'टिकट सूची पर वापस जाएं',
    punjabi: 'ਟਿਕਟ ਸੂਚੀ ਤੇ ਵਾਪਸ ਜਾਓ'
  },
  back: {
    english: 'Back',
    hindi: 'वापस',
    punjabi: 'ਵਾਪਸ'
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

module.exports = {
  getLocalizedMessage
};
