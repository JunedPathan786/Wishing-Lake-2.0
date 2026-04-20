const { ChatRoom, Message, Notification } = require('../models/index');
const User = require('../models/User');
const { AppError } = require('../utils/errors');

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── Request Chat ──────────────────────────────────────────────────────────────
exports.requestChat = catchAsync(async (req, res, next) => {
  const { recipientId, wishId, message } = req.body;

  if (recipientId === req.user._id.toString()) {
    return next(new AppError('Cannot start a chat with yourself.', 400));
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) return next(new AppError('User not found.', 404));

  // Check for existing room
  const existing = await ChatRoom.findOne({
    participants: { $all: [req.user._id, recipientId] },
    status: { $nin: ['rejected', 'blocked'] },
  });

  if (existing) {
    return res.status(200).json({
      status: 'success',
      message: 'Chat room already exists.',
      data: { chatRoom: existing },
    });
  }

  // Check if recipient has blocked this user
  if (recipient.chatBlockList?.includes(req.user._id.toString())) {
    return next(new AppError('Unable to send chat request.', 403));
  }

  const chatRoom = await ChatRoom.create({
    participants: [req.user._id, recipientId],
    relatedWish: wishId || null,
    initiator: req.user._id,
    recipient: recipientId,
    initiatorApproved: true,
    recipientApproved: false,
    status: 'pending',
  });

  // Notification to recipient
  await Notification.create({
    recipient: recipientId,
    type: 'chat_request',
    title: '💬 New chat request',
    message: `${req.user.displayName} wants to connect with you.`,
    data: { chatRoomId: chatRoom._id, userId: req.user._id },
  });

  if (req.io) {
    req.io.to(`user:${recipientId}`).emit('chat_request', {
      chatRoomId: chatRoom._id,
      from: { _id: req.user._id, displayName: req.user.displayName, avatar: req.user.avatar },
    });
  }

  // Create initial system message
  if (message) {
    await Message.create({
      chatRoom: chatRoom._id,
      sender: req.user._id,
      content: message,
      type: 'text',
    });
  }

  res.status(201).json({ status: 'success', data: { chatRoom } });
});

// ─── Respond to Chat Request ───────────────────────────────────────────────────
exports.respondToRequest = catchAsync(async (req, res, next) => {
  const { action } = req.body; // 'accept' | 'reject'
  const chatRoom = await ChatRoom.findById(req.params.chatRoomId);

  if (!chatRoom) return next(new AppError('Chat room not found.', 404));

  if (chatRoom.recipient.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the recipient can respond to this request.', 403));
  }

  if (chatRoom.status !== 'pending') {
    return next(new AppError('This request has already been responded to.', 400));
  }

  if (action === 'accept') {
    chatRoom.recipientApproved = true;
    chatRoom.status = 'approved';
    await chatRoom.save();

    // System message
    await Message.create({
      chatRoom: chatRoom._id,
      sender: req.user._id,
      content: `${req.user.displayName} accepted the chat request. You can now exchange messages.`,
      type: 'system',
    });

    await Notification.create({
      recipient: chatRoom.initiator,
      type: 'chat_approved',
      title: '✅ Chat request accepted!',
      message: `${req.user.displayName} accepted your chat request.`,
      data: { chatRoomId: chatRoom._id, userId: req.user._id },
    });

    if (req.io) {
      req.io.to(`user:${chatRoom.initiator.toString()}`).emit('chat_accepted', {
        chatRoomId: chatRoom._id,
        acceptedBy: req.user.displayName,
      });
    }
  } else {
    chatRoom.status = 'rejected';
    await chatRoom.save();
  }

  res.status(200).json({ status: 'success', data: { chatRoom } });
});

// ─── Get My Chat Rooms ────────────────────────────────────────────────────────
exports.getMyChatRooms = catchAsync(async (req, res) => {
  const rooms = await ChatRoom.find({
    participants: req.user._id,
    status: { $nin: ['rejected'] },
  })
    .populate('participants', 'username displayName avatar lastSeen')
    .populate('relatedWish', 'title emotion')
    .populate('lastMessage')
    .sort('-lastActivity');

  res.status(200).json({ status: 'success', data: { rooms } });
});

// ─── Get Chat Messages ─────────────────────────────────────────────────────────
exports.getChatMessages = catchAsync(async (req, res, next) => {
  const chatRoom = await ChatRoom.findById(req.params.chatRoomId);

  if (!chatRoom) return next(new AppError('Chat room not found.', 404));

  const isParticipant = chatRoom.participants.some(
    p => p.toString() === req.user._id.toString()
  );
  if (!isParticipant && req.user.role !== 'admin') {
    return next(new AppError('You are not a participant in this chat.', 403));
  }

  if (chatRoom.status !== 'approved' && req.user.role !== 'admin') {
    return next(new AppError('This chat is not yet active.', 403));
  }

  const { page = 1, limit = 50 } = req.query;
  const messages = await Message.find({ chatRoom: chatRoom._id, isDeleted: false })
    .populate('sender', 'username displayName avatar')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  // Mark as read (non-blocking)
  Message.updateMany(
    { chatRoom: chatRoom._id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  ).exec();

  res.status(200).json({
    status: 'success',
    data: { messages: messages.reverse(), chatRoom },
  });
});

// ─── Send Message ──────────────────────────────────────────────────────────────
exports.sendMessage = catchAsync(async (req, res, next) => {
  const chatRoom = await ChatRoom.findById(req.params.chatRoomId);

  if (!chatRoom) return next(new AppError('Chat room not found.', 404));

  if (!chatRoom.canSendMessage(req.user._id)) {
    return next(new AppError('You cannot send messages in this chat. Both parties must approve.', 403));
  }

  const message = await Message.create({
    chatRoom: chatRoom._id,
    sender: req.user._id,
    content: req.body.content,
    type: req.body.type || 'text',
  });

  await message.populate('sender', 'username displayName avatar');

  // Update chat room last activity
  await ChatRoom.findByIdAndUpdate(chatRoom._id, {
    lastMessage: message._id,
    lastActivity: new Date(),
    $inc: { messageCount: 1 },
  });

  // Emit to chat room via socket
  if (req.io) {
    req.io.to(`chat:${chatRoom._id}`).emit('new_message', message);

    // Notify offline participant
    const otherParticipant = chatRoom.participants.find(
      p => p.toString() !== req.user._id.toString()
    );
    if (otherParticipant) {
      req.io.to(`user:${otherParticipant}`).emit('message_notification', {
        chatRoomId: chatRoom._id,
        senderName: req.user.displayName,
        preview: req.body.content.substring(0, 50),
      });
    }
  }

  res.status(201).json({ status: 'success', data: { message } });
});

// ─── Delete Message ───────────────────────────────────────────────────────────
exports.deleteMessage = catchAsync(async (req, res, next) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return next(new AppError('Message not found.', 404));

  if (message.sender.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only delete your own messages.', 403));
  }

  message.isDeleted = true;
  message.content = 'This message was deleted.';
  message.deletedAt = new Date();
  await message.save();

  if (req.io) {
    req.io.to(`chat:${message.chatRoom}`).emit('message_deleted', { messageId: message._id });
  }

  res.status(200).json({ status: 'success', data: { message } });
});
