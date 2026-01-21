const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

/**
 * Get hotel information including first image
 * GET /api/hotels/:hotelName/info
 */
router.get('/:hotelName/info', async (req, res, next) => {
  try {
    const { hotelName } = req.params;
    
    // Path to hotels folder in image_search directory
    const hotelsBasePath = path.join(__dirname, '..', '..', 'image_search', 'hotels');
    const hotelFolderPath = path.join(hotelsBasePath, hotelName);
    
    // Check if hotel folder exists
    try {
      await fs.access(hotelFolderPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    
    // Read info.json
    const infoPath = path.join(hotelFolderPath, 'info.json');
    let hotelInfo = {};
    
    try {
      const infoContent = await fs.readFile(infoPath, 'utf-8');
      hotelInfo = JSON.parse(infoContent);
    } catch (error) {
      console.error('Error reading info.json:', error);
    }
    
    // Get first image from folder
    const files = await fs.readdir(hotelFolderPath);
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    const firstImage = imageFiles.length > 0 ? imageFiles[0] : null;
    
    res.json({
      success: true,
      data: {
        ...hotelInfo,
        image_url: firstImage ? `/api/hotels/${encodeURIComponent(hotelName)}/image/${encodeURIComponent(firstImage)}` : null,
        available_images: imageFiles
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get hotel image
 * GET /api/hotels/:hotelName/image/:imageName
 */
router.get('/:hotelName/image/:imageName', async (req, res, next) => {
  try {
    const { hotelName, imageName } = req.params;
    
    // Path to hotels folder in image_search directory
    const hotelsBasePath = path.join(__dirname, '..', '..', 'image_search', 'hotels');
    const imagePath = path.join(hotelsBasePath, hotelName, imageName);
    
    // Check if image exists
    try {
      await fs.access(imagePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Set appropriate content type
    const ext = path.extname(imageName).toLowerCase();
    const contentTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };
    
    res.setHeader('Content-Type', contentTypes[ext] || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Allow cross-origin requests for images
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send the image file
    res.sendFile(imagePath);
  } catch (error) {
    next(error);
  }
});

/**
 * Get first image URL for a hotel by name
 * GET /api/hotels/:hotelName/first-image
 */
router.get('/:hotelName/first-image', async (req, res, next) => {
  try {
    const { hotelName } = req.params;
    
    // Path to hotels folder in image_search directory
    const hotelsBasePath = path.join(__dirname, '..', '..', 'image_search', 'hotels');
    const hotelFolderPath = path.join(hotelsBasePath, hotelName);
    
    // Check if hotel folder exists
    try {
      await fs.access(hotelFolderPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    
    // Get first image from folder
    const files = await fs.readdir(hotelFolderPath);
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    const firstImage = imageFiles.length > 0 ? imageFiles[0] : null;
    
    if (!firstImage) {
      return res.status(404).json({
        success: false,
        message: 'No images found for this hotel'
      });
    }
    
    res.json({
      success: true,
      data: {
        hotel_name: hotelName,
        image_url: `/api/hotels/${encodeURIComponent(hotelName)}/image/${encodeURIComponent(firstImage)}`,
        image_name: firstImage
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
