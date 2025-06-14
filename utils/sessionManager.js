/**
 * Session manager utility for handling user state and session data
 */

const User = require('../models/User');

/**
 * Update user state
 * @param {string} telegramId - Telegram user ID
 * @param {string} state - New state
 * @returns {Promise} - Promise resolving to updated user
 */
const updateState = async (telegramId, state) => {
  try {
    const user = await User.findOneAndUpdate(
      { telegramId: telegramId.toString() },
      { currentState: state },
      { new: true }
    );
    
    return user;
  } catch (error) {
    console.error('Error updating user state:', error);
    throw error;
  }
};

/**
 * Update session data
 * @param {string} telegramId - Telegram user ID
 * @param {Object} data - Session data to update
 * @returns {Promise} - Promise resolving to updated user
 */
const updateSessionData = async (telegramId, data) => {
  try {
    const user = await User.findOne({ telegramId: telegramId.toString() });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Merge new data with existing session data
    const sessionData = {
      ...user.sessionData,
      ...data
    };
    
    // Update user with new session data
    const updatedUser = await User.findOneAndUpdate(
      { telegramId: telegramId.toString() },
      { sessionData },
      { new: true }
    );
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating session data:', error);
    throw error;
  }
};

/**
 * Clear session data
 * @param {string} telegramId - Telegram user ID
 * @returns {Promise} - Promise resolving to updated user
 */
const clearSessionData = async (telegramId) => {
  try {
    const user = await User.findOneAndUpdate(
      { telegramId: telegramId.toString() },
      { sessionData: {} },
      { new: true }
    );
    
    return user;
  } catch (error) {
    console.error('Error clearing session data:', error);
    throw error;
  }
};

module.exports = {
  updateState,
  updateSessionData,
  clearSessionData
};
