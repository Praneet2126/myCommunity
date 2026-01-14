require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  age: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// User Model
const User = mongoose.model('User', userSchema);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// API endpoint to create collection and add dummy data
app.post('/api/users/seed', async (req, res) => {
  try {
    // Dummy data
    const dummyUsers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 28
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        age: 32
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        age: 25
      },
      {
        name: 'Alice Williams',
        email: 'alice.williams@example.com',
        age: 30
      },
      {
        name: 'Charlie Brown',
        email: 'charlie.brown@example.com',
        age: 27
      }
    ];

    // Clear existing data (optional - for testing)
    await User.deleteMany({});

    // Insert dummy data
    const insertedUsers = await User.insertMany(dummyUsers);

    res.status(201).json({
      success: true,
      message: 'Dummy data inserted successfully',
      count: insertedUsers.length,
      data: insertedUsers
    });
  } catch (error) {
    console.error('Error inserting dummy data:', error);
    res.status(500).json({
      success: false,
      message: 'Error inserting dummy data',
      error: error.message
    });
  }
});

// API endpoint to get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
