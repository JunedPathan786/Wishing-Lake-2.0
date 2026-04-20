// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentHistory,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes
router.post('/create-razorpay-order', protect, createRazorpayOrder);
router.post('/verify-razorpay', protect, verifyRazorpayPayment);
router.get('/history', protect, getPaymentHistory);

module.exports = router;