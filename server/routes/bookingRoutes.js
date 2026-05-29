const express = require('express');
const router = express.Router();
const { protect, authorize, verified, restrictToApproved } = require('../middleware/authMiddleware');
const { 
  createBooking, 
  getMyBookings, 
  getVendorBookings, 
  getAdminBookings,
  updateBookingStatus, 
  cancelBooking, 
  getBookingById,
  deleteBooking,
  getUserDashboard,
  getVendorServicesBookings,
  getVendorCabsBookings
} = require('../controllers/bookingController');

router.use(protect);

router.get('/user-dashboard', verified, getUserDashboard);
router.post('/', authorize('user'), verified, createBooking);
router.get('/my-bookings', verified, (req, res, next) => {
  req.query.bookingType = 'service';
  getMyBookings(req, res, next);
});
router.get('/vendor-bookings', authorize('vendor', 'admin'), verified, restrictToApproved, getVendorBookings);
router.get('/vendor/services', authorize('vendor', 'admin'), verified, restrictToApproved, getVendorServicesBookings);
router.get('/vendor/cabs', authorize('vendor', 'admin'), verified, restrictToApproved, getVendorCabsBookings);
router.get('/vendor', authorize('vendor', 'admin'), verified, restrictToApproved, getVendorBookings);
router.get('/admin-bookings', authorize('admin'), getAdminBookings);
router.get('/admin', authorize('admin'), getAdminBookings);
router.get('/:id', verified, getBookingById);
router.patch('/:id/status', authorize('vendor', 'admin'), verified, restrictToApproved, updateBookingStatus);
router.patch('/:id/cancel', verified, cancelBooking);
router.delete('/:id', authorize('admin', 'vendor'), deleteBooking);

module.exports = router;
