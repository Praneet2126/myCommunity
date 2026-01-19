const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  travel_time_from_prev: { type: String, default: "0 mins" },
  location: { type: String },
  duration: { type: String },
  category: { type: String },
  region: { type: String },
  lat: { type: Number },
  lon: { type: Number }
}, { _id: false });

const ItineraryDaySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  activities: [ActivitySchema],
  total_duration_mins: { type: Number, default: 0 }
}, { _id: false });

const SavedItinerarySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  city_id: {
    type: String,
    ref: 'City',
    default: 'unknown'
  },
  days: [ItineraryDaySchema],
  num_people: {
    type: Number,
    required: true,
    min: 1
  },
  estimated_cost: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: 1000
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update updated_at before saving
SavedItinerarySchema.pre('save', async function() {
  if (this.isNew) {
    this.created_at = new Date();
  }
  this.updated_at = new Date();
});

// Index for efficient queries
SavedItinerarySchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('SavedItinerary', SavedItinerarySchema);
