// routes/wishes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const wishController = require('../controllers/wishController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, wishController.getWishFeed);
router.get('/mine', protect, wishController.getMyWishes);
router.get('/:id', optionalAuth, wishController.getWish);
router.post('/', protect, [
  body('title').trim().isLength({ min: 5, max: 120 }),
  body('description').trim().isLength({ min: 20, max: 2000 }),
  body('emotion').optional().isIn(['hopeful', 'sad', 'urgent', 'dreamy', 'joyful', 'anxious', 'grateful']),
  body('visibility').optional().isIn(['public', 'private', 'anonymous']),
], wishController.createWish);
router.patch('/:id', protect, wishController.updateWish);
router.delete('/:id', protect, wishController.deleteWish);
router.patch('/:id/like', protect, wishController.toggleLike);
router.post('/:id/report', protect, wishController.reportWish);

module.exports = router;
