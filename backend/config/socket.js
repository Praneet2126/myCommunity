const socketIO = require('socket.io');
const { verifyToken } = require('./jwt');
const User = require('../models/User');

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token is required'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      if (!user.is_active) {
        return next(new Error('Account is deactivated'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  // Store online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

    // Add user to online users
    onlineUsers.set(socket.user._id.toString(), {
      socketId: socket.id,
      username: socket.user.username,
      userId: socket.user._id
    });

    // Broadcast online users count
    io.emit('online-users', onlineUsers.size);

    // Import and register handlers
    require('../socket/handlers/cityChat')(io, socket);
    require('../socket/handlers/privateChat')(io, socket);
    require('../socket/handlers/presence')(io, socket, onlineUsers);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.username} (${socket.id})`);
      onlineUsers.delete(socket.user._id.toString());
      io.emit('online-users', onlineUsers.size);
      
      // Notify rooms about user going offline
      socket.broadcast.emit('user-offline', {
        userId: socket.user._id,
        username: socket.user.username
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.user.username}:`, error);
    });
  });

  return io;
};

module.exports = initializeSocket;
