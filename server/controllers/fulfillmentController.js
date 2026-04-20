const Wish = require('../models/Wish');
const User = require('../models/User');
const { FulfillmentRequest, Notification, ChatRoom } = require('../models/index');
const { AppError } = require('../utils/errors');

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── Submit Fulfillment Offer ──────────────────────────────────────────────────
exports.offerFulfillment = catchAsync(async (req, res, next) => {
  const wish = await Wish.findById(req.params.wishId);
  if (!wish) return next(new AppError('Wish not found.', 404));

  if (wish.author.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot fulfill your own wish.', 400));
  }

  if (!['active', 'matched'].includes(wish.status)) {
    return next(new AppError('This wish is no longer accepting fulfillment offers.', 400));
  }

  // Check for existing request
  const existing = await FulfillmentRequest.findOne({
    wish: wish._id,
    fulfiller: req.user._id,
    status: { $nin: ['rejected', 'cancelled'] },
  });

  if (existing) return next(new AppError('You already have an active offer for this wish.', 400));

  const request = await FulfillmentRequest.create({
    wish: wish._id,
    fulfiller: req.user._id,
    wishAuthor: wish.author,
    message: req.body.message,
  });

  // Update wish status
  await Wish.findByIdAndUpdate(wish._id, { status: 'matched' });

  // Notify wish author
  await Notification.create({
    recipient: wish.author,
    type: 'fulfillment_request',
    title: '🌟 Someone wants to fulfill your wish!',
    message: `${req.user.displayName} has offered to make your wish "${wish.title}" come true.`,
    data: { wishId: wish._id, userId: req.user._id, fulfillmentId: request._id },
  });

  // Real-time notification
  if (req.io) {
    req.io.to(`user:${wish.author.toString()}`).emit('fulfillment_request', {
      fulfillmentId: request._id,
      wishTitle: wish.title,
      fulfillerName: req.user.displayName,
    });
  }

  await request.populate([
    { path: 'fulfiller', select: 'username displayName avatar' },
    { path: 'wish', select: 'title emotion' },
  ]);

  res.status(201).json({ status: 'success', data: { request } });
});

// ─── Author Approves / Rejects Fulfillment ────────────────────────────────────
exports.respondToFulfillment = catchAsync(async (req, res, next) => {
  const { action, note } = req.body; // action: 'approve' | 'reject'

  const request = await FulfillmentRequest.findById(req.params.requestId)
    .populate('wish')
    .populate('fulfiller', 'username displayName email');

  if (!request) return next(new AppError('Fulfillment request not found.', 404));

  if (request.wishAuthor.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the wish author can respond to fulfillment requests.', 403));
  }

  if (request.status !== 'pending') {
    return next(new AppError('This request has already been responded to.', 400));
  }

  if (action === 'approve') {
    request.status = 'author_approved';
    request.authorNote = note;

    // Create a chat room between the two users
    const chatRoom = await ChatRoom.create({
      participants: [req.user._id, request.fulfiller._id],
      relatedWish: request.wish._id,
      initiator: req.user._id,
      recipient: request.fulfiller._id,
      initiatorApproved: true,
      recipientApproved: true,
      status: 'approved',
    });

    request.chatRoom = chatRoom._id;
    await request.save();

    // Mark wish as fulfilled
    await Wish.findByIdAndUpdate(request.wish._id, {
      status: 'fulfilled',
      fulfilledBy: request.fulfiller._id,
      fulfilledAt: new Date(),
      fulfillmentNote: note,
    });

    // Award karma
    const KARMA_AMOUNT = 50;
    await User.findByIdAndUpdate(request.fulfiller._id, {
      $inc: { fulfillmentCount: 1, karmaPoints: KARMA_AMOUNT },
    });

    request.karmaAwarded = KARMA_AMOUNT;
    request.karmaAwardedAt = new Date();
    await request.save();

    // Check for "Kind Soul" badge
    const fulfiller = await User.findById(request.fulfiller._id);
    if (fulfiller.fulfillmentCount >= 1 && !fulfiller.badges.some(b => b.name === 'Kind Soul')) {
      fulfiller.badges.push({ name: 'Kind Soul', icon: '💛' });
      await fulfiller.save({ validateBeforeSave: false });
    }

    // Notify fulfiller
    await Notification.create({
      recipient: request.fulfiller._id,
      type: 'fulfillment_approved',
      title: '🎉 Your offer was accepted!',
      message: `${req.user.displayName} accepted your offer to fulfill "${request.wish.title}". A chat room has been opened!`,
      data: { wishId: request.wish._id, chatRoomId: chatRoom._id, fulfillmentId: request._id },
    });

    if (req.io) {
      req.io.to(`user:${request.fulfiller._id.toString()}`).emit('fulfillment_approved', {
        chatRoomId: chatRoom._id,
        wishTitle: request.wish.title,
        karmaEarned: KARMA_AMOUNT,
      });
    }

  } else if (action === 'reject') {
    request.status = 'rejected';
    request.authorNote = note;
    await request.save();

    // Reset wish to active if no other pending requests
    const activeFulfillments = await FulfillmentRequest.countDocuments({
      wish: request.wish._id,
      status: { $in: ['pending', 'author_approved'] },
    });
    if (activeFulfillments === 0) {
      await Wish.findByIdAndUpdate(request.wish._id, { status: 'active' });
    }

    await Notification.create({
      recipient: request.fulfiller._id,
      type: 'fulfillment_rejected',
      title: 'Fulfillment request not approved',
      message: `Your offer for "${request.wish.title}" was not accepted this time.`,
      data: { wishId: request.wish._id, fulfillmentId: request._id },
    });
  } else {
    return next(new AppError('Action must be "approve" or "reject".', 400));
  }

  res.status(200).json({ status: 'success', data: { request } });
});

// ─── Get Fulfillment Requests for a Wish ──────────────────────────────────────
exports.getWishFulfillmentRequests = catchAsync(async (req, res, next) => {
  const wish = await Wish.findById(req.params.wishId);
  if (!wish) return next(new AppError('Wish not found.', 404));

  if (wish.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized.', 403));
  }

  const requests = await FulfillmentRequest.find({ wish: wish._id })
    .populate('fulfiller', 'username displayName avatar badges karmaPoints')
    .sort('-createdAt');

  res.status(200).json({ status: 'success', data: { requests } });
});

// ─── Get My Fulfillment History ───────────────────────────────────────────────
exports.getMyFulfillments = catchAsync(async (req, res) => {
  const requests = await FulfillmentRequest.find({ fulfiller: req.user._id })
    .populate('wish', 'title emotion status')
    .populate('wishAuthor', 'username displayName avatar')
    .sort('-createdAt')
    .limit(50);

  res.status(200).json({ status: 'success', data: { requests } });
});

// ─── Mark Fulfillment as Complete ─────────────────────────────────────────────
exports.markComplete = catchAsync(async (req, res, next) => {
  const request = await FulfillmentRequest.findOne({
    _id: req.params.requestId,
    status: 'author_approved',
  });

  if (!request) return next(new AppError('Request not found or not in approved state.', 404));

  if (request.fulfiller.toString() !== req.user._id.toString() &&
      request.wishAuthor.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized.', 403));
  }

  request.status = 'completed';
  request.completedAt = new Date();
  request.fulfillmentProof = req.body.proof || '';
  await request.save();

  res.status(200).json({ status: 'success', data: { request } });
});
