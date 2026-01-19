const mongoose = require('mongoose');

const privateChatSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Chat name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  city_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  avatar: {
    type: String
  },
  last_message_at: {
    type: Date
  },
  // Recommendations from LLM (activities) or myLens (hotels)
  recommendations: [{
    // Common fields
    type: { type: String, enum: ['hotel', 'activity'], default: 'activity' },
    name: { type: String, required: true },
    description: String,
    image_url: String,
    added_at: { type: Date, default: Date.now },
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Hotel-specific fields (from myLens)
    hotel_id: String,
    price: Number,
    stars: Number,
    similarity_score: Number,
    
    // Activity-specific fields (from LLM)
    duration: String,
    score: Number,
    category: String,
    region: String,
    lat: Number,
    lon: Number,
    best_time: String,
    
    // Voting system
    votes: [{
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      voted_at: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  
  // Cart items (added from recommendations)
  cart: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['hotel', 'activity'], default: 'activity' },
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    added_at: { type: Date, default: Date.now },
    
    // Copy fields from recommendation
    duration: String,
    category: String,
    region: String,
    lat: Number,
    lon: Number,
    best_time: String,
    price: Number,
    stars: Number,
    image_url: String,
    description: String
  }],
  
  // Generated itineraries from LLM
  itineraries: [{
    num_days: Number,
    num_people: Number,
    created_at: { type: Date, default: Date.now },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    days: [{
      day: Number,
      activities: [{
        name: String,
        start_time: String,
        end_time: String,
        travel_time_from_prev: String,
        duration: String,
        category: String,
        region: String,
        lat: Number,
        lon: Number,
        best_time: String,
        score: Number
      }],
      total_duration_mins: Number
    }]
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

privateChatSchema.index({ created_by: 1 });
privateChatSchema.index({ city_id: 1 });
privateChatSchema.index({ last_message_at: -1 });

module.exports = mongoose.model('PrivateChat', privateChatSchema);
