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
  recommendations: [{
    hotel_id: String,
    name: String,
    price: Number,
    stars: Number,
    description: String,
    image_url: String,
    similarity_score: Number,
    added_at: {
      type: Date,
      default: Date.now
    },
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
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
  activity_recommendations: [{
    name: String,
    duration: String,
    score: Number,
    category: String,
    region: String,
    lat: Number,
    lon: Number,
    best_time: String,
    generated_at: {
      type: Date,
      default: Date.now
    },
    based_on_messages: Number, // Number of messages used to generate these recommendations
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
  activity_itineraries: [{
    chat_id: String,
    title: String,
    days: [{
      day: Number,
      activities: [{
        name: String,
        place_name: String,
        duration: String,
        category: String,
        region: String,
        lat: Number,
        lon: Number,
        best_time: String,
        start_time: String,
        end_time: String,
        travel_time_from_prev: String
      }],
      total_duration_mins: Number
    }],
    hotels: [{
      hotel_id: String,
      name: String,
      price: Number,
      stars: Number,
      description: String,
      image_url: String,
      reason: String,  // Why this hotel was selected by AI
      recommended_for_days: [Number]  // Which days to stay at this hotel
    }],
    num_people: Number,
    hotel: {
      name: String,
      hotel_id: String,
      check_in: String,
      check_out: String,
      price: Number,
      stars: Number,
      description: String,
      image_url: String
    },
    generated_at: {
      type: Date,
      default: Date.now
    }
  }],
  cart: [{
    type: mongoose.Schema.Types.Mixed
  }],
  itineraries: [{
    type: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

privateChatSchema.index({ created_by: 1 });
privateChatSchema.index({ city_id: 1 });
privateChatSchema.index({ last_message_at: -1 });

module.exports = mongoose.model('PrivateChat', privateChatSchema);
