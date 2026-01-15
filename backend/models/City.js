const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'City name is required'],
    trim: true
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Image URL is required']
  },
  tagline: {
    type: String,
    required: [true, 'Tagline is required'],
    maxlength: [200, 'Tagline cannot exceed 200 characters']
  },
  is_active: {
    type: Boolean,
    default: true
  },
  member_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

citySchema.index({ is_active: 1 });

module.exports = mongoose.model('City', citySchema);
