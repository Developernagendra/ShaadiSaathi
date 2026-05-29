// ==================== AUTH ROUTES ====================
const express = require('express');
const router = express.Router();
const { register, login, logout, verifyEmail, forgotPassword, resetPassword, getMe, changePassword, resendVerification, testEmail } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/resend-verification', resendVerification);
router.get('/test-email', testEmail);

module.exports = router;
