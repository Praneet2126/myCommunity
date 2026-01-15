const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { updateProfileValidation, changePasswordValidation } = require('../middleware/validator');

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

module.exports = router;
