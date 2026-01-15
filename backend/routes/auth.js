const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const { registerValidation, loginValidation } = require('../middleware/validator');
const { authenticate } = require('../middleware/auth');

// Register new user
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const { username, email, password, full_name, phone } = req.body;

    const user = new User({
      username,
      email,
      password,
      full_name,
      phone
    });

    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    user.last_login = new Date();
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout user
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    // Since we're using stateless JWT tokens, we just return success
    // The client should remove tokens from storage
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
