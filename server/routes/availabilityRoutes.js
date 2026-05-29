const express = require('express');
const availabilityController = require('../controllers/availabilityController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route for users to see vendor availability
router.get('/vendors/:id', availabilityController.getPublicAvailability);

// Protected routes for vendors
router.use(protect);
router.use(authorize('vendor', 'admin'));

router.get('/vendor', availabilityController.getVendorAvailability);
router.post('/', availabilityController.updateAvailability);
router.post('/bulk', availabilityController.bulkUpdateAvailability);
router.delete('/:id', availabilityController.deleteAvailability);

module.exports = router;
