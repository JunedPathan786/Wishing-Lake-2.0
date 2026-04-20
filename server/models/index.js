const mongoose = require('mongoose');

// ─── ChatRoom Model ───────────────────────────────────────────────────────────
const chatRoomSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    relatedWish: { type: mongoose.Schema.Types.ObjectId, ref: 'Wish' },
    // Both parties must approve
    initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'blocked', 'closed'],
      default: 'pending',
      index: true,
    },
    // Admin override
    adminApproved: { type: Boolean, default: false },
    adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminNote: String,
    // Approval from both sides
    initiatorApproved: { type: Boolean, default: true },
    recipientApproved: { type: Boolean, default: false },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    lastActivity: { type: Date, default: Date.now },
    messageCount: { type: Number, default: 0 },
    isEncrypted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ status: 1, lastActivity: -1 });

chatRoomSchema.virtual('isFullyApproved').get(function () {
  return this.initiatorApproved && this.recipientApproved;
});

chatRoomSchema.methods.canSendMessage = function (userId) {
  const isParticipant = this.participants.some(p => p.toString() === userId.toString());
  return isParticipant && this.status === 'approved' && this.initiatorApproved && this.recipientApproved;
};

// ─── Message Model ────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'system', 'image', 'wish_share'],
      default: 'text',
    },
    metadata: {
      wishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wish' },
      imageUrl: String,
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    editedAt: Date,
  },
  { timestamps: true }
);

messageSchema.index({ chatRoom: 1, createdAt: -1 });

// ─── Notification Model ───────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'wish_fulfilled', 'wish_liked', 'wish_comment',
        'fulfillment_request', 'fulfillment_approved', 'fulfillment_rejected',
        'chat_request', 'chat_approved', 'chat_message',
        'badge_earned', 'admin_message', 'system',
        'wish_status_change', 'oracle_ready',
      ],
      required: true,
    },
    title: { type: String, required: true, maxlength: 100 },
    message: { type: String, required: true, maxlength: 500 },
    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,
    // Reference data
    data: {
      wishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wish' },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      chatRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
      fulfillmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'FulfillmentRequest' },
      badgeName: String,
      actionUrl: String,
    },
    // TTL - auto-delete after 90 days
    expiresAt: { type: Date, default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── FulfillmentRequest Model ─────────────────────────────────────────────────
const fulfillmentRequestSchema = new mongoose.Schema(
  {
    wish: { type: mongoose.Schema.Types.ObjectId, ref: 'Wish', required: true, index: true },
    fulfiller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    wishAuthor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'author_approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Please describe how you can fulfill this wish'],
      minlength: [20, 'Message must be at least 20 characters'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    authorNote: { type: String, maxlength: 500 },
    fulfillmentProof: { type: String, maxlength: 1000 },
    completedAt: Date,
    // Created chat room after approval
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
    // Karma awarded
    karmaAwarded: { type: Number, default: 0 },
    karmaAwardedAt: Date,
  },
  { timestamps: true }
);

fulfillmentRequestSchema.index({ wish: 1, fulfiller: 1 }, { unique: true });

module.exports = {
  ChatRoom: mongoose.model('ChatRoom', chatRoomSchema),
  Message: mongoose.model('Message', messageSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  FulfillmentRequest: mongoose.model('FulfillmentRequest', fulfillmentRequestSchema),
};
