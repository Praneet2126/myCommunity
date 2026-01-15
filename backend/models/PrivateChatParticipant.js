const mongoose = require('mongoose');

const privateChatParticipantSchema = new mongoose.Schema({
  chat_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrivateChat',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  joined_at: {
    type: Date,
    default: Date.now
  },
  last_read_at: {
    type: Date
  },
  notifications_enabled: {
    type: Boolean,
    default: true
  }
});

privateChatParticipantSchema.index({ chat_id: 1, user_id: 1 }, { unique: true });
privateChatParticipantSchema.index({ user_id: 1 });

module.exports = mongoose.model('PrivateChatParticipant', privateChatParticipantSchema);
