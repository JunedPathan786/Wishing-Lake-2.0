const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'wish_fulfilled',
      'fulfillment_request',
      'approval_granted',
      'approval_denied',
      'identity_revealed',
      'rating_received',
      'payment_received',
      'wish_liked',
      'new_message'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    wishId: mongoose.Schema.Types.ObjectId,
    fulfillmentRequestId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  link: String
}, {
  timestamps: true
});

// Auto-expire notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Notification', notificationSchema);
