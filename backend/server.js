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
        name: 'Mumbai',
        displayName: 'Mumbai',
        description: 'The City of Dreams - Financial capital of India',
        image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800',
        tagline: 'Experience the vibrant energy of India\'s financial capital'
      },
      {
        name: 'Delhi',
        displayName: 'Delhi',
        description: 'The heart of India - Rich history and culture',
        image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800',
        tagline: 'Discover the historic capital of India'
      },
      {
        name: 'Bangalore',
        displayName: 'Bangalore',
        description: 'The Silicon Valley of India - Tech hub and Garden City',
        image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800',
        tagline: 'Explore the tech capital with perfect weather'
      },
      {
        name: 'Goa',
        displayName: 'Goa',
        description: 'Beach paradise - Sun, sand, and Portuguese heritage',
        image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800',
        tagline: 'Relax on pristine beaches and enjoy the vibrant nightlife'
      },
      {
        name: 'Jaipur',
        displayName: 'Jaipur',
        description: 'The Pink City - Royal heritage and magnificent forts',
        image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800',
        tagline: 'Step into the royal history of Rajasthan'
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
