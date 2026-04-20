const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { Notification } = require('../models/index');
const { generateTokens } = require('../middleware/auth');
const { AppError } = require('../utils/errors');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  const { username, email, password, displayName } = req.body;

  // Check existing
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const field = existing.email === email.toLowerCase() ? 'email' : 'username';
    return next(new AppError(`This ${field} is already registered.`, 400));
  }

  const user = await User.create({ username, email, password, displayName });

  // Create verification token
  const verifyToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email (non-blocking)
  emailService.sendVerificationEmail(user.email, user.displayName, verifyToken).catch((err) =>
    logger.error(`Email send failed: ${err.message}`)
  );

  // Welcome notification
  await Notification.create({
    recipient: user._id,
    type: 'system',
    title: '✨ Welcome to Wishing Lake!',
    message: 'Your journey to make wishes come true begins now. Drop your first wish into the lake!',
  });

  const { accessToken, refreshToken } = generateTokens(user._id);

  // Store hashed refresh token
  const hashedRefresh = await bcrypt.hash(refreshToken, 10);
  await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

  res.status(201).json({
    status: 'success',
    message: 'Account created successfully! Check your email to verify your account.',
    data: {
      user: user.toPublicJSON(),
      accessToken,
      refreshToken,
    },
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) return next(new AppError('Your account has been deactivated.', 403));
  if (!user.isApproved) return next(new AppError('Your account is pending approval.', 403, 'PENDING_APPROVAL'));

  // Update login metadata
  user.lastSeen = new Date();
  user.loginCount += 1;
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = generateTokens(user._id);

  const hashedRefresh = await bcrypt.hash(refreshToken, 10);
  await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

  res.status(200).json({
    status: 'success',
    data: {
      user: user.toPublicJSON(),
      accessToken,
      refreshToken,
    },
  });
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return next(new AppError('Refresh token required.', 400));

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || !user.refreshToken) {
    return next(new AppError('Session expired. Please log in again.', 401));
  }

  const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!isValid) return next(new AppError('Invalid refresh token.', 401));

  const tokens = generateTokens(user._id);
  const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
  await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

  res.status(200).json({
    status: 'success',
    data: tokens,
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
});

// ─── Email Verification ───────────────────────────────────────────────────────
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Invalid or expired verification link.', 400));

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  // Award verified badge
  user.badges.push({ name: 'Verified Soul', icon: '✉️' });
  user.karmaPoints += 10;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ status: 'success', message: 'Email verified successfully! You earned the "Verified Soul" badge.' });
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });

  // Always respond same to prevent user enumeration
  if (!user) {
    return res.status(200).json({
      status: 'success',
      message: 'If that email exists, a reset link has been sent.',
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  emailService.sendPasswordResetEmail(user.email, user.displayName, resetToken).catch((err) =>
    logger.error(`Reset email failed: ${err.message}`)
  );

  res.status(200).json({
    status: 'success',
    message: 'If that email exists, a reset link has been sent.',
  });
});

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Invalid or expired reset token.', 400));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  user.refreshToken = undefined; // Invalidate all sessions
  await user.save();

  res.status(200).json({ status: 'success', message: 'Password reset successfully. Please log in.' });
});

// ─── Get Current User ─────────────────────────────────────────────────────────
exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('chatAllowList', 'username displayName avatar');

  res.status(200).json({ status: 'success', data: { user } });
});

// ─── Update Profile ───────────────────────────────────────────────────────────
exports.updateProfile = catchAsync(async (req, res, next) => {
  const { displayName, bio, avatar, preferences } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { displayName, bio, avatar, preferences },
    { new: true, runValidators: true }
  );

  res.status(200).json({ status: 'success', data: { user: user.toPublicJSON() } });
});

// ─── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  user.password = req.body.newPassword;
  user.refreshToken = undefined;
  await user.save();

  const tokens = generateTokens(user._id);
  const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
  await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

  res.status(200).json({ status: 'success', message: 'Password changed. Please use your new credentials.', data: tokens });
});
