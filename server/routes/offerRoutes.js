const express = require('express');
const offerController = require('../controllers/offerController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes for customers
router.get('/public', offerController.getActiveOffers);

// Protect all routes below for vendors
router.use(protect);
router.use(authorize('vendor', 'admin'));

router
  .route('/')
  .get(offerController.getVendorOffers)
  .post(offerController.createOffer);

router
  .route('/:id')
  .patch(offerController.updateOffer)
  .delete(offerController.deleteOffer);

router.post('/:id/duplicate', offerController.duplicateOffer);

module.exports = router;
