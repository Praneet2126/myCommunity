const mongoose = require('mongoose');

const privateChatSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Chat name cannot exceed 100 characters']
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
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

privateChatSchema.index({ created_by: 1 });
privateChatSchema.index({ last_message_at: -1 });

module.exports = mongoose.model('PrivateChat', privateChatSchema);
