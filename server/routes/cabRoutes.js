const express = require('express');
const router = express.Router();
const { protect, authorize, verified, restrictToApproved } = require('../middleware/authMiddleware');
const {
  createCabBooking, getMyBookings, getVendorBookings, getBookingById, updateBookingStatus
} = require('../controllers/bookingController');
const { getCabs, getCabDetails, getBundleDetails } = require('../controllers/cabController');

// Public routes
router.get('/', getCabs);
router.get('/details/:id', getCabDetails);
router.get('/bundle/:bundleId', getBundleDetails);

// User Protected routes
router.post('/', protect, authorize('user'), verified, createCabBooking);
router.post('/book-bundle', protect, authorize('user'), verified, createCabBooking);
router.get('/my-bookings', protect, (req, res, next) => {
  req.query.bookingType = 'baraat-cab';
  getMyBookings(req, res, next);
});
router.get('/:id', protect, getBookingById);

// Vendor & Admin Protected routes
router.use(protect);
router.use(authorize('vendor', 'admin'));

router.get('/vendor-bookings', restrictToApproved, (req, res, next) => {
  req.query.bookingType = 'baraat-cab';
  getVendorBookings(req, res, next);
});
router.patch('/:id/status', restrictToApproved, updateBookingStatus);

module.exports = router;


