const express = require('express');
const router = express.Router();
const PrivateChat = require('../models/PrivateChat');
const PrivateChatParticipant = require('../models/PrivateChatParticipant');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { privateChatValidation, messageValidation, paginationValidation } = require('../middleware/validator');
const contentModerator = require('../../moderation');
const { uploadChatImage } = require('../config/cloudinary');

// Get user's private chats
router.get('/', authenticate, async (req, res, next) => {
  try {
    const participations = await PrivateChatParticipant.find({
      user_id: req.user._id
    }).populate({
      path: 'chat_id',
      populate: [
        {
          path: 'created_by',
          select: 'username full_name profile_photo_url'
        },
        {
          path: 'city_id',
          select: 'name displayName'
        }
      ]
    }).sort({ 'chat_id.last_message_at': -1 });

    const chats = participations.map(p => p.chat_id).filter(chat => chat !== null);

    // Get participant counts for each chat
    const chatIds = chats.map(c => c._id);
    const participantCounts = await PrivateChatParticipant.aggregate([
      { $match: { chat_id: { $in: chatIds } } },
      { $group: { _id: '$chat_id', count: { $sum: 1 } } }
    ]);
    
    // Create a map of chat_id -> count
    const countMap = {};
    participantCounts.forEach(pc => {
      countMap[pc._id.toString()] = pc.count;
    });

    // Add participant_count to each chat
    const chatsWithCounts = chats.map(chat => ({
      ...chat.toObject(),
      participant_count: countMap[chat._id.toString()] || 0
    }));

    res.status(200).json({
      success: true,
      count: chatsWithCounts.length,
      data: chatsWithCounts
    });
  } catch (error) {
    next(error);
  }
});

// Create new private chat
router.post('/', authenticate, privateChatValidation, async (req, res, next) => {
  try {
    const { name, description, city_id, participant_ids } = req.body;

    // Verify city exists
    const City = require('../models/City');
    const city = await City.findById(city_id);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

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
      description,
      city_id,
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
      .populate('created_by', 'username full_name profile_photo_url')
      .populate('city_id', 'name displayName');

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
      .populate('created_by', 'username full_name profile_photo_url')
      .populate('recommendations.votes.user_id', 'username full_name profile_photo_url');

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

// Upload image to private chat
router.post('/:chatId/upload-image', authenticate, uploadChatImage.single('image'), async (req, res, next) => {
  try {
    const { chatId } = req.params;

    // Check if user is a participant
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Return the Cloudinary URL
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: req.file.path,
        public_id: req.file.filename
      }
    });
  } catch (error) {
    next(error);
  }
});

// Add recommendation to private chat
router.post('/:chatId/recommendations', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { recommendation } = req.body;

    if (!recommendation) {
      return res.status(400).json({
        success: false,
        message: 'Recommendation data is required'
      });
    }

    // Check if user is a participant
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

    // Add recommendation with user info
    const recommendationWithUser = {
      ...recommendation,
      added_by: req.user._id,
      added_at: new Date()
    };

    const chat = await PrivateChat.findByIdAndUpdate(
      chatId,
      { $push: { recommendations: recommendationWithUser } },
      { new: true }
    ).populate('created_by', 'username full_name profile_photo_url')
     .populate('city_id', 'name displayName');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Recommendation added successfully',
      data: chat
    });
  } catch (error) {
    next(error);
  }
});

// Remove recommendation from private chat
router.delete('/:chatId/recommendations/:recommendationIndex', authenticate, async (req, res, next) => {
  try {
    const { chatId, recommendationIndex } = req.params;
    const index = parseInt(recommendationIndex, 10);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recommendation index'
      });
    }

    // Check if user is a participant
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

    // Get the chat to check if recommendation exists
    const chat = await PrivateChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.recommendations || index >= chat.recommendations.length) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    // Remove the recommendation at the specified index
    chat.recommendations.splice(index, 1);
    await chat.save();

    const updatedChat = await PrivateChat.findById(chatId)
      .populate('created_by', 'username full_name profile_photo_url')
      .populate('city_id', 'name displayName');

    res.status(200).json({
      success: true,
      message: 'Recommendation removed successfully',
      data: updatedChat
    });
  } catch (error) {
    next(error);
  }
});

// Vote for a recommendation
router.post('/:chatId/recommendations/:recommendationIndex/vote', authenticate, async (req, res, next) => {
  try {
    const { chatId, recommendationIndex } = req.params;
    const index = parseInt(recommendationIndex, 10);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recommendation index'
      });
    }

    // Check if user is a participant
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

    // Get the chat
    const chat = await PrivateChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.recommendations || index >= chat.recommendations.length) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    const recommendation = chat.recommendations[index];

    // Check if user already voted
    const existingVote = recommendation.votes?.find(
      vote => vote.user_id.toString() === req.user._id.toString()
    );

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted for this recommendation'
      });
    }

    // Add vote
    if (!recommendation.votes) {
      recommendation.votes = [];
    }
    recommendation.votes.push({
      user_id: req.user._id,
      voted_at: new Date()
    });

    await chat.save();

    const updatedChat = await PrivateChat.findById(chatId)
      .populate('created_by', 'username full_name profile_photo_url')
      .populate('city_id', 'name displayName')
      .populate('recommendations.votes.user_id', 'username full_name profile_photo_url');

    res.status(200).json({
      success: true,
      message: 'Vote added successfully',
      data: updatedChat
    });
  } catch (error) {
    next(error);
  }
});

// Remove vote from a recommendation
router.delete('/:chatId/recommendations/:recommendationIndex/vote', authenticate, async (req, res, next) => {
  try {
    const { chatId, recommendationIndex } = req.params;
    const index = parseInt(recommendationIndex, 10);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recommendation index'
      });
    }

    // Check if user is a participant
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

    // Get the chat
    const chat = await PrivateChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.recommendations || index >= chat.recommendations.length) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    const recommendation = chat.recommendations[index];

    // Remove user's vote
    if (recommendation.votes) {
      recommendation.votes = recommendation.votes.filter(
        vote => vote.user_id.toString() !== req.user._id.toString()
      );
    }

    await chat.save();

    const updatedChat = await PrivateChat.findById(chatId)
      .populate('created_by', 'username full_name profile_photo_url')
      .populate('city_id', 'name displayName')
      .populate('recommendations.votes.user_id', 'username full_name profile_photo_url');

    res.status(200).json({
      success: true,
      message: 'Vote removed successfully',
      data: updatedChat
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Add recommendation to cart
router.post('/:chatId/recommendations/:recommendationIndex/add-to-cart', authenticate, async (req, res, next) => {
  try {
    const { chatId, recommendationIndex } = req.params;
    const index = parseInt(recommendationIndex, 10);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recommendation index'
      });
    }

    // Check if user is a participant and admin
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

    if (participant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can add recommendations to cart'
      });
    }

    // Get the chat
    const chat = await PrivateChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.recommendations || index >= chat.recommendations.length) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    const recommendation = chat.recommendations[index];

    // Check if already in cart
    const alreadyInCart = chat.cart?.some(
      item => item.hotel_id === recommendation.hotel_id || 
              (item.name === recommendation.name && item.price === recommendation.price)
    );

    if (alreadyInCart) {
      return res.status(400).json({
        success: false,
        message: 'This recommendation is already in the cart'
      });
    }

    // Add to cart
    if (!chat.cart) {
      chat.cart = [];
    }

    const cartItem = {
      ...recommendation.toObject(),
      added_to_cart_at: new Date(),
      added_to_cart_by: req.user._id
    };
    // Remove votes from cart item (not needed in cart)
    delete cartItem.votes;

    chat.cart.push(cartItem);
    await chat.save();

    const updatedChat = await PrivateChat.findById(chatId)
      .populate('created_by', 'username full_name profile_photo_url')
      .populate('city_id', 'name displayName')
      .populate('recommendations.votes.user_id', 'username full_name profile_photo_url');

    res.status(200).json({
      success: true,
      message: 'Recommendation added to cart successfully',
      data: updatedChat
    });
  } catch (error) {
    next(error);
  }
});

// Admin: Remove item from cart
router.delete('/:chatId/cart/:cartIndex', authenticate, async (req, res, next) => {
  try {
    const { chatId, cartIndex } = req.params;
    const index = parseInt(cartIndex, 10);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart index'
      });
    }

    // Check if user is a participant and admin
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

    if (participant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove items from cart'
      });
    }

    // Get the chat
    const chat = await PrivateChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.cart || index >= chat.cart.length) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Remove the item from cart
    chat.cart.splice(index, 1);
    await chat.save();

    const updatedChat = await PrivateChat.findById(chatId)
      .populate('created_by', 'username full_name profile_photo_url')
      .populate('city_id', 'name displayName')
      .populate('recommendations.votes.user_id', 'username full_name profile_photo_url');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: updatedChat
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
