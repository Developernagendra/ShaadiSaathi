// ==================== AUTH ROUTES ====================
const express = require('express');
const router = express.Router();
const { register, login, logout, verifyEmail, forgotPassword, resetPassword, getMe, changePassword, resendVerification, testEmail } = require('../controllers/authController');
const { protect, restrictTo, adminOnly, vendorOnly, userOnly, verified, optionalAuth, restrictToApproved } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/resend-verification', resendVerification);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.patch('/update-password', protect, changePassword);
router.get('/test-email', testEmail);

module.exports = router;
