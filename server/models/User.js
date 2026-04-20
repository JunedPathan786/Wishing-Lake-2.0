const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    // Profile
    displayName: { type: String, maxlength: 50 },
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 300 },
    // Account status
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: true }, // Admin can suspend
    // Gamification
    badges: [
      {
        name: String,
        icon: String,
        awardedAt: { type: Date, default: Date.now },
      },
    ],
    wishCount: { type: Number, default: 0 },
    fulfillmentCount: { type: Number, default: 0 },
    karmaPoints: { type: Number, default: 0 },
    // Email verification
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    // Password reset
    passwordResetToken: String,
    passwordResetExpire: Date,
    // Refresh token (hashed)
    refreshToken: { type: String, select: false },
    // Activity
    lastSeen: { type: Date, default: Date.now },
    loginCount: { type: Number, default: 0 },
    // Preferences
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      publicProfile: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: true },
    },
    // Chat permissions
    chatAllowList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    chatBlockList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1, isApproved: 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
userSchema.virtual('profileComplete').get(function () {
  return !!(this.displayName && this.bio && this.avatar);
});

// ─── Pre-save hooks ───────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.pre('save', function (next) {
  if (!this.displayName) this.displayName = this.username;
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    username: this.username,
    displayName: this.displayName,
    avatar: this.avatar,
    bio: this.bio,
    badges: this.badges,
    wishCount: this.wishCount,
    fulfillmentCount: this.fulfillmentCount,
    karmaPoints: this.karmaPoints,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

// ─── Static Methods ───────────────────────────────────────────────────────────
userSchema.statics.getLeaderboard = function () {
  return this.find({ isActive: true })
    .sort({ karmaPoints: -1 })
    .limit(10)
    .select('username displayName avatar karmaPoints fulfillmentCount badges');
};

module.exports = mongoose.model('User', userSchema);
