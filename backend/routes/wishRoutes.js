// backend/routes/wishRoutes.js
const express = require('express');
const router = express.Router();
const {
  createWish,
  getAllWishes,
  getWishById,
  getMyWishes,
  getFulfillingWishes,
  getSavedWishes,
  createFulfillmentRequest,
  saveWish,
  likeWish,
  updateWish,
  deleteWish
} = require('../controllers/wishController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllWishes);
router.get('/:id', getWishById);

// Protected routes
router.post('/', protect, createWish);
router.get('/user/my-wishes', protect, getMyWishes);
router.get('/user/fulfilling', protect, getFulfillingWishes);
router.get('/user/saved', protect, getSavedWishes);

router.post('/:id/fulfill-request', protect, createFulfillmentRequest);
router.post('/:id/save', protect, saveWish);
router.post('/:id/like', protect, likeWish);

router.put('/:id', protect, updateWish);
router.delete('/:id', protect, deleteWish);

module.exports = router;

module.exports = router;