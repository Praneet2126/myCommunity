const express = require('express');
const router = express.Router();
const SavedItinerary = require('../models/SavedItinerary');
const City = require('../models/City');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Save an itinerary
router.post('/save', authenticate, [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('city_id').optional({ nullable: true, checkFalsy: true }).trim(),
  body('days').isArray().withMessage('Days must be an array').notEmpty().withMessage('Days array cannot be empty'),
  body('num_people').isInt({ min: 1 }).withMessage('Number of people must be at least 1')
], async (req, res, next) => {
  try {
    console.log('=== SAVE ITINERARY REQUEST ===');
    console.log('User ID:', req.user._id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, city_id, days, num_people, estimated_cost, tags, notes } = req.body;

    // Validate days array is not empty
    if (!days || days.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Itinerary must have at least one day with activities'
      });
    }

    // Validate each day has activities
    for (const day of days) {
      if (!day.activities || day.activities.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Day ${day.day} must have at least one activity`
        });
      }
    }

    const savedItinerary = new SavedItinerary({
      user_id: req.user._id,
      title,
      city_id: city_id || 'unknown', // Default to 'unknown' if not provided
      days,
      num_people,
      estimated_cost: estimated_cost || '',
      tags: tags || [],
      notes: notes || ''
    });

    console.log('Saving itinerary to database...');
    try {
      await savedItinerary.save();
      console.log('Itinerary saved successfully with ID:', savedItinerary._id);

      res.status(201).json({
        success: true,
        message: 'Itinerary saved successfully',
        data: savedItinerary
      });
    } catch (saveError) {
      console.error('Database save error:', saveError);
      console.error('Save error details:', saveError.message);
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(saveError.errors).map(e => ({
            field: e.path,
            message: e.message
          }))
        });
      }
      return res.status(500).json({
        success: false,
        message: saveError.message || 'Failed to save itinerary to database'
      });
    }
  } catch (error) {
    console.error('Error in save itinerary route:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Get user's saved itineraries
router.get('/', authenticate, async (req, res, next) => {
  try {
    const savedItineraries = await SavedItinerary.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .lean();

    // Manually populate city data since city_id is a string
    const itinerariesWithCity = await Promise.all(
      savedItineraries.map(async (itinerary) => {
        if (itinerary.city_id) {
          const city = await City.findById(itinerary.city_id).lean();
          if (city) {
            itinerary.city_id = {
              _id: city._id,
              name: city.name,
              displayName: city.displayName
            };
          }
        }
        return itinerary;
      })
    );

    res.json({
      success: true,
      data: itinerariesWithCity
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific saved itinerary
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const itinerary = await SavedItinerary.findOne({
      _id: req.params.id,
      user_id: req.user._id
    }).lean();

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    // Manually populate city data since city_id is a string
    if (itinerary.city_id) {
      const city = await City.findById(itinerary.city_id).lean();
      if (city) {
        itinerary.city_id = {
          _id: city._id,
          name: city.name,
          displayName: city.displayName
        };
      }
    }

    res.json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    next(error);
  }
});

// Update a saved itinerary
router.put('/:id', authenticate, [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('days').optional().isArray(),
  body('num_people').optional().isInt({ min: 1 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const itinerary = await SavedItinerary.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    // Update fields
    const { title, days, num_people, estimated_cost, tags, notes } = req.body;
    if (title) itinerary.title = title;
    if (days) itinerary.days = days;
    if (num_people) itinerary.num_people = num_people;
    if (estimated_cost !== undefined) itinerary.estimated_cost = estimated_cost;
    if (tags) itinerary.tags = tags;
    if (notes !== undefined) itinerary.notes = notes;

    await itinerary.save();

    res.json({
      success: true,
      message: 'Itinerary updated successfully',
      data: itinerary
    });
  } catch (error) {
    next(error);
  }
});

// Delete a saved itinerary
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const itinerary = await SavedItinerary.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    res.json({
      success: true,
      message: 'Itinerary deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
