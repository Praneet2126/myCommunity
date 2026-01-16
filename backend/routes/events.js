const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const City = require('../models/City');
const CityMembership = require('../models/CityMembership');
const { authenticate } = require('../middleware/auth');
const { uploadEventImage, cloudinary } = require('../config/cloudinary');
const { body, validationResult } = require('express-validator');

// Configure multer for event images
const eventImageUpload = uploadEventImage.single('image');

// Validation middleware
const eventValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Event name is required')
    .isLength({ max: 200 }).withMessage('Event name cannot exceed 200 characters'),
  body('date')
    .notEmpty().withMessage('Event date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('type')
    .optional()
    .isIn(['Cultural', 'Food', 'Entertainment', 'Tourism', 'Art', 'Tech', 'Fitness', 'Social', 'Nature', 'Wellness', 'Adventure', 'Sports', 'Recreation'])
    .withMessage('Invalid event type'),
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('location')
    .optional()
    .isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),
  body('time')
    .optional()
    .trim(),
  body('attendees')
    .optional()
    .trim()
];

// Get all events (optionally filtered by city)
router.get('/', async (req, res, next) => {
  try {
    const { cityId, month, year, startDate, endDate } = req.query;
    const query = { is_active: true };

    // Filter by city if provided
    if (cityId) {
      const City = require('../models/City');
      let city = null;
      
      // Try to find city by MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(cityId)) {
        city = await City.findById(cityId);
      }
      
      // If not found by ID, try by name
      if (!city) {
        city = await City.findOne({ 
          $or: [
            { name: new RegExp(`^${cityId}$`, 'i') },
            { displayName: new RegExp(`^${cityId}$`, 'i') }
          ]
        });
      }
      
      if (city) {
        query.city_id = city._id;
      }
    }

    // Filter by month and year
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      const start = new Date(yearNum, monthNum, 1);
      const end = new Date(yearNum, monthNum + 1, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    // Filter by date range
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const events = await Event.find(query)
      .populate('city_id', 'name displayName')
      .populate('created_by', 'username full_name profile_photo_url')
      .sort({ date: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
});

// Get event by ID
router.get('/:eventId', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('city_id', 'name displayName')
      .populate('created_by', 'username full_name profile_photo_url');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
});

// Create new event (authenticated)
router.post('/', authenticate, eventImageUpload, eventValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { cityId, name, description, date, type, location, time, attendees } = req.body;

    // Verify city exists
    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    // Verify user is a member of the city
    const membership = await CityMembership.findOne({
      user_id: req.user._id,
      city_id: cityId
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this city to create events'
      });
    }

    // Handle image upload
    let imageUrl = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80';
    if (req.file) {
      imageUrl = req.file.path;
    } else if (req.body.imageUrl) {
      // Allow URL if no file uploaded
      imageUrl = req.body.imageUrl;
    }

    // Create event
    const event = new Event({
      city_id: cityId,
      name,
      description: description || '',
      date: new Date(date),
      type: type || 'Cultural',
      image: imageUrl,
      location: location || 'City Center',
      time: time || '6:00 PM - 9:00 PM',
      attendees: attendees || '100+',
      created_by: req.user._id
    });

    await event.save();

    // Populate and return
    const populatedEvent = await Event.findById(event._id)
      .populate('city_id', 'name displayName')
      .populate('created_by', 'username full_name profile_photo_url');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: populatedEvent
    });
  } catch (error) {
    next(error);
  }
});

// Update event (authenticated, creator only)
router.put('/:eventId', authenticate, eventImageUpload, eventValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the creator
    if (event.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own events'
      });
    }

    // Update fields
    if (req.body.name) event.name = req.body.name;
    if (req.body.description !== undefined) event.description = req.body.description;
    if (req.body.date) event.date = new Date(req.body.date);
    if (req.body.type) event.type = req.body.type;
    if (req.body.location) event.location = req.body.location;
    if (req.body.time) event.time = req.body.time;
    if (req.body.attendees) event.attendees = req.body.attendees;

    // Handle image update
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (event.image && !event.image.includes('unsplash.com') && !event.image.includes('placeholder')) {
        try {
          const publicId = event.image.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.error('Error deleting old image:', deleteError);
        }
      }
      event.image = req.file.path;
    } else if (req.body.imageUrl) {
      event.image = req.body.imageUrl;
    }

    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('city_id', 'name displayName')
      .populate('created_by', 'username full_name profile_photo_url');

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: populatedEvent
    });
  } catch (error) {
    next(error);
  }
});

// Delete event (authenticated, creator only)
router.delete('/:eventId', authenticate, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the creator
    if (event.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own events'
      });
    }

    // Delete image from Cloudinary if it exists
    if (event.image && !event.image.includes('unsplash.com') && !event.image.includes('placeholder')) {
      try {
        const publicId = event.image.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error('Error deleting image:', deleteError);
      }
    }

    // Soft delete
    event.is_active = false;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
