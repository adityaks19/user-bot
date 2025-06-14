const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 */
const connectDB = async () => {
  try {
    // Use MongoDB Atlas connection string from environment variables
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true
    });
    
    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB Atlas: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
