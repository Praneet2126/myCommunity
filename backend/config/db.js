const mongoose = require('mongoose');

const connectDB = async () => {
  // Check if MONGODB_URI is provided
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not found in environment variables.');
    console.warn('⚠️  MongoDB connection skipped. Server will run without database.');
    console.warn('⚠️  To enable MongoDB, create a .env file with MONGODB_URI=mongodb://your-connection-string');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.warn('⚠️  Server will continue without database connection.');
    // Don't exit - allow server to run without DB for frontend-only development
  }
};

module.exports = connectDB;
