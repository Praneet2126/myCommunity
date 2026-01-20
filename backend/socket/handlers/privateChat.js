const PrivateChat = require('../../models/PrivateChat');
const PrivateChatParticipant = require('../../models/PrivateChatParticipant');
const Message = require('../../models/Message');
const contentModerator = require('../../../moderation');
const fs = require('fs');

module.exports = (io, socket) => {
  
  // Join a private chat room
  socket.on('join-private-chat', async (data) => {
    try {
      const { chatId } = data;

      if (!chatId) {
        return socket.emit('error', { message: 'Chat ID is required' });
      }

      // Verify user is a participant
      const participant = await PrivateChatParticipant.findOne({
        user_id: socket.user._id,
        chat_id: chatId
      });

      if (!participant) {
        return socket.emit('error', { 
          message: 'You are not a member of this chat' 
        });
      }

      // Get chat details
      const chat = await PrivateChat.findById(chatId);
      if (!chat) {
        return socket.emit('error', { message: 'Chat not found' });
      }

      // Join the room
      const roomName = `private-${chatId}`;
      socket.join(roomName);

      // #region agent log
      try {
        fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H5',location:'backend/socket/handlers/privateChat.js:join-private-chat:joined',message:'User joined private chat room',data:{userId:socket.user._id.toString(),username:socket.user.username,chatId,roomName},timestamp:Date.now()})+'\n', 'utf8');
      } catch (err) {
        // Debug logging failed - ignore silently
      }
      // #endregion

      console.log(`🔒 ${socket.user.username} joined private chat: ${chat.name || chatId}`);

      // Notify others in the room
      socket.to(roomName).emit('user-joined-private-chat', {
        userId: socket.user._id,
        username: socket.user.username,
        full_name: socket.user.full_name,
        profile_photo_url: socket.user.profile_photo_url,
        chatId
      });

      // Confirm to the user
      socket.emit('joined-private-chat', {
        chatId,
        chatName: chat.name,
        message: 'Successfully joined private chat'
      });

      // Update last read time
      await PrivateChatParticipant.findByIdAndUpdate(participant._id, {
        last_read_at: new Date()
      });

    } catch (error) {
      console.error('Error joining private chat:', error);
      socket.emit('error', { message: 'Failed to join private chat' });
    }
  });

  // Leave a private chat room
  socket.on('leave-private-chat', async (data) => {
    try {
      const { chatId } = data;

      if (!chatId) {
        return socket.emit('error', { message: 'Chat ID is required' });
      }

      const roomName = `private-${chatId}`;
      socket.leave(roomName);

      // Notify others
      socket.to(roomName).emit('user-left-private-chat', {
        userId: socket.user._id,
        username: socket.user.username,
        chatId
      });

      socket.emit('left-private-chat', { chatId });

      console.log(`👋 ${socket.user.username} left private chat: ${chatId}`);

    } catch (error) {
      console.error('Error leaving private chat:', error);
      socket.emit('error', { message: 'Failed to leave private chat' });
    }
  });

  // Send message to private chat
  socket.on('send-private-message', async (data) => {
    try {
      const { chatId, content, message_type = 'text', media_url, reply_to } = data;

      // #region agent log
      try {
        fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H2',location:'backend/socket/handlers/privateChat.js:send-private-message:received',message:'Backend received send-private-message',data:{userId:socket.user._id.toString(),username:socket.user.username,chatId,contentLength:content?.length,hasContent:!!content},timestamp:Date.now()})+'\n', 'utf8');
      } catch (err) {
        // Debug logging failed - ignore silently
      }
      // #endregion

      if (!chatId || !content) {
        // #region agent log
        try {
          fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H2',location:'backend/socket/handlers/privateChat.js:send-private-message:validation-failed',message:'Validation failed - missing chatId or content',data:{hasChatId:!!chatId,hasContent:!!content},timestamp:Date.now()})+'\n', 'utf8');
        } catch (err) {
          // Debug logging failed - ignore silently
        }
        // #endregion
        return socket.emit('error', { 
          message: 'Chat ID and message content are required' 
        });
      }

      if (content.length > 5000) {
        // #region agent log
        try {
          fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H2',location:'backend/socket/handlers/privateChat.js:send-private-message:length-exceeded',message:'Content length exceeded',data:{length:content.length},timestamp:Date.now()})+'\n', 'utf8');
        } catch (err) {
          // Debug logging failed - ignore silently
        }
        // #endregion
        return socket.emit('error', { 
          message: 'Message cannot exceed 5000 characters' 
        });
      }

      // Verify participant
      const participant = await PrivateChatParticipant.findOne({
        user_id: socket.user._id,
        chat_id: chatId
      });

      if (!participant) {
        // #region agent log
        try {
          fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H5',location:'backend/socket/handlers/privateChat.js:send-private-message:not-participant',message:'User not participant of chat',data:{userId:socket.user._id.toString(),chatId},timestamp:Date.now()})+'\n', 'utf8');
        } catch (err) {
          // Debug logging failed - ignore silently
        }
        // #endregion
        return socket.emit('error', { 
          message: 'You are not a member of this chat' 
        });
      }

      // Content moderation check with timeout (fail-open on error/timeout)
      let moderationResult;
      const moderationStartTime = Date.now();
      try {
        // Create a timeout promise with shorter timeout for better UX
        const moderationTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Moderation timeout')), 3000); // 3 second timeout (reduced from 5)
        });

        // Race between moderation and timeout
        moderationResult = await Promise.race([
          contentModerator.moderate(
            content,
            socket.user._id.toString(),
            'private'
          ),
          moderationTimeout
        ]);
        
        const moderationDuration = Date.now() - moderationStartTime;
        if (moderationDuration > 2000) {
          console.warn(`Moderation took ${moderationDuration}ms (slow)`);
        }
      } catch (error) {
        // On timeout or error, allow message (fail-open)
        const moderationDuration = Date.now() - moderationStartTime;
        console.warn(`Moderation check failed or timed out after ${moderationDuration}ms, allowing message:`, error.message);
        moderationResult = {
          allowed: true,
          decision: 'ALLOW',
          flags: [],
          reason: null
        };
      }

      // #region agent log
      try {
        fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H2-H6',location:'backend/socket/handlers/privateChat.js:send-private-message:moderation-result',message:'Moderation check complete',data:{allowed:moderationResult.allowed,reason:moderationResult.reason,flags:moderationResult.flags},timestamp:Date.now()})+'\n', 'utf8');
      } catch (err) {
        // Debug logging failed - ignore silently
      }
      // #endregion

      if (!moderationResult.allowed) {
        // #region agent log
        try {
          fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H6',location:'backend/socket/handlers/privateChat.js:send-private-message:blocked-by-moderation',message:'Message blocked by moderation',data:{reason:moderationResult.reason,flags:moderationResult.flags},timestamp:Date.now()})+'\n', 'utf8');
        } catch (err) {
          // Debug logging failed - ignore silently
        }
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
        chat_type: 'private',
        chat_id: chatId,
        content,
        message_type,
        media_url,
        reply_to
      });

      await message.save();

      // #region agent log
      try {
        fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H2',location:'backend/socket/handlers/privateChat.js:send-private-message:saved',message:'Message saved to DB',data:{messageId:message._id.toString(),chatId},timestamp:Date.now()})+'\n', 'utf8');
      } catch (err) {
        // Debug logging failed - ignore silently
      }
      // #endregion

      // Update last message timestamp
      await PrivateChat.findByIdAndUpdate(chatId, {
        last_message_at: new Date()
      });

      // Populate sender details
      const populatedMessage = await Message.findById(message._id)
        .populate('sender_id', 'username full_name profile_photo_url')
        .populate('reply_to', 'content sender_id');

      // #region agent log
      try {
        fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H3',location:'backend/socket/handlers/privateChat.js:send-private-message:before-broadcast',message:'About to broadcast private message',data:{messageId:message._id.toString(),roomName:`private-${chatId}`,content:content.substring(0,50)},timestamp:Date.now()})+'\n', 'utf8');
      } catch (err) {
        // Debug logging failed - ignore silently
      }
      // #endregion

      // Broadcast to all users in the private chat room (including sender)
      io.to(`private-${chatId}`).emit('new-private-message', {
        ...populatedMessage.toObject(),
        chatId
      });

      // #region agent log
      try {
        fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H3',location:'backend/socket/handlers/privateChat.js:send-private-message:broadcasted',message:'Message broadcasted to room',data:{messageId:message._id.toString(),roomName:`private-${chatId}`},timestamp:Date.now()})+'\n', 'utf8');
      } catch (err) {
        // Debug logging failed - ignore silently
      }
      // #endregion

      console.log(`💬 ${socket.user.username} sent message to private chat ${chatId}`);

    } catch (error) {
      console.error('Error sending private message:', error);
      // #region agent log
      try {
        fs.appendFileSync('/Users/int1927/Documents/_myCommunity__/.cursor/debug.log', JSON.stringify({sessionId:'debug-session',runId:'initial',hypothesisId:'H2',location:'backend/socket/handlers/privateChat.js:send-private-message:error',message:'Error in send-private-message handler',data:{error:error.message,stack:error.stack?.substring(0,200)},timestamp:Date.now()})+'\n', 'utf8');
      } catch (err) {
        // Debug logging failed - ignore silently
      }
      // #endregion
      socket.emit('error', { 
        message: 'Failed to send message',
        details: error.message 
      });
    }
  });

  // Edit private message
  socket.on('edit-private-message', async (data) => {
    try {
      const { messageId, content, chatId } = data;

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

      // Content moderation check for edited content - DISABLED
      // const moderationResult = await contentModerator.moderate(
      //   content,
      //   socket.user._id.toString(),
      //   'private'
      // );

      // if (!moderationResult.allowed) {
      //   return socket.emit('error', {
      //     message: 'Edited message blocked by content moderation',
      //     reason: moderationResult.reason || 'Content violates community guidelines',
      //     flags: moderationResult.flags
      //   });
      // }

      message.content = content;
      message.is_edited = true;
      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate('sender_id', 'username full_name profile_photo_url');

      // Broadcast to all users in the private chat
      io.to(`private-${chatId}`).emit('private-message-edited', {
        ...populatedMessage.toObject(),
        chatId
      });

      console.log(`✏️ ${socket.user.username} edited message ${messageId}`);

    } catch (error) {
      console.error('Error editing private message:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // Delete private message
  socket.on('delete-private-message', async (data) => {
    try {
      const { messageId, chatId } = data;

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

      // Broadcast to all users in the private chat
      io.to(`private-${chatId}`).emit('private-message-deleted', {
        messageId,
        chatId
      });

      console.log(`🗑️ ${socket.user.username} deleted message ${messageId}`);

    } catch (error) {
      console.error('Error deleting private message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Typing indicator for private chat
  socket.on('private-typing', async (data) => {
    try {
      const { chatId } = data;

      if (!chatId) return;

      // Verify participant
      const participant = await PrivateChatParticipant.findOne({
        user_id: socket.user._id,
        chat_id: chatId
      });

      if (!participant) return;

      // Broadcast to others (not to sender)
      socket.to(`private-${chatId}`).emit('user-typing-private', {
        userId: socket.user._id,
        username: socket.user.username,
        chatId
      });

    } catch (error) {
      console.error('Error in private typing indicator:', error);
    }
  });

  // Stop typing indicator for private chat
  socket.on('private-stop-typing', async (data) => {
    try {
      const { chatId } = data;

      if (!chatId) return;

      socket.to(`private-${chatId}`).emit('user-stopped-typing-private', {
        userId: socket.user._id,
        chatId
      });

    } catch (error) {
      console.error('Error in private stop typing:', error);
    }
  });

  // Mark messages as read
  socket.on('mark-messages-read', async (data) => {
    try {
      const { chatId } = data;

      if (!chatId) return;

      const participant = await PrivateChatParticipant.findOne({
        user_id: socket.user._id,
        chat_id: chatId
      });

      if (!participant) return;

      await PrivateChatParticipant.findByIdAndUpdate(participant._id, {
        last_read_at: new Date()
      });

      // Notify others that messages were read
      socket.to(`private-${chatId}`).emit('messages-read', {
        userId: socket.user._id,
        chatId,
        readAt: new Date()
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });
};
