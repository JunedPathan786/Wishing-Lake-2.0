const { validationResult } = require('express-validator');
const Wish = require('../models/Wish');
const User = require('../models/User');
const { Notification, FulfillmentRequest } = require('../models/index');
const { AppError } = require('../utils/errors');

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── Create Wish (Drop into Lake) ─────────────────────────────────────────────
exports.createWish = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

  const { title, description, category, emotion, visibility, tags } = req.body;

  const wish = await Wish.create({
    author: req.user._id,
    title,
    description,
    category,
    emotion: emotion || 'hopeful',
    visibility: visibility || 'public',
    tags: tags || [],
    coinDroppedAt: new Date(),
  });

  // Increment user wish count
  await User.findByIdAndUpdate(req.user._id, { $inc: { wishCount: 1 } });

  // Populate author for response
  await wish.populate('author', 'username displayName avatar');

  // Emit real-time event to lake watchers
  if (req.io && wish.visibility === 'public') {
    req.io.to('wishing-lake').emit('new_wish', {
      _id: wish._id,
      title: wish.title,
      emotion: wish.emotion,
      emotionColor: wish.emotionColor,
      emotionGlow: wish.emotionGlow,
      author: wish.visibility === 'anonymous' ? null : wish.author,
      visibility: wish.visibility,
      createdAt: wish.createdAt,
    });
  }

  res.status(201).json({ status: 'success', data: { wish } });
});

// ─── Get Public Feed ──────────────────────────────────────────────────────────
exports.getWishFeed = catchAsync(async (req, res) => {
  const { page = 1, limit = 12, category, emotion, sort = '-createdAt', search } = req.query;

  let wishes, total;

  if (search) {
    wishes = await Wish.searchWishes(search, {
      ...(category && { category }),
      ...(emotion && { emotion }),
    });
    total = wishes.length;
  } else {
    const query = {
      visibility: { $in: ['public', 'anonymous'] },
      status: { $in: ['active', 'matched', 'fulfilled'] },
      isApproved: true,
    };
    if (category) query.category = category;
    if (emotion) query.emotion = emotion;

    let sortOption = {};
    if (sort === '-createdAt') sortOption = { createdAt: -1 };
    else if (sort === '-likeCount') sortOption = { likeCount: -1 };
    else if (sort === '-viewCount') sortOption = { viewCount: -1 };

    total = await Wish.countDocuments(query);
    wishes = await Wish.find(query)
      .populate('author', 'username displayName avatar badges')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Add virtual fields to lean results
    wishes = wishes.map(w => ({
      ...w,
      emotionColor: getEmotionColor(w.emotion),
      emotionGlow: getEmotionGlow(w.emotion),
      // Mask anonymous author
      author: w.visibility === 'anonymous' ? null : w.author,
    }));
  }

  res.status(200).json({
    status: 'success',
    results: wishes.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: { wishes },
  });
});

// ─── Get Single Wish ──────────────────────────────────────────────────────────
exports.getWish = catchAsync(async (req, res, next) => {
  const wish = await Wish.findById(req.params.id)
    .populate('author', 'username displayName avatar badges karmaPoints')
    .populate('fulfilledBy', 'username displayName avatar');

  if (!wish) return next(new AppError('Wish not found.', 404));

  // Check visibility
  if (wish.visibility === 'private') {
    if (!req.user || wish.author._id.toString() !== req.user._id.toString()) {
      return next(new AppError('This wish is private.', 403));
    }
  }

  // Increment view count (non-blocking)
  Wish.findByIdAndUpdate(wish._id, { $inc: { viewCount: 1 } }).exec();

  res.status(200).json({ status: 'success', data: { wish } });
});

// ─── Update Wish ──────────────────────────────────────────────────────────────
exports.updateWish = catchAsync(async (req, res, next) => {
  const wish = await Wish.findById(req.params.id);
  if (!wish) return next(new AppError('Wish not found.', 404));

  if (wish.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You can only edit your own wishes.', 403));
  }

  if (['fulfilled', 'archived'].includes(wish.status)) {
    return next(new AppError('Cannot edit a fulfilled or archived wish.', 400));
  }

  const allowed = ['title', 'description', 'category', 'emotion', 'visibility', 'tags'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) wish[field] = req.body[field];
  });

  await wish.save();
  res.status(200).json({ status: 'success', data: { wish } });
});

// ─── Delete Wish ──────────────────────────────────────────────────────────────
exports.deleteWish = catchAsync(async (req, res, next) => {
  const wish = await Wish.findById(req.params.id);
  if (!wish) return next(new AppError('Wish not found.', 404));

  if (wish.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You can only delete your own wishes.', 403));
  }

  await wish.deleteOne();
  await User.findByIdAndUpdate(req.user._id, { $inc: { wishCount: -1 } });

  res.status(204).json({ status: 'success', data: null });
});

// ─── Like / Unlike Wish ───────────────────────────────────────────────────────
exports.toggleLike = catchAsync(async (req, res, next) => {
  const wish = await Wish.findById(req.params.id);
  if (!wish) return next(new AppError('Wish not found.', 404));

  const userId = req.user._id;
  const isLiked = wish.likes.some(id => id.toString() === userId.toString());

  if (isLiked) {
    wish.likes.pull(userId);
  } else {
    wish.likes.push(userId);
    // Notify wish author (non-blocking)
    if (wish.author.toString() !== userId.toString()) {
      Notification.create({
        recipient: wish.author,
        type: 'wish_liked',
        title: '💛 Someone liked your wish!',
        message: `${req.user.displayName} resonated with your wish "${wish.title}".`,
        data: { wishId: wish._id, userId },
      }).catch(() => {});
    }
  }

  wish.likeCount = wish.likes.length;
  await wish.save();

  res.status(200).json({
    status: 'success',
    data: { liked: !isLiked, likeCount: wish.likeCount },
  });
});

// ─── My Wishes ────────────────────────────────────────────────────────────────
exports.getMyWishes = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { author: req.user._id };
  if (status) query.status = status;

  const total = await Wish.countDocuments(query);
  const wishes = await Wish.find(query)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const enriched = wishes.map(w => ({
    ...w,
    emotionColor: getEmotionColor(w.emotion),
    emotionGlow: getEmotionGlow(w.emotion),
  }));

  res.status(200).json({ status: 'success', total, data: { wishes: enriched } });
});

// ─── Report Wish ──────────────────────────────────────────────────────────────
exports.reportWish = catchAsync(async (req, res, next) => {
  const wish = await Wish.findById(req.params.id);
  if (!wish) return next(new AppError('Wish not found.', 404));

  const alreadyReported = wish.reports.some(r => r.reportedBy.toString() === req.user._id.toString());
  if (alreadyReported) return next(new AppError('You have already reported this wish.', 400));

  wish.reports.push({ reportedBy: req.user._id, reason: req.body.reason });
  await wish.save();

  res.status(200).json({ status: 'success', message: 'Wish reported. Our team will review it.' });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getEmotionColor = (emotion) => {
  const map = { hopeful: '#FBBF24', sad: '#94A3B8', urgent: '#F87171', dreamy: '#F8FAFC', joyful: '#34D399', anxious: '#FB923C', grateful: '#A78BFA' };
  return map[emotion] || '#FBBF24';
};

const getEmotionGlow = (emotion) => {
  const map = { hopeful: 'rgba(251,191,36,0.5)', sad: 'rgba(148,163,184,0.3)', urgent: 'rgba(248,113,113,0.5)', dreamy: 'rgba(248,250,252,0.6)', joyful: 'rgba(52,211,153,0.5)', anxious: 'rgba(251,146,60,0.5)', grateful: 'rgba(167,139,250,0.5)' };
  return map[emotion] || 'rgba(251,191,36,0.5)';
};
