const mongoose = require('mongoose');

const cityMembershipSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  city_id: {
    type: String,
    ref: 'City',
    required: true
  },
  role: {
    type: String,
    enum: ['member', 'moderator', 'admin'],
    default: 'member'
  },
  joined_at: {
    type: Date,
    default: Date.now
  },
  last_active_at: {
    type: Date,
    default: Date.now
  },
  notifications_enabled: {
    type: Boolean,
    default: true
  }
});

// Compound unique index to prevent duplicate memberships
cityMembershipSchema.index({ user_id: 1, city_id: 1 }, { unique: true });
cityMembershipSchema.index({ city_id: 1, joined_at: -1 });

module.exports = mongoose.model('CityMembership', cityMembershipSchema);
