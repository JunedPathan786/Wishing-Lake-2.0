// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getFulfillmentRequests,
  giveFulfillmentConsent,
  rateFulfillment,
  getUserStats
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Profile routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/change-password', protect, changePassword);

// Notification routes
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);
router.put('/notifications/read-all', protect, markAllNotificationsRead);

// Fulfillment request routes
router.get('/fulfillment-requests', protect, getFulfillmentRequests);
router.post('/fulfillment-requests/:id/consent', protect, giveFulfillmentConsent);
router.post('/fulfillment-requests/:id/rate', protect, rateFulfillment);

// Stats route
router.get('/stats', protect, getUserStats);

module.exports = router;