// routes/ai.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many Oracle requests. Please wait a moment.' },
});

router.get('/analyze/:wishId', protect, aiLimiter, aiController.analyzeWish);
router.get('/recommendations', protect, aiController.getRecommendations);
router.post('/oracle/chat', protect, aiLimiter, [
  body('message').trim().isLength({ min: 3, max: 500 }),
], aiController.oracleChat);

module.exports = router;
