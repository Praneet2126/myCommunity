const mongoose = require('mongoose');

const cityChatSchema = new mongoose.Schema({
  city_id: {
    type: String,
    ref: 'City',
    required: true,
    unique: true
  },
  last_message_at: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

cityChatSchema.index({ city_id: 1 });

module.exports = mongoose.model('CityChat', cityChatSchema);
