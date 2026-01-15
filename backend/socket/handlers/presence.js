module.exports = (io, socket, onlineUsers) => {
  
  // Get online users in a specific city
  socket.on('get-city-online-users', async (data) => {
    try {
      const { cityId } = data;

      if (!cityId) {
        return socket.emit('error', { message: 'City ID is required' });
      }

      const CityMembership = require('../../models/CityMembership');

      // Get all members of the city
      const memberships = await CityMembership.find({ city_id: cityId })
        .populate('user_id', 'username full_name profile_photo_url');

      // Filter for online users
      const onlineMembers = memberships
        .filter(m => onlineUsers.has(m.user_id._id.toString()))
        .map(m => ({
          userId: m.user_id._id,
          username: m.user_id.username,
          full_name: m.user_id.full_name,
          profile_photo_url: m.user_id.profile_photo_url
        }));

      socket.emit('city-online-users', {
        cityId,
        count: onlineMembers.length,
        users: onlineMembers
      });

    } catch (error) {
      console.error('Error getting city online users:', error);
      socket.emit('error', { message: 'Failed to get online users' });
    }
  });

  // Get online users in a private chat
  socket.on('get-chat-online-users', async (data) => {
    try {
      const { chatId } = data;

      if (!chatId) {
        return socket.emit('error', { message: 'Chat ID is required' });
      }

      const PrivateChatParticipant = require('../../models/PrivateChatParticipant');

      // Get all participants of the chat
      const participants = await PrivateChatParticipant.find({ chat_id: chatId })
        .populate('user_id', 'username full_name profile_photo_url');

      // Filter for online users
      const onlineParticipants = participants
        .filter(p => onlineUsers.has(p.user_id._id.toString()))
        .map(p => ({
          userId: p.user_id._id,
          username: p.user_id.username,
          full_name: p.user_id.full_name,
          profile_photo_url: p.user_id.profile_photo_url,
          role: p.role
        }));

      socket.emit('chat-online-users', {
        chatId,
        count: onlineParticipants.length,
        users: onlineParticipants
      });

    } catch (error) {
      console.error('Error getting chat online users:', error);
      socket.emit('error', { message: 'Failed to get online users' });
    }
  });

  // User presence heartbeat
  socket.on('heartbeat', () => {
    socket.emit('heartbeat-ack', { timestamp: Date.now() });
  });

  // Get user's online status
  socket.on('check-user-online', (data) => {
    try {
      const { userId } = data;

      if (!userId) {
        return socket.emit('error', { message: 'User ID is required' });
      }

      const isOnline = onlineUsers.has(userId);

      socket.emit('user-online-status', {
        userId,
        isOnline
      });

    } catch (error) {
      console.error('Error checking user online status:', error);
    }
  });

  // Get total online users count
  socket.on('get-online-count', () => {
    socket.emit('online-users', onlineUsers.size);
  });
};
