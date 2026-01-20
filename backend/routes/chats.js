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
    
    // Remove from recommendations
    chat.recommendations.splice(index, 1);
    
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

// Activity Recommendations (proxied to AI service)
const axios = require('axios');
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

// Process message and get activity recommendations
router.post('/:chatId/activities/process-message', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    const userId = req.user._id.toString();
    const username = req.user.username || req.user.full_name || 'User';

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Call AI service
    const response = await axios.post(`${AI_SERVICE_URL}/api/v1/activities/message`, {
      chat_id: chatId,
      user: username,
      message: message
    });

    // If recommendations were generated, store them in the database
    if (response.data.trigger_rec && response.data.recommendations && response.data.recommendations.length > 0) {
      try {
        const PrivateChat = require('../models/PrivateChat');
        await PrivateChat.findByIdAndUpdate(chatId, {
          $set: {
            activity_recommendations: response.data.recommendations.map(rec => ({
              name: rec.name,
              duration: rec.duration,
              score: rec.score,
              category: rec.category,
              region: rec.region,
              lat: rec.lat,
              lon: rec.lon,
              best_time: rec.best_time,
              generated_at: new Date(),
              based_on_messages: response.data.message_count
            }))
          }
        });
      } catch (dbError) {
        console.error('Error storing activity recommendations:', dbError);
        // Don't fail the request if storage fails
      }
    }

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error processing activity message:', error);
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.detail || 'Error processing message'
      });
    }
    next(error);
  }
});

// Add activity to cart
router.post('/:chatId/activities/cart/add', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { place_name } = req.body;
    const userId = req.user._id.toString();
    const username = req.user.username || req.user.full_name || 'User';

    if (!place_name) {
      return res.status(400).json({
        success: false,
        message: 'Place name is required'
      });
    }

    // Check if user is admin
    const participant = await PrivateChatParticipant.findOne({
      chat_id: chatId,
      user_id: req.user._id
    });

    if (!participant || participant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can add activities to cart'
      });
    }

    // Get the chat to remove from recommendations
    const chat = await PrivateChat.findById(chatId);
    if (chat && chat.activity_recommendations) {
      // Remove the activity from recommendations
      chat.activity_recommendations = chat.activity_recommendations.filter(
        rec => rec.name !== place_name
      );
      await chat.save();
    }

    // Call AI service
    const response = await axios.post(`${AI_SERVICE_URL}/api/v1/activities/cart/add`, {
      chat_id: chatId,
      user: username,
      place_name: place_name
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error adding activity to cart:', error);
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.detail || 'Error adding to cart'
      });
    }
    next(error);
  }
});

// Get activity cart
router.get('/:chatId/activities/cart', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.params;

    // Call AI service
    const response = await axios.get(`${AI_SERVICE_URL}/api/v1/activities/cart/${chatId}`);

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error getting activity cart:', error);
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.detail || 'Error getting cart'
      });
    }
    next(error);
  }
});

// Remove activity from cart (Admin only)
router.post('/:chatId/activities/cart/remove', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { place_name } = req.body;
    const userId = req.user._id.toString();

    if (!place_name) {
      return res.status(400).json({
        success: false,
        message: 'Place name is required'
      });
    }

    // Check if user is admin (creator) of the chat
    const chat = await PrivateChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (chat.created_by.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove items from cart'
      });
    }

    const username = req.user.username || req.user.full_name || 'User';

    // Call AI service to remove from cart
    const response = await axios.post(`${AI_SERVICE_URL}/api/v1/activities/cart/remove`, {
      chat_id: chatId,
      user: username,
      place_name: place_name
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error removing activity from cart:', error);
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.detail || 'Error removing from cart'
      });
    }
    next(error);
  }
});

// Update cart settings
router.post('/:chatId/activities/cart/update', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { num_days, num_people } = req.body;

    if (num_days === undefined || num_people === undefined) {
      return res.status(400).json({
        success: false,
        message: 'num_days and num_people are required'
      });
    }

    // Call AI service
    const response = await axios.post(`${AI_SERVICE_URL}/api/v1/activities/cart/update`, {
      chat_id: chatId,
      num_days: parseInt(num_days),
      num_people: parseInt(num_people)
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error updating cart settings:', error);
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.detail || 'Error updating cart'
      });
    }
    next(error);
  }
});

// Get activity recommendations for a chat
router.get('/:chatId/activities/recommendations', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { forceRegenerate } = req.query; // Optional query param to force regeneration
    
    // Get recent 7 messages from database (always use fresh data)
    const recentMessages = await Message.find({
      chat_id: chatId,
      chat_type: 'private'
    })
    .sort({ created_at: -1 })
    .limit(7)
    .select('content sender_id created_at')
    .populate('sender_id', 'username full_name')
    .lean();
    
    if (recentMessages.length === 0) {
      return res.json({
        success: true,
        data: {
          recommendations: [],
          from_storage: false
        }
      });
    }
    
    // Get stored recommendations to check if we need to regenerate
    const chat = await PrivateChat.findById(chatId).select('activity_recommendations');
    const lastMessageTime = recentMessages[0]?.created_at;
    const storedRecommendations = chat?.activity_recommendations || [];
    const lastGeneratedTime = storedRecommendations[0]?.generated_at;
    
    // Regenerate if:
    // 1. forceRegenerate is true
    // 2. No stored recommendations exist
    // 3. New messages have been added since last generation
    const shouldRegenerate = forceRegenerate === 'true' || 
                            !storedRecommendations.length || 
                            !lastGeneratedTime ||
                            (lastMessageTime && new Date(lastMessageTime) > new Date(lastGeneratedTime));
    
    if (!shouldRegenerate && storedRecommendations.length > 0) {
      // Populate votes for stored recommendations
      const chatWithVotes = await PrivateChat.findById(chatId)
        .populate('activity_recommendations.votes.user_id', 'username full_name profile_photo_url')
        .select('activity_recommendations');
      
      return res.json({
        success: true,
        data: {
          recommendations: chatWithVotes?.activity_recommendations || storedRecommendations,
          from_storage: true
        }
      });
    }
    
    // Combine recent messages into a query (reverse to get chronological order)
    const combinedQuery = recentMessages
      .reverse()
      .map(msg => msg.content)
      .join(' ');
    
    // Get cart items to exclude from recommendations
    const cartResponse = await axios.get(`${AI_SERVICE_URL}/api/v1/activities/cart/${chatId}`).catch(() => ({ data: { items: [] } }));
    const excludeNames = (cartResponse.data?.items || []).map(item => item.place_name);
    
    // Call AI service search endpoint directly (bypassing message counting)
    // This uses semantic search directly on the query, ensuring fresh results
    const searchResponse = await axios.post(`${AI_SERVICE_URL}/api/v1/activities/search`, {
      query: combinedQuery,
      top_k: 5,
      exclude_names: excludeNames
    });
    
    // The search endpoint returns an array directly
    const recommendations = Array.isArray(searchResponse.data) ? searchResponse.data : [];
    
    // Store recommendations if we have any
    if (recommendations.length > 0) {
      try {
        await PrivateChat.findByIdAndUpdate(chatId, {
          $set: {
            activity_recommendations: recommendations.map(rec => ({
              name: rec.name,
              duration: rec.duration,
              score: rec.score,
              category: rec.category,
              region: rec.region,
              lat: rec.lat,
              lon: rec.lon,
              best_time: rec.best_time,
              generated_at: new Date(),
              based_on_messages: recentMessages.length,
              votes: [] // Initialize empty votes array
            }))
          }
        });
      } catch (dbError) {
        console.error('Error storing activity recommendations:', dbError);
      }
    }
    
    // Fetch with populated votes
    const chatWithVotes = await PrivateChat.findById(chatId)
      .populate('activity_recommendations.votes.user_id', 'username full_name profile_photo_url')
      .select('activity_recommendations');
    
    res.json({
      success: true,
      data: {
        recommendations: chatWithVotes?.activity_recommendations || recommendations,
        from_storage: false,
        regenerated: shouldRegenerate
      }
    });
  } catch (error) {
    console.error('Error fetching activity recommendations:', error);
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.detail || 'Error fetching recommendations'
      });
    }
    next(error);
  }
});

// Vote for an activity recommendation
router.post('/:chatId/activities/recommendations/:activityIndex/vote', authenticate, async (req, res, next) => {
  try {
    const { chatId, activityIndex } = req.params;
    const index = parseInt(activityIndex, 10);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity recommendation index'
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

    if (!chat.activity_recommendations || index >= chat.activity_recommendations.length) {
      return res.status(404).json({
        success: false,
        message: 'Activity recommendation not found'
      });
    }

    const activity = chat.activity_recommendations[index];

    // Check if user already voted
    const existingVote = activity.votes?.find(
      vote => vote.user_id?.toString() === req.user._id.toString()
    );

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted for this activity'
      });
    }

    // Add vote
    if (!activity.votes) {
      activity.votes = [];
    }
    activity.votes.push({
      user_id: req.user._id,
      voted_at: new Date()
    });

    await chat.save();

    const updatedChat = await PrivateChat.findById(chatId)
      .populate('activity_recommendations.votes.user_id', 'username full_name profile_photo_url')
      .select('activity_recommendations');

    res.status(200).json({
      success: true,
      message: 'Vote added successfully',
      data: {
        activity_recommendations: updatedChat.activity_recommendations
      }
    });
  } catch (error) {
    next(error);
  }
});

// Remove vote from an activity recommendation
router.delete('/:chatId/activities/recommendations/:activityIndex/vote', authenticate, async (req, res, next) => {
  try {
    const { chatId, activityIndex } = req.params;
    const index = parseInt(activityIndex, 10);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity recommendation index'
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

    if (!chat.activity_recommendations || index >= chat.activity_recommendations.length) {
      return res.status(404).json({
        success: false,
        message: 'Activity recommendation not found'
      });
    }

    const activity = chat.activity_recommendations[index];

    // Remove vote
    if (activity.votes) {
      activity.votes = activity.votes.filter(
        vote => vote.user_id?.toString() !== req.user._id.toString()
      );
    }

    await chat.save();

    const updatedChat = await PrivateChat.findById(chatId)
      .populate('activity_recommendations.votes.user_id', 'username full_name profile_photo_url')
      .select('activity_recommendations');

    res.status(200).json({
      success: true,
      message: 'Vote removed successfully',
      data: {
        activity_recommendations: updatedChat.activity_recommendations
      }
    });
  } catch (error) {
    next(error);
  }
});

// Generate itinerary from cart
router.post('/:chatId/activities/itinerary/generate', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { mylens_data } = req.body; // Accept myLens data from frontend

    // Fetch hotels from cart to send to AI service
    const chat = await PrivateChat.findById(chatId).select('cart');
    const hotelsInCart = (chat?.cart || []).filter(item => item.hotel_id || item.name);
    
    console.log(`[Itinerary] Generating with ${hotelsInCart.length} hotels and ${(mylens_data || []).length} myLens places`);
    
    // Call AI service with chat_id, hotels, and myLens data
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/v1/activities/itinerary/generate`,
      {
        hotels_in_cart: hotelsInCart.map(h => ({
          hotel_id: h.hotel_id,
          name: h.name,
          price: h.price,
          stars: h.stars,
          description: h.description,
          image_url: h.image_url
        })),
        mylens_data: (mylens_data || []).map(place => ({
          name: place.name,
          type: place.type,
          description: place.description,
          region: place.region,
          category: place.category
        }))
      },
      {
        params: { chat_id: chatId }
      }
    );

    // AI service should return selected hotels in response.data.hotels
    const itineraryWithHotels = response.data;

    // Store itinerary in database with selected hotels
    if (itineraryWithHotels && itineraryWithHotels.chat_id) {
      try {
        await PrivateChat.findByIdAndUpdate(chatId, {
          $push: {
            activity_itineraries: {
              chat_id: itineraryWithHotels.chat_id,
              days: itineraryWithHotels.days || [],
              num_people: itineraryWithHotels.num_people || 2,
              hotels: itineraryWithHotels.hotels || [],
              generated_at: new Date()
            }
          }
        });
        
        console.log(`[Itinerary] Stored itinerary with ${(itineraryWithHotels.hotels || []).length} selected hotels`);
      } catch (dbError) {
        console.error('Error storing itinerary:', dbError);
        // Don't fail the request if storage fails
      }
    }

    res.json({
      success: true,
      data: itineraryWithHotels
    });
  } catch (error) {
    console.error('Error generating itinerary:', error);
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.detail || 'Error generating itinerary'
      });
    }
    next(error);
  }
});

// Get itinerary for a chat
router.get('/:chatId/activities/itinerary', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    
    const chat = await PrivateChat.findById(chatId).select('activity_itineraries');
    
    if (!chat || !chat.activity_itineraries || chat.activity_itineraries.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }
    
    // Return the most recent itinerary
    const latestItinerary = chat.activity_itineraries[chat.activity_itineraries.length - 1];
    
    res.json({
      success: true,
      data: latestItinerary
    });
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    next(error);
  }
});

// Get AI hotel recommendations based on chat messages
router.get('/:chatId/hotels/recommendations', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    
    // Fetch recent messages from the chat (last 20 messages)
    const recentMessages = await Message.find({
      chat_id: chatId,
      chat_type: 'private',
      is_deleted: false
    })
    .sort({ created_at: -1 })
    .limit(20)
    .select('sender_id content')
    .lean();
    
    if (recentMessages.length === 0) {
      return res.json({
        success: true,
        data: {
          recommendations: [],
          extracted_preferences: {},
          message: 'Chat more to get hotel recommendations'
        }
      });
    }
    
    // Format messages for AI service
    const formattedMessages = recentMessages
      .reverse() // Reverse to get chronological order
      .map(msg => ({
        user_id: msg.sender_id?.toString() || 'unknown',
        text: msg.content || ''
      }))
      .filter(msg => msg.text.trim().length > 0); // Filter out empty messages
    
    if (formattedMessages.length === 0) {
      return res.json({
        success: true,
        data: {
          recommendations: [],
          extracted_preferences: {},
          message: 'No valid messages found'
        }
      });
    }
    
    // Call AI service for hotel recommendations
    try {
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/api/v1/hotels/recommend`,
        {
          messages: formattedMessages,
          limit: 5
        }
      );
      
      res.json({
        success: true,
        data: {
          recommendations: aiResponse.data.recommendations || [],
          extracted_preferences: aiResponse.data.extracted_preferences || {},
          from_ai: true
        }
      });
    } catch (aiError) {
      console.error('Error calling AI service for hotel recommendations:', aiError);
      if (aiError.response) {
        return res.status(aiError.response.status).json({
          success: false,
          message: aiError.response.data?.detail || 'Error getting AI recommendations'
        });
      }
      throw aiError;
    }
  } catch (error) {
    console.error('Error fetching hotel recommendations:', error);
    next(error);
  }
});

module.exports = router;
