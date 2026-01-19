const CityMembership = require('../../models/CityMembership');
const CityChat = require('../../models/CityChat');
const Message = require('../../models/Message');
const City = require('../../models/City');
const contentModerator = require('../../../moderation');
const fs = require('fs');

module.exports = (io, socket) => {
  
  // Join a city chat room
  socket.on('join-city-chat', async (data) => {
    try {
      const { cityId } = data;

      if (!cityId) {
        return socket.emit('error', { message: 'City ID is required' });
      }

      // Verify city exists
      const city = await City.findById(cityId);
      if (!city) {
        return socket.emit('error', { message: 'City not found' });
      }

      // Verify user is a member of the city
      const membership = await CityMembership.findOne({
        user_id: socket.user._id,
        city_id: cityId
      });

      if (!membership) {
        return socket.emit('error', { 
          message: 'You must be a member of this city to join the chat' 
        });
      }

      // Ensure CityChat exists (create if not)
      let cityChat = await CityChat.findOne({ city_id: cityId });
      if (!cityChat) {
        cityChat = new CityChat({ city_id: cityId });
        await cityChat.save();
        console.log(`📝 Created CityChat for city: ${city.name}`);
      }

      // Join the room
      const roomName = `city-${cityId}`;
      socket.join(roomName);

      // #region agent log
      fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H5',location:'backend/socket/handlers/cityChat.js:join-city-chat:joined',message:'User joined city chat room',data:{userId:socket.user._id.toString(),username:socket.user.username,cityId,roomName},timestamp:Date.now()})+'\n', 'utf8');
      // #endregion

      console.log(`👥 ${socket.user.username} joined city chat: ${city.name}`);

      // Notify others in the room
      socket.to(roomName).emit('user-joined-city-chat', {
        userId: socket.user._id,
        username: socket.user.username,
        full_name: socket.user.full_name,
        profile_photo_url: socket.user.profile_photo_url,
        cityId
      });

      // Confirm to the user
      socket.emit('joined-city-chat', {
        cityId,
        cityName: city.name,
        message: `Successfully joined ${city.name} chat`
      });

      // Update last active time
      await CityMembership.findByIdAndUpdate(membership._id, {
        last_active_at: new Date()
      });

    } catch (error) {
      console.error('Error joining city chat:', error);
      socket.emit('error', { message: 'Failed to join city chat' });
    }
  });

  // Leave a city chat room
  socket.on('leave-city-chat', async (data) => {
    try {
      const { cityId } = data;

      if (!cityId) {
        return socket.emit('error', { message: 'City ID is required' });
      }

      const roomName = `city-${cityId}`;
      socket.leave(roomName);

      // Notify others
      socket.to(roomName).emit('user-left-city-chat', {
        userId: socket.user._id,
        username: socket.user.username,
        cityId
      });

      socket.emit('left-city-chat', { cityId });

      console.log(`👋 ${socket.user.username} left city chat: ${cityId}`);

    } catch (error) {
      console.error('Error leaving city chat:', error);
      socket.emit('error', { message: 'Failed to leave city chat' });
    }
  });

  // Send message to city chat
  socket.on('send-city-message', async (data) => {
    try {
      const { cityId, content, message_type = 'text', media_url, reply_to } = data;

      // #region agent log
      fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H2',location:'backend/socket/handlers/cityChat.js:send-city-message:received',message:'Backend received send-city-message',data:{userId:socket.user._id.toString(),username:socket.user.username,cityId,contentLength:content?.length,hasContent:!!content},timestamp:Date.now()})+'\n', 'utf8');
      // #endregion

      if (!cityId || !content) {
        // #region agent log
        fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H2',location:'backend/socket/handlers/cityChat.js:send-city-message:validation-failed',message:'Validation failed - missing cityId or content',data:{hasCityId:!!cityId,hasContent:!!content},timestamp:Date.now()})+'\n', 'utf8');
        // #endregion
        return socket.emit('error', { 
          message: 'City ID and message content are required' 
        });
      }

      if (content.length > 5000) {
        // #region agent log
        fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H2',location:'backend/socket/handlers/cityChat.js:send-city-message:length-exceeded',message:'Content length exceeded',data:{length:content.length},timestamp:Date.now()})+'\n', 'utf8');
        // #endregion
        return socket.emit('error', { 
          message: 'Message cannot exceed 5000 characters' 
        });
      }

      // Verify membership
      const membership = await CityMembership.findOne({
        user_id: socket.user._id,
        city_id: cityId
      });

      if (!membership) {
        // #region agent log
        fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H5',location:'backend/socket/handlers/cityChat.js:send-city-message:not-member',message:'User not member of city',data:{userId:socket.user._id.toString(),cityId},timestamp:Date.now()})+'\n', 'utf8');
        // #endregion
        return socket.emit('error', { 
          message: 'You must be a member of this city to send messages' 
        });
      }

      // Ensure CityChat exists (create if not)
      let cityChat = await CityChat.findOne({ city_id: cityId });
      if (!cityChat) {
        cityChat = new CityChat({ city_id: cityId });
        await cityChat.save();
        console.log(`📝 Created CityChat for city: ${cityId}`);
      }

      // Content moderation check
      const moderationResult = await contentModerator.moderate(
        content,
        socket.user._id.toString(),
        'city'
      );

      // #region agent log
      fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H2-H6',location:'backend/socket/handlers/cityChat.js:send-city-message:moderation-result',message:'Moderation check complete',data:{allowed:moderationResult.allowed,reason:moderationResult.reason,flags:moderationResult.flags},timestamp:Date.now()})+'\n', 'utf8');
      // #endregion

      if (!moderationResult.allowed) {
        // #region agent log
        fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H6',location:'backend/socket/handlers/cityChat.js:send-city-message:blocked-by-moderation',message:'Message blocked by moderation',data:{reason:moderationResult.reason,flags:moderationResult.flags},timestamp:Date.now()})+'\n', 'utf8');
        // #endregion
        return socket.emit('error', {
          message: 'Message blocked by content moderation',
          reason: moderationResult.reason || 'Content violates community guidelines',
          flags: moderationResult.flags
        });
      }

      // Create message
      const message = new Message({
        sender_id: socket.user._id,
        chat_type: 'city',
        chat_id: cityChat._id,
        content,
        message_type,
        media_url,
        reply_to
      });

      await message.save();

      // #region agent log
      fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H2',location:'backend/socket/handlers/cityChat.js:send-city-message:saved',message:'Message saved to DB',data:{messageId:message._id.toString(),chatId:cityChat._id.toString()},timestamp:Date.now()})+'\n', 'utf8');
      // #endregion

      // Update last message timestamp
      await CityChat.findByIdAndUpdate(cityChat._id, {
        last_message_at: new Date()
      });

      // Update user's last active time
      await CityMembership.findByIdAndUpdate(membership._id, {
        last_active_at: new Date()
      });

      // Populate sender details
      const populatedMessage = await Message.findById(message._id)
        .populate('sender_id', 'username full_name profile_photo_url')
        .populate('reply_to', 'content sender_id');

      // #region agent log
      fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H3',location:'backend/socket/handlers/cityChat.js:send-city-message:before-broadcast',message:'About to broadcast message',data:{messageId:message._id.toString(),roomName:`city-${cityId}`,content:content.substring(0,50)},timestamp:Date.now()})+'\n', 'utf8');
      // #endregion

      // Broadcast to all users in the city chat room (including sender)
      io.to(`city-${cityId}`).emit('new-city-message', {
        ...populatedMessage.toObject(),
        cityId
      });

      // #region agent log
      fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H3',location:'backend/socket/handlers/cityChat.js:send-city-message:broadcasted',message:'Message broadcasted to room',data:{messageId:message._id.toString(),roomName:`city-${cityId}`},timestamp:Date.now()})+'\n', 'utf8');
      // #endregion

      console.log(`💬 ${socket.user.username} sent message to city ${cityId}`);

    } catch (error) {
      console.error('Error sending city message:', error);
      // #region agent log
      fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H2',location:'backend/socket/handlers/cityChat.js:send-city-message:error',message:'Error in send-city-message handler',data:{error:error.message,stack:error.stack?.substring(0,200)},timestamp:Date.now()})+'\n', 'utf8');
      // #endregion
      socket.emit('error', { 
        message: 'Failed to send message',
        details: error.message 
      });
    }
  });

  // Edit city message
  socket.on('edit-city-message', async (data) => {
    try {
      const { messageId, content, cityId } = data;

      if (!messageId || !content) {
        return socket.emit('error', { 
          message: 'Message ID and content are required' 
        });
      }

      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      if (message.sender_id.toString() !== socket.user._id.toString()) {
        return socket.emit('error', { 
          message: 'You can only edit your own messages' 
        });
      }

      // Content moderation check for edited content
      const moderationResult = await contentModerator.moderate(
        content,
        socket.user._id.toString(),
        'city'
      );

      if (!moderationResult.allowed) {
        return socket.emit('error', {
          message: 'Edited message blocked by content moderation',
          reason: moderationResult.reason || 'Content violates community guidelines',
          flags: moderationResult.flags
        });
      }

      message.content = content;
      message.is_edited = true;
      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate('sender_id', 'username full_name profile_photo_url');

      // Broadcast to all users in the city chat
      io.to(`city-${cityId}`).emit('city-message-edited', {
        ...populatedMessage.toObject(),
        cityId
      });

      console.log(`✏️ ${socket.user.username} edited message ${messageId}`);

    } catch (error) {
      console.error('Error editing city message:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // Delete city message
  socket.on('delete-city-message', async (data) => {
    try {
      const { messageId, cityId } = data;

      if (!messageId) {
        return socket.emit('error', { message: 'Message ID is required' });
      }

      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      if (message.sender_id.toString() !== socket.user._id.toString()) {
        return socket.emit('error', { 
          message: 'You can only delete your own messages' 
        });
      }

      message.is_deleted = true;
      message.content = '[Message deleted]';
      await message.save();

      // Broadcast to all users in the city chat
      io.to(`city-${cityId}`).emit('city-message-deleted', {
        messageId,
        cityId
      });

      console.log(`🗑️ ${socket.user.username} deleted message ${messageId}`);

    } catch (error) {
      console.error('Error deleting city message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Typing indicator for city chat
  socket.on('city-typing', async (data) => {
    try {
      const { cityId } = data;

      if (!cityId) return;

      // Verify membership
      const membership = await CityMembership.findOne({
        user_id: socket.user._id,
        city_id: cityId
      });

      if (!membership) return;

      // Broadcast to others (not to sender)
      socket.to(`city-${cityId}`).emit('user-typing-city', {
        userId: socket.user._id,
        username: socket.user.username,
        cityId
      });

    } catch (error) {
      console.error('Error in city typing indicator:', error);
    }
  });

  // Stop typing indicator for city chat
  socket.on('city-stop-typing', async (data) => {
    try {
      const { cityId } = data;

      if (!cityId) return;

      socket.to(`city-${cityId}`).emit('user-stopped-typing-city', {
        userId: socket.user._id,
        cityId
      });

    } catch (error) {
      console.error('Error in city stop typing:', error);
    }
  });
};
