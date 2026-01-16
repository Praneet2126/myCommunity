const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { updateProfileValidation, changePasswordValidation } = require('../middleware/validator');
const { upload, cloudinary } = require('../config/cloudinary');

// Get current user profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticate, updateProfileValidation, async (req, res, next) => {
  try {
    const { full_name, phone, profile_photo_url } = req.body;

    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (phone) updateData.phone = phone;
    if (profile_photo_url) updateData.profile_photo_url = profile_photo_url;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/change-password', authenticate, changePasswordValidation, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const user = await User.findById(req.user._id);

    const isPasswordValid = await user.comparePassword(current_password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = new_password;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Search user by email
router.get('/search-by-email', authenticate, async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('_id username email full_name profile_photo_url');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Upload profile photo
router.post('/upload-photo', authenticate, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get the old photo URL to delete it from Cloudinary
    const user = await User.findById(req.user._id);
    const oldPhotoUrl = user.profile_photo_url;

    // Update user's profile photo URL
    user.profile_photo_url = req.file.path;
    await user.save();

    // Delete old photo from Cloudinary if it exists and is not the default placeholder
    if (oldPhotoUrl && !oldPhotoUrl.includes('placeholder')) {
      try {
        const publicId = oldPhotoUrl.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error('Error deleting old photo:', deleteError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profile_photo_url: req.file.path
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
