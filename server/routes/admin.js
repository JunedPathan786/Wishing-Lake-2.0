// routes/admin.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const adminOnly = [protect, restrictTo('admin')];
const modOrAdmin = [protect, restrictTo('admin', 'moderator')];

router.get('/stats', ...adminOnly, adminController.getDashboardStats);
router.get('/users', ...adminOnly, adminController.getAllUsers);
router.patch('/users/:userId', ...adminOnly, adminController.updateUserStatus);
router.get('/wishes/reported', ...modOrAdmin, adminController.getReportedWishes);
router.patch('/wishes/:wishId/moderate', ...modOrAdmin, adminController.moderateWish);
router.get('/chats/pending', ...adminOnly, adminController.getPendingChats);
router.patch('/chats/:chatRoomId', ...adminOnly, adminController.adminApprovechat);
router.post('/broadcast', ...adminOnly, [
  body('title').trim().notEmpty(),
  body('message').trim().notEmpty(),
], adminController.broadcastNotification);

module.exports = router;
