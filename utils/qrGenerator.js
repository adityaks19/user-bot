/**
 * QR code generator utility
 */

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Generate QR code for ticket
 * @param {Object|string} data - Data to encode in QR code
 * @returns {Promise<string>} - Promise resolving to QR code file path
 */
const generateQRCode = async (data) => {
  try {
    // Convert data to string if it's an object
    const dataString = typeof data === 'object' ? JSON.stringify(data) : data;
    
    // Create directory for QR codes if it doesn't exist
    const qrDir = path.join(__dirname, '../public/qrcodes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
    
    // Generate a unique filename
    const filename = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.png`;
    const filePath = path.join(qrDir, filename);
    
    // Generate QR code and save to file
    await QRCode.toFile(filePath, dataString, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // Return the relative path to the QR code file
    return `/qrcodes/${filename}`;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

module.exports = {
  generateQRCode
};
