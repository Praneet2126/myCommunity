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
        name: 'Shimla',
        displayName: 'Shimla',
        description: 'The Queen of Hills - Colonial charm and mountain beauty',
        image: 'https://images.unsplash.com/photo-1645610913343-b7717f7eec1e?w=800',
        tagline: 'Escape to the refreshing hills of Himachal'
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
      },
      {
        name: 'Chennai',
        displayName: 'Chennai',
        description: 'The Gateway to South India - Culture, temples, and Marina Beach',
        image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
        tagline: 'Dive into the rich Dravidian culture and heritage'
      },
      {
        name: 'Kolkata',
        displayName: 'Kolkata',
        description: 'The City of Joy - Art, literature, and colonial architecture',
        image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800',
        tagline: 'Experience the cultural capital of India'
      },
      {
        name: 'Hyderabad',
        displayName: 'Hyderabad',
        description: 'The City of Pearls - IT hub with royal Nizami heritage',
        image: 'https://images.unsplash.com/photo-1621909321963-2276c9660298?w=800',
        tagline: 'Discover the perfect blend of tradition and technology'
      },
      {
        name: 'Pune',
        displayName: 'Pune',
        description: 'The Oxford of the East - Education hub and IT city',
        image: 'https://images.unsplash.com/photo-1573547901839-e0aeecdcac29?w=800',
        tagline: 'Explore the cultural and educational heart of Maharashtra'
      },
    {
        name: 'Kochi',
        displayName: 'Kochi',
        description: 'The Queen of Arabian Sea - Spice trade and backwaters',
        image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800',
        tagline: 'Sail through the serene backwaters of Kerala'
      },
      {
        name: 'Ahmedabad',
        displayName: 'Ahmedabad',
        description: 'UNESCO World Heritage City - Textile capital and Gandhi\'s legacy',
        image: 'https://images.unsplash.com/photo-1693629704084-0f4600ba9ffd?w=800',
        tagline: 'Walk through India\'s first UNESCO World Heritage City'
      },
      {
        name: 'Udaipur',
        displayName: 'Udaipur',
        description: 'The City of Lakes - Romantic palaces and stunning sunsets',
        image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800',
        tagline: 'Experience the most romantic city in India'
      },
      {
        name: 'Varanasi',
        displayName: 'Varanasi',
        description: 'The Spiritual Capital - Ancient ghats and Hindu spirituality',
        image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800',
        tagline: 'Witness the eternal spiritual heart of India'
      },
      {
        name: 'Agra',
        displayName: 'Agra',
        description: 'Home of the Taj Mahal - Mughal architecture and heritage',
        image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800',
        tagline: 'Marvel at one of the Seven Wonders of the World'
      },
      {
        name: 'Mysore',
        displayName: 'Mysore',
        description: 'The City of Palaces - Royal heritage and sandalwood',
        image: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800',
        tagline: 'Experience the grandeur of Karnataka\'s royal past'
      },
      {
        name: 'Chandigarh',
        displayName: 'Chandigarh',
        description: 'The City Beautiful - Planned city and modern architecture',
        image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800',
        tagline: 'Discover India\'s best-planned city'
      },
      {
        name: 'Rishikesh',
        displayName: 'Rishikesh',
        description: 'The Yoga Capital - Ganges, adventure sports, and spirituality',
        image: 'https://images.unsplash.com/photo-1718528565878-7fd7c72f5196?w=800',
        tagline: 'Find peace in the yoga capital of the world'
      },
      {
        name: 'Amritsar',
        displayName: 'Amritsar',
        description: 'Home of Golden Temple - Sikh heritage and Punjabi culture',
        image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800',
        tagline: 'Experience the spiritual heart of Punjab'
      },
      {
        name: 'Manali',
        displayName: 'Manali',
        description: 'Adventure Haven - Snow-capped peaks and valley of gods',
        image: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=800',
        tagline: 'Seek adventure in the Himalayan paradise'
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
