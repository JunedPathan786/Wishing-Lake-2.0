const express = require('express');
const router = express.Router();
const { register, login, profile, logout, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/profile', protect, profile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

module.exports = router;
