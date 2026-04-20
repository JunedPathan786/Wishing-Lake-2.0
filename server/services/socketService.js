const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map();

const initSocketHandlers = (io) => {
  // ─── Auth Middleware for Socket ────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('username displayName avatar role isActive');

      if (!user || !user.isActive) return next(new Error('User not found or inactive'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info(`Socket connected: ${socket.user.username} [${socket.id}]`);

    // ─── Join personal room ──────────────────────────────────────────────────
    socket.join(`user:${userId}`);

    // ─── Track online users ──────────────────────────────────────────────────
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast online status
    io.emit('user_online', { userId, username: socket.user.username });

    // ─── Join Wishing Lake room (public feed) ────────────────────────────────
    socket.on('join_lake', () => {
      socket.join('wishing-lake');
      socket.emit('lake_joined', { message: 'You have entered the Wishing Lake.' });
    });

    socket.on('leave_lake', () => {
      socket.leave('wishing-lake');
    });

    // ─── Join Chat Room ────────────────────────────────────────────────────
    socket.on('join_chat', async ({ chatRoomId }) => {
      const { ChatRoom } = require('../models/index');
      try {
        const room = await ChatRoom.findById(chatRoomId);
        if (!room) return socket.emit('error', { message: 'Chat room not found' });

        const isParticipant = room.participants.some(p => p.toString() === userId);
        if (!isParticipant) return socket.emit('error', { message: 'Not authorized' });

        if (room.status !== 'approved') {
          return socket.emit('error', { message: 'Chat not yet approved' });
        }

        socket.join(`chat:${chatRoomId}`);
        socket.emit('chat_joined', { chatRoomId });

        // Notify other participant
        socket.to(`chat:${chatRoomId}`).emit('user_joined_chat', {
          userId,
          username: socket.user.username,
          chatRoomId,
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    socket.on('leave_chat', ({ chatRoomId }) => {
      socket.leave(`chat:${chatRoomId}`);
    });

    // ─── Typing Indicators ─────────────────────────────────────────────────
    socket.on('typing_start', ({ chatRoomId }) => {
      socket.to(`chat:${chatRoomId}`).emit('typing', {
        userId,
        username: socket.user.username,
        chatRoomId,
        isTyping: true,
      });
    });

    socket.on('typing_stop', ({ chatRoomId }) => {
      socket.to(`chat:${chatRoomId}`).emit('typing', {
        userId,
        chatRoomId,
        isTyping: false,
      });
    });

    // ─── Wish Ripple Effect (public lake animation) ────────────────────────
    socket.on('wish_ripple', ({ wishId, emotion }) => {
      socket.to('wishing-lake').emit('wish_ripple', { wishId, emotion, userId });
    });

    // ─── Presence Ping ─────────────────────────────────────────────────────
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).exec();
    });

    // ─── Get Online Users ──────────────────────────────────────────────────
    socket.on('get_online_users', () => {
      socket.emit('online_users', { userIds: Array.from(onlineUsers.keys()) });
    });

    // ─── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.user?.username} [${socket.id}]`);

      if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_offline', { userId });
          User.findByIdAndUpdate(userId, { lastSeen: new Date() }).exec();
        }
      }
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for ${socket.user?.username}: ${err.message}`);
    });
  });
};

const isUserOnline = (userId) => onlineUsers.has(userId.toString());
const getOnlineCount = () => onlineUsers.size;

module.exports = { initSocketHandlers, isUserOnline, getOnlineCount };
