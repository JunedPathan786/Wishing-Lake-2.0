// ============================================================
// routes/auth.js
// ============================================================
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], authController.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], authController.login);

router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', body('email').isEmail(), authController.forgotPassword);
router.patch('/reset-password/:token', body('password').isLength({ min: 8 }), authController.resetPassword);
router.get('/me', protect, authController.getMe);
router.patch('/update-profile', protect, authController.updateProfile);
router.patch('/change-password', protect, authController.changePassword);

module.exports = router;

// ============================================================
// Note: Each route file is in its own file in the routes/ folder
// This combined file shows all routes - split them into individual files
// ============================================================
