// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllWishes,
  getAllFulfillmentRequests,
  approveFulfillmentRequest,
  rejectFulfillmentRequest,
  blockUser,
  getAnalytics,
  getWishDetails
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Apply auth and admin check to all routes
router.use(protect, adminOnly);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:id/block', blockUser);

// Wish management routes
router.get('/wishes', getAllWishes);
router.get('/wishes/:id', getWishDetails);

// Fulfillment request routes
router.get('/fulfillment-requests', getAllFulfillmentRequests);
router.put('/fulfillment-requests/:id/approve', approveFulfillmentRequest);
router.put('/fulfillment-requests/:id/reject', rejectFulfillmentRequest);

// Analytics route
router.get('/analytics', getAnalytics);

module.exports = router;