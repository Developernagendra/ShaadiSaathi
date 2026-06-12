const express = require('express');
const router = express.Router();
const packageInquiryController = require('../controllers/packageInquiryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(packageInquiryController.submitInquiry)
  .get(protect, authorize('admin'), packageInquiryController.getInquiries);

router.route('/:id')
  .put(protect, authorize('admin'), packageInquiryController.updateInquiry)
  .delete(protect, authorize('admin'), packageInquiryController.deleteInquiry);

module.exports = router;
