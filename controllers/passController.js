const User = require('../models/User');
const Pass = require('../models/Pass');
const { Markup } = require('telegraf');
const { getLocalizedMessage } = require('../utils/messageHandler');
const { updateState, updateSessionData } = require('../utils/sessionManager');
const { generateQRCode } = require('../utils/qrGenerator');

// Pass types with their details
const passTypes = {
  daily_ac: {
    name: 'Daily Pass (AC)',
    validityDays: 1,
    fare: 60
  },
  daily_nonac: {
    name: 'Daily Pass (Non-AC)',
    validityDays: 1,
    fare: 40
  },
  monthly_ac: {
    name: 'Monthly Pass (AC)',
    validityDays: 30,
    fare: 800
  },
  monthly_nonac: {
    name: 'Monthly Pass (Non-AC)',
    validityDays: 30,
    fare: 600
  },
  student: {
    name: 'Student Pass',
    validityDays: 30,
    fare: 300,
    requiresDocuments: true
  },
  senior: {
    name: 'Senior Citizen Pass',
    validityDays: 30,
    fare: 300,
    requiresDocuments: true
  }
};

/**
 * Start pass purchase flow
 * @param {Object} ctx - Telegram context
 */
const startPassPurchase = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Clear any existing session data for pass purchase
    await updateSessionData(telegramId, { passPurchase: {} });
    
    // Create bus type selection buttons based on language
    let keyboard;
    
    if (language === 'english') {
      keyboard = [
        [Markup.button.callback('🚌 AC Bus', 'pass_bus_ac')],
        [Markup.button.callback('🚌 Non-AC Bus', 'pass_bus_nonac')],
        [Markup.button.callback('🏠 Back to Main Menu', 'back_to_menu')]
      ];
    } else if (language === 'hindi') {
      keyboard = [
        [Markup.button.callback('🚌 एसी बस', 'pass_bus_ac')],
        [Markup.button.callback('🚌 नॉन-एसी बस', 'pass_bus_nonac')],
        [Markup.button.callback('🏠 मुख्य मेनू पर वापस जाएं', 'back_to_menu')]
      ];
    } else if (language === 'punjabi') {
      keyboard = [
        [Markup.button.callback('🚌 ਏਸੀ ਬੱਸ', 'pass_bus_ac')],
        [Markup.button.callback('🚌 ਨਾਨ-ਏਸੀ ਬੱਸ', 'pass_bus_nonac')],
        [Markup.button.callback('🏠 ਮੁੱਖ ਮੇਨੂ ਤੇ ਵਾਪਸ ਜਾਓ', 'back_to_menu')]
      ];
    }
    
    // Ask for bus type with inline keyboard
    const busTypeText = {
      english: 'Please select bus type for your pass:',
      hindi: 'कृपया अपने पास के लिए बस प्रकार चुनें:',
      punjabi: 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਪਾਸ ਲਈ ਬੱਸ ਦੀ ਕਿਸਮ ਚੁਣੋ:'
    };
    
    await ctx.reply(
      busTypeText[language] || busTypeText.english,
      Markup.inlineKeyboard(keyboard)
    );
    
    // Update user state
    await updateState(telegramId, 'PASS_SELECTING_BUS_TYPE');
  } catch (error) {
    console.error('Error in startPassPurchase:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Show pass types based on bus type
 * @param {Object} ctx - Telegram context
 * @param {string} busType - Selected bus type (ac or nonac)
 */
const showPassTypes = async (ctx, busType) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Save bus type to session data
    await updateSessionData(telegramId, { 
      passPurchase: { 
        busType
      } 
    });
    
    // Create pass type buttons based on language and bus type
    let keyboard;
    
    if (language === 'english') {
      keyboard = [
        [Markup.button.callback('🎟️ Daily Pass', `pass_type_daily_${busType}`)],
        [Markup.button.callback('🎟️ Monthly Pass', `pass_type_monthly_${busType}`)],
        [Markup.button.callback('🎓 Student Pass', 'pass_type_student')],
        [Markup.button.callback('👵 Senior Citizen Pass', 'pass_type_senior')],
        [Markup.button.callback('⬅️ Back', 'pass_back_to_bus_type')],
        [Markup.button.callback('🏠 Back to Main Menu', 'back_to_menu')]
      ];
    } else if (language === 'hindi') {
      keyboard = [
        [Markup.button.callback('🎟️ दैनिक पास', `pass_type_daily_${busType}`)],
        [Markup.button.callback('🎟️ मासिक पास', `pass_type_monthly_${busType}`)],
        [Markup.button.callback('🎓 छात्र पास', 'pass_type_student')],
        [Markup.button.callback('👵 वरिष्ठ नागरिक पास', 'pass_type_senior')],
        [Markup.button.callback('⬅️ वापस', 'pass_back_to_bus_type')],
        [Markup.button.callback('🏠 मुख्य मेनू पर वापस जाएं', 'back_to_menu')]
      ];
    } else if (language === 'punjabi') {
      keyboard = [
        [Markup.button.callback('🎟️ ਰੋਜ਼ਾਨਾ ਪਾਸ', `pass_type_daily_${busType}`)],
        [Markup.button.callback('🎟️ ਮਹੀਨਾਵਾਰ ਪਾਸ', `pass_type_monthly_${busType}`)],
        [Markup.button.callback('🎓 ਵਿਦਿਆਰਥੀ ਪਾਸ', 'pass_type_student')],
        [Markup.button.callback('👵 ਸੀਨੀਅਰ ਸਿਟੀਜ਼ਨ ਪਾਸ', 'pass_type_senior')],
        [Markup.button.callback('⬅️ ਵਾਪਸ', 'pass_back_to_bus_type')],
        [Markup.button.callback('🏠 ਮੁੱਖ ਮੇਨੂ ਤੇ ਵਾਪਸ ਜਾਓ', 'back_to_menu')]
      ];
    }
    
    // Add prices to pass types
    const passTypeText = {
      english: `Please select pass type for ${busType === 'ac' ? 'AC' : 'Non-AC'} bus:`,
      hindi: `कृपया ${busType === 'ac' ? 'एसी' : 'नॉन-एसी'} बस के लिए पास प्रकार चुनें:`,
      punjabi: `ਕਿਰਪਾ ਕਰਕੇ ${busType === 'ac' ? 'ਏਸੀ' : 'ਨਾਨ-ਏਸੀ'} ਬੱਸ ਲਈ ਪਾਸ ਦੀ ਕਿਸਮ ਚੁਣੋ:`
    };
    
    // Update keyboard with prices
    if (language === 'english') {
      keyboard[0][0] = Markup.button.callback(`🎟️ Daily Pass (₹${passTypes[`daily_${busType}`].fare})`, `pass_type_daily_${busType}`);
      keyboard[1][0] = Markup.button.callback(`🎟️ Monthly Pass (₹${passTypes[`monthly_${busType}`].fare})`, `pass_type_monthly_${busType}`);
      keyboard[2][0] = Markup.button.callback(`🎓 Student Pass (₹${passTypes.student.fare})`, 'pass_type_student');
      keyboard[3][0] = Markup.button.callback(`👵 Senior Citizen Pass (₹${passTypes.senior.fare})`, 'pass_type_senior');
    } else if (language === 'hindi') {
      keyboard[0][0] = Markup.button.callback(`🎟️ दैनिक पास (₹${passTypes[`daily_${busType}`].fare})`, `pass_type_daily_${busType}`);
      keyboard[1][0] = Markup.button.callback(`🎟️ मासिक पास (₹${passTypes[`monthly_${busType}`].fare})`, `pass_type_monthly_${busType}`);
      keyboard[2][0] = Markup.button.callback(`🎓 छात्र पास (₹${passTypes.student.fare})`, 'pass_type_student');
      keyboard[3][0] = Markup.button.callback(`👵 वरिष्ठ नागरिक पास (₹${passTypes.senior.fare})`, 'pass_type_senior');
    } else if (language === 'punjabi') {
      keyboard[0][0] = Markup.button.callback(`🎟️ ਰੋਜ਼ਾਨਾ ਪਾਸ (₹${passTypes[`daily_${busType}`].fare})`, `pass_type_daily_${busType}`);
      keyboard[1][0] = Markup.button.callback(`🎟️ ਮਹੀਨਾਵਾਰ ਪਾਸ (₹${passTypes[`monthly_${busType}`].fare})`, `pass_type_monthly_${busType}`);
      keyboard[2][0] = Markup.button.callback(`🎓 ਵਿਦਿਆਰਥੀ ਪਾਸ (₹${passTypes.student.fare})`, 'pass_type_student');
      keyboard[3][0] = Markup.button.callback(`👵 ਸੀਨੀਅਰ ਸਿਟੀਜ਼ਨ ਪਾਸ (₹${passTypes.senior.fare})`, 'pass_type_senior');
    }
    
    await ctx.editMessageText(
      passTypeText[language] || passTypeText.english,
      Markup.inlineKeyboard(keyboard)
    );
    
    // Update user state
    await updateState(telegramId, 'PASS_SELECTING_TYPE');
  } catch (error) {
    console.error('Error in showPassTypes:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Handle pass type selection
 * @param {Object} ctx - Telegram context
 * @param {string} passType - Selected pass type
 */
const handlePassTypeSelection = async (ctx, passType) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Get pass details based on pass type
    let passDetails;
    if (passType === 'student' || passType === 'senior') {
      passDetails = passTypes[passType];
    } else {
      // For daily_ac, daily_nonac, monthly_ac, monthly_nonac
      passDetails = passTypes[passType];
    }
    
    // Save pass type and details to session data
    await updateSessionData(telegramId, { 
      passPurchase: { 
        ...user.sessionData.passPurchase,
        passType,
        passDetails,
        documentStep: 1 // Initialize document step for multi-document uploads
      } 
    });
    
    // Check if documents are required
    if (passDetails.requiresDocuments) {
      if (passType === 'senior') {
        // For senior citizens, only ask for Aadhar card
        const documentText = {
          english: `Please upload the required document for ${passDetails.name}:\n\n` +
                  'Upload your Aadhar Card (PDF only)',
          hindi: `कृपया ${passDetails.name} के लिए आवश्यक दस्तावेज़ अपलोड करें:\n\n` +
                'अपना आधार कार्ड अपलोड करें (केवल PDF)',
          punjabi: `ਕਿਰਪਾ ਕਰਕੇ ${passDetails.name} ਲਈ ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼ ਅਪਲੋਡ ਕਰੋ:\n\n` +
                  'ਆਪਣਾ ਆਧਾਰ ਕਾਰਡ ਅਪਲੋਡ ਕਰੋ (ਸਿਰਫ PDF)'
        };
        
        await ctx.editMessageText(
          documentText[language] || documentText.english,
          Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Back', 'pass_back_to_types')],
            [Markup.button.callback('🏠 Back to Main Menu', 'back_to_menu')]
          ])
        );
        
        // Set document step to 2 for senior citizens (skip college ID)
        await updateSessionData(telegramId, { 
          passPurchase: { 
            ...user.sessionData.passPurchase,
            documentStep: 2 // Skip to Aadhar card step
          } 
        });
      } else {
        // For students, ask for college ID first
        const documentText = {
          english: `Please upload the required documents for ${passDetails.name}:\n\n` +
                  'Step 1/2: Upload College/School ID Card (PDF only)',
          hindi: `कृपया ${passDetails.name} के लिए आवश्यक दस्तावेज़ अपलोड करें:\n\n` +
                'चरण 1/2: कॉलेज/स्कूल आईडी कार्ड अपलोड करें (केवल PDF)',
          punjabi: `ਕਿਰਪਾ ਕਰਕੇ ${passDetails.name} ਲਈ ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼ ਅਪਲੋਡ ਕਰੋ:\n\n` +
                  'ਕਦਮ 1/2: ਕਾਲਜ/ਸਕੂਲ ਆਈਡੀ ਕਾਰਡ ਅਪਲੋਡ ਕਰੋ (ਸਿਰਫ PDF)'
        };
        
        await ctx.editMessageText(
          documentText[language] || documentText.english,
          Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Back', 'pass_back_to_types')],
            [Markup.button.callback('🏠 Back to Main Menu', 'back_to_menu')]
          ])
        );
      }
      
      // Update user state
      await updateState(telegramId, 'PASS_UPLOADING_DOCUMENT');
    } else {
      // No documents required, show pass summary
      await showPassSummary(ctx);
    }
  } catch (error) {
    console.error('Error in handlePassTypeSelection:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
};

/**
 * Handle document upload
 * @param {Object} ctx - Telegram context
 */
const handleDocumentUpload = async (ctx) => {
  try {
    const { id: telegramId } = ctx.from;
    const user = await User.findOne({ telegramId: telegramId.toString() });
    const language = user?.language || 'english';
    
    // Check if a document was uploaded and if it's a PDF
    if (!ctx.message.document || !ctx.message.document.mime_type || !ctx.message.document.mime_type.includes('pdf')) {
      await ctx.reply(
        language === 'english' ? 'Please upload a PDF document only.' : 
        language === 'hindi' ? 'कृपया केवल PDF दस्तावेज़ अपलोड करें।' : 
        'ਕਿਰਪਾ ਕਰਕੇ ਸਿਰਫ PDF ਦਸਤਾਵੇਜ਼ ਅਪਲੋਡ ਕਰੋ।',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Back', 'pass_back_to_types')],
          [Markup.button.callback('🏠 Back to Main Menu', 'back_to_menu')]
        ])
      );
      return;
    }
    
    // Get file ID from document
    const fileId = ctx.message.document.file_id;
    const documentStep = user.sessionData.passPurchase.documentStep || 1;
    const passType = user.sessionData.passPurchase.passType;
    
    if (passType === 'senior') {
      // For senior citizens, only need Aadhar card
      await updateSessionData(telegramId, { 
        passPurchase: { 
          ...user.sessionData.passPurchase,
          aadharFileId: fileId,
          documentStep: 3 // Skip to final step
        } 
      });
      
      // Confirm document receipt - specific message for senior citizens
      await ctx.reply(
        language === 'english' ? 'Document received. Thank you!' : 
        language === 'hindi' ? 'दस्तावेज़ प्राप्त हुआ। धन्यवाद!' : 
        'ਦਸਤਾਵੇਜ਼ ਪ੍ਰਾਪਤ ਹੋਇਆ। ਧੰਨਵਾਦ!',
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Continue', 'pass_continue')],
          [Markup.button.callback('⬅️ Back', 'pass_back_to_types')],
          [Markup.button.callback('🏠 Back to Main Menu', 'back_to_menu')]
        ])
      );
      
      // Update user state
      await updateState(telegramId, 'PASS_DOCUMENT_RECEIVED');
    } else if (documentStep === 1) {
      // First document (ID Card) for student pass
      await updateSessionData(telegramId, { 
        passPurchase: { 
          ...user.sessionData.passPurchase,
          idCardFileId: fileId,
          documentStep: 2
        } 
      });
      
      // Ask for second document (Aadhar Card)
      const documentText = {
        english: 'Step 2/2: Please upload your Aadhar Card (PDF only)',
        hindi: 'चरण 2/2: कृपया अपना आधार कार्ड अपलोड करें (केवल PDF)',
        punjabi: 'ਕਦਮ 2/2: ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਆਧਾਰ ਕਾਰਡ ਅਪਲੋਡ ਕਰੋ (ਸਿਰਫ PDF)'
      };
      
      await ctx.reply(
        documentText[language] || documentText.english,
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Back', 'pass_back_to_types')],
          [Markup.button.callback('🏠 Back to Main Menu', 'back_to_menu')]
        ])
      );
      
      // Keep the same state for second document
      await updateState(telegramId, 'PASS_UPLOADING_DOCUMENT');
    } else {
      // Second document (Aadhar Card) for student pass
      await updateSessionData(telegramId, { 
        passPurchase: { 
          ...user.sessionData.passPurchase,
          aadharFileId: fileId,
          documentStep: 3
        } 
      });
      
      // Confirm documents receipt - specific message for student passes
      await ctx.reply(
        language === 'english' ? 'Both documents received. Thank you!' : 
        language === 'hindi' ? 'दोनों दस्तावेज़ प्राप्त हुए। धन्यवाद!' : 
        'ਦੋਵੇਂ ਦਸਤਾਵੇਜ਼ ਪ੍ਰਾਪਤ ਹੋਏ। ਧੰਨਵਾਦ!',
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Continue', 'pass_continue')],
          [Markup.button.callback('⬅️ Back', 'pass_back_to_types')],
          [Markup.button.callback('🏠 Back to Main Menu', 'back_to_menu')]
        ])
      );
      
      // Update user state
      await updateState(telegramId, 'PASS_DOCUMENT_RECEIVED');
    }
  } catch (error) {
    console.error('Error in handleDocumentUpload:', error);
    await ctx.reply(
      'Sorry, something went wrong. Please try again.',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Back', 'pass_back_to_types')],
        [Markup.button.callback('🏠 Back to Main Menu', 'back_to_menu')]
      ])
    );
  }
};
