const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(packageController.getPackages)
  .post(protect, authorize('admin'), packageController.createPackage);

router.route('/:id')
  .get(packageController.getPackage)
  .put(protect, authorize('admin'), packageController.updatePackage)
  .delete(protect, authorize('admin'), packageController.deletePackage);

module.exports = router;
