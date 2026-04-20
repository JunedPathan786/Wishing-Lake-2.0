const User = require('../models/User');
const Wish = require('../models/Wish');
const { ChatRoom, Notification, FulfillmentRequest, Message } = require('../models/index');
const { AppError } = require('../utils/errors');

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── Dashboard Stats ───────────────────────────────────────────────────────────
exports.getDashboardStats = catchAsync(async (_req, res) => {
  const [
    totalUsers, activeUsers, verifiedUsers,
    totalWishes, activeWishes, fulfilledWishes,
    totalFulfillments, pendingFulfillments,
    totalChatRooms, pendingChats,
    reportedWishes,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isVerified: true }),
    Wish.countDocuments(),
    Wish.countDocuments({ status: 'active' }),
    Wish.countDocuments({ status: 'fulfilled' }),
    FulfillmentRequest.countDocuments(),
    FulfillmentRequest.countDocuments({ status: 'pending' }),
    ChatRoom.countDocuments(),
    ChatRoom.countDocuments({ status: 'pending' }),
    Wish.countDocuments({ 'reports.0': { $exists: true } }),
  ]);

  // New users in last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });
  const newWishesThisWeek = await Wish.countDocuments({ createdAt: { $gte: weekAgo } });

  // Category breakdown
  const wishCategories = await Wish.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Emotion breakdown
  const wishEmotions = await Wish.aggregate([
    { $group: { _id: '$emotion', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Daily wishes last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const wishTimeline = await Wish.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      users: { total: totalUsers, active: activeUsers, verified: verifiedUsers, newThisWeek: newUsersThisWeek },
      wishes: { total: totalWishes, active: activeWishes, fulfilled: fulfilledWishes, reported: reportedWishes, newThisWeek: newWishesThisWeek },
      fulfillments: { total: totalFulfillments, pending: pendingFulfillments },
      chats: { total: totalChatRooms, pending: pendingChats },
      charts: { categories: wishCategories, emotions: wishEmotions, timeline: wishTimeline },
    },
  });
});

// ─── User Management ───────────────────────────────────────────────────────────
exports.getAllUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, search, role, isActive } = req.query;

  const query = {};
  if (search) query.$or = [{ username: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .select('-password -refreshToken');

  res.status(200).json({ status: 'success', total, data: { users } });
});

exports.updateUserStatus = catchAsync(async (req, res, next) => {
  const { isActive, isApproved, role, note } = req.body;
  const user = await User.findById(req.params.userId);

  if (!user) return next(new AppError('User not found.', 404));
  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('Cannot modify your own admin status.', 400));
  }

  const updates = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (isApproved !== undefined) updates.isApproved = isApproved;
  if (role && ['user', 'moderator', 'admin'].includes(role)) updates.role = role;

  const updated = await User.findByIdAndUpdate(user._id, updates, { new: true }).select('-password -refreshToken');

  if (isActive === false) {
    await Notification.create({
      recipient: user._id,
      type: 'admin_message',
      title: 'Account Update',
      message: note || 'Your account status has been updated by an administrator.',
    });
  }

  res.status(200).json({ status: 'success', data: { user: updated } });
});

// ─── Wish Moderation ───────────────────────────────────────────────────────────
exports.moderateWish = catchAsync(async (req, res, next) => {
  const { action, note } = req.body; // action: 'approve' | 'reject' | 'archive'

  const wish = await Wish.findById(req.params.wishId);
  if (!wish) return next(new AppError('Wish not found.', 404));

  if (action === 'approve') {
    wish.isApproved = true;
    wish.status = 'active';
  } else if (action === 'reject') {
    wish.isApproved = false;
    wish.status = 'rejected';
    wish.moderationNote = note;
  } else if (action === 'archive') {
    wish.status = 'archived';
  }

  wish.moderatedBy = req.user._id;
  wish.moderatedAt = new Date();
  await wish.save();

  await Notification.create({
    recipient: wish.author,
    type: 'wish_status_change',
    title: `Wish ${action === 'approve' ? 'approved ✅' : action === 'reject' ? 'rejected' : 'archived'}`,
    message: note || `Your wish "${wish.title}" has been ${action}d by our moderation team.`,
    data: { wishId: wish._id },
  });

  res.status(200).json({ status: 'success', data: { wish } });
});

exports.getReportedWishes = catchAsync(async (req, res) => {
  const wishes = await Wish.find({ 'reports.0': { $exists: true }, isApproved: true })
    .populate('author', 'username email')
    .populate('reports.reportedBy', 'username')
    .sort('-updatedAt')
    .limit(50);

  res.status(200).json({ status: 'success', data: { wishes } });
});

// ─── Chat Management ───────────────────────────────────────────────────────────
exports.getPendingChats = catchAsync(async (_req, res) => {
  const chats = await ChatRoom.find({ status: 'pending' })
    .populate('participants', 'username displayName avatar')
    .populate('relatedWish', 'title')
    .sort('-createdAt');

  res.status(200).json({ status: 'success', data: { chats } });
});

exports.adminApprovechat = catchAsync(async (req, res, next) => {
  const { action, note } = req.body;
  const chatRoom = await ChatRoom.findById(req.params.chatRoomId);
  if (!chatRoom) return next(new AppError('Chat room not found.', 404));

  chatRoom.adminApproved = action === 'approve';
  chatRoom.adminApprovedBy = req.user._id;
  chatRoom.adminNote = note;

  if (action === 'approve') {
    chatRoom.recipientApproved = true;
    chatRoom.status = 'approved';
  } else {
    chatRoom.status = 'rejected';
  }

  await chatRoom.save();

  // Notify both participants
  for (const participantId of chatRoom.participants) {
    await Notification.create({
      recipient: participantId,
      type: 'admin_message',
      title: `Chat ${action === 'approve' ? 'approved' : 'rejected'} by admin`,
      message: note || `Your chat request has been ${action}d by an administrator.`,
      data: { chatRoomId: chatRoom._id },
    });
  }

  res.status(200).json({ status: 'success', data: { chatRoom } });
});

// ─── Broadcast Notification ───────────────────────────────────────────────────
exports.broadcastNotification = catchAsync(async (req, res) => {
  const { title, message, targetRole } = req.body;
  const query = targetRole ? { role: targetRole, isActive: true } : { isActive: true };
  const users = await User.find(query).select('_id');

  const notifications = users.map(u => ({
    recipient: u._id,
    type: 'admin_message',
    title,
    message,
  }));

  await Notification.insertMany(notifications);

  if (req.io) {
    req.io.emit('broadcast_notification', { title, message });
  }

  res.status(200).json({ status: 'success', message: `Notification sent to ${users.length} users.` });
});
