const express = require('express');
const router = express.Router();
const PrivateChat = require('../models/PrivateChat');
const PrivateChatParticipant = require('../models/PrivateChatParticipant');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { privateChatValidation, messageValidation, paginationValidation } = require('../middleware/validator');
const contentModerator = require('../moderation');

// Get user's private chats
router.get('/', authenticate, async (req, res, next) => {
  try {
    const participations = await PrivateChatParticipant.find({
      user_id: req.user._id
    }).populate({
      path: 'chat_id',
      populate: {
        path: 'created_by',
        select: 'username full_name profile_photo_url'
      }
    }).sort({ 'chat_id.last_message_at': -1 });

    const chats = participations.map(p => p.chat_id).filter(chat => chat !== null);

    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats
    });
  } catch (error) {
    next(error);
  }
});

// Create new private chat
router.post('/', authenticate, privateChatValidation, async (req, res, next) => {
  try {
    const { name, participant_ids } = req.body;

    // Verify all participants exist
    const participants = await User.find({
      _id: { $in: participant_ids }
    });

    if (participants.length !== participant_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more participants not found'
      });
    }

    const chat = new PrivateChat({
      name,
      created_by: req.user._id
    });

    await chat.save();

    // Add creator as admin
    const creatorParticipant = new PrivateChatParticipant({
      chat_id: chat._id,
      user_id: req.user._id,
      role: 'admin'
    });
    await creatorParticipant.save();

    // Add other participants as members
    const participantDocs = participant_ids
      .filter(id => id !== req.user._id.toString())
      .map(userId => ({
        chat_id: chat._id,
        user_id: userId,
        role: 'member'
      }));

    if (participantDocs.length > 0) {
      await PrivateChatParticipant.insertMany(participantDocs);
    }

    const populatedChat = await PrivateChat.findById(chat._id)
      .populate('created_by', 'username full_name profile_photo_url');

    res.status(201).json({
      success: true,
      message: 'Private chat created successfully',
      data: populatedChat
    });
  } catch (error) {
    next(error);
  }
});

// Get chat details with participants
router.get('/:chatId', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const participant = await PrivateChatParticipant.findOne({
      chat_id: chatId,
      user_id: req.user._id
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat'
      });
    }

    const chat = await PrivateChat.findById(chatId)
      .populate('created_by', 'username full_name profile_photo_url');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const participants = await PrivateChatParticipant.find({ chat_id: chatId })
      .populate('user_id', 'username full_name profile_photo_url');

    res.status(200).json({
      success: true,
      data: {
        ...chat.toObject(),
        participants
      }
    });
  } catch (error) {
    next(error);
  }
});

// Add members to chat
router.post('/:chatId/members', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { user_ids } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'user_ids must be a non-empty array'
      });
    }

    const currentParticipant = await PrivateChatParticipant.findOne({
      chat_id: chatId,
      user_id: req.user._id
    });

    if (!currentParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat'
      });
    }

    if (currentParticipant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can add members'
      });
    }

    const users = await User.find({ _id: { $in: user_ids } });

    if (users.length !== user_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more users not found'
      });
    }

    const participantDocs = user_ids.map(userId => ({
      chat_id: chatId,
      user_id: userId,
      role: 'member'
    }));

    await PrivateChatParticipant.insertMany(participantDocs, { ordered: false })
      .catch(err => {
        if (err.code !== 11000) throw err;
      });

    res.status(201).json({
      success: true,
      message: 'Members added successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Remove member from chat
router.delete('/:chatId/members/:userId', authenticate, async (req, res, next) => {
  try {
    const { chatId, userId } = req.params;

    const currentParticipant = await PrivateChatParticipant.findOne({
      chat_id: chatId,
      user_id: req.user._id
    });

    if (!currentParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat'
      });
    }

    // Users can remove themselves, or admins can remove others
    if (userId !== req.user._id.toString() && currentParticipant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove other members'
      });
    }

    const removed = await PrivateChatParticipant.findOneAndDelete({
      chat_id: chatId,
      user_id: userId
    });

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this chat'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get chat messages
router.get('/:chatId/messages', authenticate, paginationValidation, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const participant = await PrivateChatParticipant.findOne({
      chat_id: chatId,
      user_id: req.user._id
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat'
      });
    }

    const messages = await Message.find({
      chat_type: 'private',
      chat_id: chatId,
      is_deleted: false
    })
      .populate('sender_id', 'username full_name profile_photo_url')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({
      chat_type: 'private',
      chat_id: chatId,
      is_deleted: false
    });

    await PrivateChatParticipant.findByIdAndUpdate(participant._id, {
      last_read_at: new Date()
    });

    res.status(200).json({
      success: true,
      data: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Send message to private chat
router.post('/:chatId/messages', authenticate, messageValidation, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { content, message_type, media_url, reply_to } = req.body;

    const participant = await PrivateChatParticipant.findOne({
      chat_id: chatId,
      user_id: req.user._id
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this chat'
      });
    }

    // Content moderation check
    const moderationResult = await contentModerator.moderate(
      content,
      req.user._id.toString(),
      'private'
    );

    if (!moderationResult.allowed) {
      return res.status(403).json({
        success: false,
        message: 'Message blocked by content moderation',
        reason: moderationResult.reason || 'Content violates community guidelines',
        flags: moderationResult.flags
      });
    }

    const message = new Message({
      sender_id: req.user._id,
      chat_type: 'private',
      chat_id: chatId,
      content,
      message_type: message_type || 'text',
      media_url,
      reply_to
    });

    await message.save();

    await PrivateChat.findByIdAndUpdate(chatId, {
      last_message_at: new Date()
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender_id', 'username full_name profile_photo_url');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
