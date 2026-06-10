const express = require('express');
const featureController = require('../controllers/featureController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const rateLimit = require('express-rate-limit');

const aiPlannerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many wedding plans generated from this IP, please try again after 15 minutes'
});

const router = express.Router();

// Public routes
router.get('/config', featureController.getSystemConfig);
router.get('/blogs', featureController.getBlogs);
router.get('/blogs/:slug', featureController.getBlogBySlug);
router.get('/testimonials', featureController.getTestimonials);
router.get('/stats', featureController.getHomeStats);
router.get('/contact-info', featureController.getContactInfo);
router.post('/contact', featureController.submitContact);
router.post('/upload', protect, upload.single('file'), featureController.uploadFile);

// Budget (Public)
router.post('/calculate-budget', featureController.calculateBudget);

// Protected routes
router.use(protect);

// Guests
router.route('/guests')
  .get(featureController.getGuests)
  .post(featureController.addGuest);

router.get('/guests/export', featureController.exportGuests);
router.post('/guests/import', upload.single('file'), featureController.importGuests);

router.route('/guests/:id')
  .patch(featureController.updateGuest)
  .delete(featureController.deleteGuest);

// Checklist
router.get('/checklist', featureController.getChecklist);
router.post('/checklist/task', featureController.addTaskToChecklist);
router.patch('/checklist/task', featureController.updateChecklistTask);
router.delete('/checklist/task/:taskId', featureController.deleteTaskFromChecklist);

// Leads
router.route('/leads')
  .get(featureController.getLeads)
  .post(featureController.createLead);

router.get('/leads/nearby', authorize('vendor', 'admin'), featureController.getNearbyLeads);
router.post('/leads/quote', authorize('vendor', 'admin'), featureController.submitQuotation);

module.exports = router;
