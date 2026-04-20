// routes/chat.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/', protect, chatController.getMyChatRooms);
router.post('/request', protect, [
  body('recipientId').isMongoId(),
], chatController.requestChat);
router.patch('/:chatRoomId/respond', protect, [
  body('action').isIn(['accept', 'reject']),
], chatController.respondToRequest);
router.get('/:chatRoomId/messages', protect, chatController.getChatMessages);
router.post('/:chatRoomId/messages', protect, [
  body('content').trim().isLength({ min: 1, max: 2000 }),
], chatController.sendMessage);
router.delete('/messages/:messageId', protect, chatController.deleteMessage);

module.exports = router;
