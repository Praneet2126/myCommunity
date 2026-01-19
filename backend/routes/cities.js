const express = require('express');
const router = express.Router();
const City = require('../models/City');
const CityMembership = require('../models/CityMembership');
const CityChat = require('../models/CityChat');
const Message = require('../models/Message');
const { authenticate } = require('../middleware/auth');
const { messageValidation, paginationValidation } = require('../middleware/validator');
const contentModerator = require('../../moderation');

// Get all active cities
router.get('/', async (req, res, next) => {
  try {
    const cities = await City.find({ is_active: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: cities.length,
      data: cities
    });
  } catch (error) {
    next(error);
  }
});

// Get city details
router.get('/:cityId', async (req, res, next) => {
  try {
    const city = await City.findById(req.params.cityId);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    res.status(200).json({
      success: true,
      data: city
    });
  } catch (error) {
    next(error);
  }
});

// Join a city
router.post('/:cityId/join', authenticate, async (req, res, next) => {
  try {
    const { cityId } = req.params;

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    if (!city.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This city is currently inactive'
      });
    }

    const existingMembership = await CityMembership.findOne({
      user_id: req.user._id,
      city_id: cityId
    });

    if (existingMembership) {
      // Idempotent join: if already a member, treat as success.
      return res.status(200).json({
        success: true,
        message: 'You are already a member of this city',
        data: existingMembership,
        alreadyMember: true
      });
    }

    const membership = new CityMembership({
      user_id: req.user._id,
      city_id: cityId
    });

    await membership.save();

    await City.findByIdAndUpdate(cityId, {
      $inc: { member_count: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully joined the city',
      data: membership
    });
  } catch (error) {
    next(error);
  }
});

// Leave a city
router.delete('/:cityId/leave', authenticate, async (req, res, next) => {
  try {
    const { cityId } = req.params;

    const membership = await CityMembership.findOneAndDelete({
      user_id: req.user._id,
      city_id: cityId
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'You are not a member of this city'
      });
    }

    await City.findByIdAndUpdate(cityId, {
      $inc: { member_count: -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully left the city'
    });
  } catch (error) {
    next(error);
  }
});

// Get city members
router.get('/:cityId/members', authenticate, async (req, res, next) => {
  try {
    const { cityId } = req.params;

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    const memberships = await CityMembership.find({ city_id: cityId })
      .populate('user_id', 'username full_name profile_photo_url')
      .sort({ joined_at: -1 });

    res.status(200).json({
      success: true,
      count: memberships.length,
      data: memberships
    });
  } catch (error) {
    next(error);
  }
});

// Get city chat messages
router.get('/:cityId/chat/messages', authenticate, paginationValidation, async (req, res, next) => {
  try {
    const { cityId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const membership = await CityMembership.findOne({
      user_id: req.user._id,
      city_id: cityId
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this city to view messages'
      });
    }

    // Ensure CityChat exists (create if not)
    let cityChat = await CityChat.findOne({ city_id: cityId });
    if (!cityChat) {
      cityChat = new CityChat({ city_id: cityId });
      await cityChat.save();
    }

    const messages = await Message.find({
      chat_type: 'city',
      chat_id: cityChat._id,
      is_deleted: false
    })
      .populate('sender_id', 'username full_name profile_photo_url')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({
      chat_type: 'city',
      chat_id: cityChat._id,
      is_deleted: false
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

// Send message to city chat
router.post('/:cityId/chat/messages', authenticate, messageValidation, async (req, res, next) => {
  try {
    const { cityId } = req.params;
    const { content, message_type, media_url, reply_to } = req.body;

    const membership = await CityMembership.findOne({
      user_id: req.user._id,
      city_id: cityId
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this city to send messages'
      });
    }

    // Ensure CityChat exists (create if not)
    let cityChat = await CityChat.findOne({ city_id: cityId });
    if (!cityChat) {
      cityChat = new CityChat({ city_id: cityId });
      await cityChat.save();
    }

    // Content moderation check
    const moderationResult = await contentModerator.moderate(
      content,
      req.user._id.toString(),
      'city'
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
      chat_type: 'city',
      chat_id: cityChat._id,
      content,
      message_type: message_type || 'text',
      media_url,
      reply_to
    });

    await message.save();

    await CityChat.findByIdAndUpdate(cityChat._id, {
      last_message_at: new Date()
    });

    await CityMembership.findByIdAndUpdate(membership._id, {
      last_active_at: new Date()
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

// Edit own message
router.put('/:cityId/chat/messages/:messageId', authenticate, messageValidation, async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    message.content = content;
    message.is_edited = true;
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender_id', 'username full_name profile_photo_url');

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
});

// Delete own message
router.delete('/:cityId/chat/messages/:messageId', authenticate, async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    message.is_deleted = true;
    message.content = '[Message deleted]';
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
