require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const initializeSocket = require('./config/socket');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

// MongoDB connection
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cities', require('./routes/cities'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/events', require('./routes/events'));

// Seed cities endpoint (for development)
app.post('/api/cities/seed', async (req, res, next) => {
  try {
    const City = require('./models/City');
    const CityChat = require('./models/CityChat');

    const cities = [
    
      {
        name: 'Kolkata',
        displayName: 'Kolkata',
        description: 'The City of Joy - Cultural capital',
        image: 'https://unsplash.com/photos/a-large-bridge-spanning-over-a-large-body-of-water-5-eNnQ4fEvk',
        tagline: 'Experience the rich heritage of Kolkata'
      }
    ];

    // Clear existing cities and city chats
    await City.deleteMany({});
    await CityChat.deleteMany({});

    // Insert cities
    const insertedCities = await City.insertMany(cities);

    // Create city chats for each city
    const cityChats = insertedCities.map(city => ({
      city_id: city._id
    }));
    await CityChat.insertMany(cityChats);

    res.status(201).json({
      success: true,
      message: 'Cities seeded successfully',
      count: insertedCities.length,
      data: insertedCities
    });
  } catch (error) {
    next(error);
  }
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Initialize Socket.io
const io = initializeSocket(server);

// Make io accessible to routes if needed
app.set('io', io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`✅ Health check available at http://localhost:${PORT}/health`);
  console.log(`⚡ WebSocket server initialized`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
});
