const mongoose = require('mongoose');

const wishSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Wish title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Wish description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      enum: [
        'health', 'love', 'career', 'family', 'travel', 'education',
        'financial', 'personal_growth', 'community', 'creative', 'other',
      ],
      default: 'other',
    },
    emotion: {
      type: String,
      enum: ['hopeful', 'sad', 'urgent', 'dreamy', 'joyful', 'anxious', 'grateful'],
      default: 'hopeful',
    },
    emotionScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    // Privacy & visibility
    visibility: {
      type: String,
      enum: ['public', 'private', 'anonymous'],
      default: 'public',
    },
    // Status workflow
    status: {
      type: String,
      enum: ['pending', 'in_review', 'active', 'matched', 'fulfilled', 'archived', 'rejected'],
      default: 'active',
      index: true,
    },
    // Moderation
    isApproved: { type: Boolean, default: true },
    moderationNote: String,
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: Date,
    // Fulfillment tracking
    fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fulfilledAt: Date,
    fulfillmentNote: String,
    // AI analysis
    aiAnalysis: {
      sentiment: String,
      tags: [String],
      suggestedActions: [String],
      oracleMessage: String,
      analyzedAt: Date,
    },
    // Engagement
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    // Coin ritual metadata
    coinDroppedAt: Date,
    coinAnimation: {
      rippleCount: { type: Number, default: 3 },
    },
    // Tags for search
    tags: [{ type: String, lowercase: true, trim: true }],
    // Reported content
    reports: [
      {
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        reportedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
wishSchema.index({ author: 1, status: 1 });
wishSchema.index({ visibility: 1, status: 1, createdAt: -1 });
wishSchema.index({ category: 1, emotion: 1 });
wishSchema.index({ tags: 1 });
wishSchema.index({ likeCount: -1 });
wishSchema.index({ '$**': 'text' }, { name: 'wish_text_index', weights: { title: 3, description: 1, tags: 2 } });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
wishSchema.virtual('emotionColor').get(function () {
  const colorMap = {
    hopeful: '#FBBF24',
    sad: '#94A3B8',
    urgent: '#F87171',
    dreamy: '#F8FAFC',
    joyful: '#34D399',
    anxious: '#FB923C',
    grateful: '#A78BFA',
  };
  return colorMap[this.emotion] || '#FBBF24';
});

wishSchema.virtual('emotionGlow').get(function () {
  const glowMap = {
    hopeful: 'rgba(251,191,36,0.5)',
    sad: 'rgba(148,163,184,0.3)',
    urgent: 'rgba(248,113,113,0.5)',
    dreamy: 'rgba(248,250,252,0.6)',
    joyful: 'rgba(52,211,153,0.5)',
    anxious: 'rgba(251,146,60,0.5)',
    grateful: 'rgba(167,139,250,0.5)',
  };
  return glowMap[this.emotion] || 'rgba(251,191,36,0.5)';
});

wishSchema.virtual('fulfillmentRequests', {
  ref: 'FulfillmentRequest',
  localField: '_id',
  foreignField: 'wish',
  count: true,
});

// ─── Pre-save ─────────────────────────────────────────────────────────────────
wishSchema.pre('save', function (next) {
  if (this.isModified('likes')) {
    this.likeCount = this.likes.length;
  }
  next();
});

// ─── Static Methods ───────────────────────────────────────────────────────────
wishSchema.statics.getPublicFeed = function ({ page = 1, limit = 12, category, emotion, sort = '-createdAt' }) {
  const query = { visibility: { $in: ['public', 'anonymous'] }, status: { $in: ['active', 'matched'] }, isApproved: true };
  if (category) query.category = category;
  if (emotion) query.emotion = emotion;
  return this.find(query)
    .populate('author', 'username displayName avatar badges')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
};

wishSchema.statics.searchWishes = function (searchText, filters = {}) {
  return this.find({
    $text: { $search: searchText },
    visibility: { $in: ['public', 'anonymous'] },
    isApproved: true,
    ...filters,
  }, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .populate('author', 'username displayName avatar')
    .limit(20);
};

module.exports = mongoose.model('Wish', wishSchema);
