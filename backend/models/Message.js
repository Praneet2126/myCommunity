const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chat_type: {
    type: String,
    enum: ['city', 'private'],
    required: true
  },
  chat_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'chat_ref'
  },
  chat_ref: {
    type: String,
    enum: ['CityChat', 'PrivateChat']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  message_type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  media_url: {
    type: String
  },
  reply_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  is_edited: {
    type: Boolean,
    default: false
  },
  is_deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

messageSchema.index({ chat_type: 1, chat_id: 1, created_at: -1 });
messageSchema.index({ sender_id: 1 });

// Set chat_ref based on chat_type before validation
messageSchema.pre('validate', function() {
  if (this.chat_type === 'city') {
    this.chat_ref = 'CityChat';
  } else if (this.chat_type === 'private') {
    this.chat_ref = 'PrivateChat';
  }
});

module.exports = mongoose.model('Message', messageSchema);
