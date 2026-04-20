// routes/fulfillment.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const fulfillmentController = require('../controllers/fulfillmentController');
const { protect } = require('../middleware/auth');

router.post('/wish/:wishId/offer', protect, [
  body('message').trim().isLength({ min: 20, max: 1000 }),
], fulfillmentController.offerFulfillment);

router.patch('/:requestId/respond', protect, [
  body('action').isIn(['approve', 'reject']),
], fulfillmentController.respondToFulfillment);

router.get('/wish/:wishId', protect, fulfillmentController.getWishFulfillmentRequests);
router.get('/mine', protect, fulfillmentController.getMyFulfillments);
router.patch('/:requestId/complete', protect, fulfillmentController.markComplete);

module.exports = router;
