const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  city_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: [true, 'City ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [200, 'Event name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Event type is required'],
    enum: ['Cultural', 'Food', 'Entertainment', 'Tourism', 'Art', 'Tech', 'Fitness', 'Social', 'Nature', 'Wellness', 'Adventure', 'Sports', 'Recreation'],
    default: 'Cultural'
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters'],
    default: 'City Center'
  },
  time: {
    type: String,
    trim: true,
    default: '6:00 PM - 9:00 PM'
  },
  attendees: {
    type: String,
    default: '100+'
  },
  attendees_count: {
    type: Number,
    default: 0
  },
  joined_users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
    index: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound index for efficient queries
eventSchema.index({ city_id: 1, date: 1 });
eventSchema.index({ date: 1, is_active: 1 });
eventSchema.index({ created_by: 1 });

module.exports = mongoose.model('Event', eventSchema);
