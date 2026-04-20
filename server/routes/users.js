const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Wish = require('../models/Wish');
const { protect, optionalAuth } = require('../middleware/auth');
const { AppError } = require('../utils/errors');

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.get('/leaderboard', catchAsync(async (_req, res) => {
  const leaders = await User.getLeaderboard();
  res.status(200).json({ status: 'success', data: { leaders } });
}));

router.get('/:username/profile', optionalAuth, catchAsync(async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username })
    .select('username displayName avatar bio badges wishCount fulfillmentCount karmaPoints isVerified createdAt preferences');

  if (!user) return next(new AppError('User not found.', 404));
  if (!user.preferences?.publicProfile && (!req.user || req.user._id.toString() !== user._id.toString())) {
    return next(new AppError('This profile is private.', 403));
  }

  const publicWishes = await Wish.find({ author: user._id, visibility: 'public', isApproved: true })
    .sort('-createdAt').limit(6).lean();

  res.status(200).json({ status: 'success', data: { user, wishes: publicWishes } });
}));

router.patch('/block/:userId', protect, catchAsync(async (req, res, next) => {
  if (req.params.userId === req.user._id.toString()) return next(new AppError('Cannot block yourself.', 400));
  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { chatBlockList: req.params.userId },
    $pull: { chatAllowList: req.params.userId },
  });
  res.status(200).json({ status: 'success', message: 'User blocked.' });
}));

router.patch('/unblock/:userId', protect, catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { chatBlockList: req.params.userId } });
  res.status(200).json({ status: 'success', message: 'User unblocked.' });
}));

module.exports = router;
