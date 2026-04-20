// routes/notifications.js
const express = require('express');
const router = express.Router();
const { Notification } = require('../models/index');
const { protect } = require('../middleware/auth');
const { AppError } = require('../utils/errors');

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.get('/', protect, catchAsync(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const query = { recipient: req.user._id };
  if (unreadOnly === 'true') query.isRead = false;

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  const notifications = await Notification.find(query)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({ status: 'success', total, unreadCount, data: { notifications } });
}));

router.patch('/read-all', protect, catchAsync(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.status(200).json({ status: 'success', message: 'All notifications marked as read.' });
}));

router.patch('/:id/read', protect, catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) return next(new AppError('Notification not found.', 404));
  res.status(200).json({ status: 'success', data: { notification } });
}));

router.delete('/:id', protect, catchAsync(async (req, res, next) => {
  const n = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  if (!n) return next(new AppError('Notification not found.', 404));
  res.status(204).json({ status: 'success', data: null });
}));

module.exports = router;
