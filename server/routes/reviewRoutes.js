const express = require('express');
const router = express.Router();
const { protect, authorize, verified, optionalAuth } = require('../middleware/authMiddleware');
const { createReview, getVendorReviews, getCabReviews, updateReview, deleteReview, replyToReview, getVendorDashboardReviews, updateReviewStatus } = require('../controllers/reviewController');

router.post('/', protect, verified, createReview);
router.get('/dashboard', protect, authorize('vendor'), getVendorDashboardReviews);
router.get('/vendor/:vendorId', optionalAuth, getVendorReviews);
router.get('/cab/:cabId', optionalAuth, getCabReviews);

router.put('/:id', protect, verified, updateReview);
router.patch('/:id/status', protect, updateReviewStatus);
router.delete('/:id', protect, deleteReview);

router.post('/:id/reply', protect, authorize('vendor'), verified, replyToReview);

module.exports = router;
