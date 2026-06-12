const { PackageInquiry, Package } = require('../models/index');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendEmail, getPackageUserEmailHTML, getPackageAdminEmailHTML } = require('../utils/email');

// @desc    Submit new package inquiry
// @route   POST /api/package-inquiries
// @access  Public
exports.submitInquiry = catchAsync(async (req, res, next) => {
  const { name, phone, email, weddingDate, city, guestsCount, packageSelected, specialRequirements, budget, message } = req.body;

  // Validate package
  const pkg = await Package.findById(packageSelected);
  if (!pkg) {
    return next(new AppError('Invalid package selected', 400));
  }

  // Create inquiry
  const newInquiry = await PackageInquiry.create({
    name,
    phone,
    email,
    weddingDate,
    city,
    guestsCount,
    packageSelected,
    specialRequirements,
    budget,
    message
  });

  // Send Email to User (if email provided)
  if (email) {
    try {
      await sendEmail({
        email: email,
        subject: `We've received your Wedding Package Inquiry! 💍`,
        html: getPackageUserEmailHTML(name, pkg.name)
      });
    } catch (error) {
      console.error('Failed to send user confirmation email', error);
    }
  }

  // Send Alert to Admin
  try {
    await sendEmail({
      email: process.env.EMAIL_FROM || 'admin@shaadisaathi.com',
      subject: `🚨 New Package Inquiry: ${pkg.name}`,
      html: getPackageAdminEmailHTML(newInquiry, pkg)
    });
  } catch (error) {
    console.error('Failed to send admin alert email', error);
  }

  res.status(201).json({
    success: true,
    data: newInquiry
  });
});

// @desc    Get all inquiries
// @route   GET /api/package-inquiries
// @access  Private/Admin
exports.getInquiries = catchAsync(async (req, res, next) => {
  const inquiries = await PackageInquiry.find()
    .populate('packageSelected', 'name price')
    .sort('-createdAt');
    
  res.status(200).json({
    success: true,
    count: inquiries.length,
    data: inquiries
  });
});

// @desc    Update inquiry (status, budget, assignment, notes)
// @route   PUT /api/package-inquiries/:id
// @access  Private/Admin
exports.updateInquiry = catchAsync(async (req, res, next) => {
  const { status, note, budget, assignedVendor } = req.body;
  
  const updateData = {};
  if (status) updateData.status = status;
  if (budget) updateData.budget = budget;
  if (assignedVendor) updateData.assignedVendor = assignedVendor;
  
  if (note) {
    updateData.$push = { notes: { text: note } };
  }

  const inquiry = await PackageInquiry.findByIdAndUpdate(
    req.params.id, 
    updateData,
    { new: true, runValidators: true }
  ).populate('packageSelected', 'name price');

  if (!inquiry) {
    return next(new AppError('No inquiry found with that ID', 404));
  }

  res.status(200).json({
    success: true,
    data: inquiry
  });
});

// @desc    Delete inquiry
// @route   DELETE /api/package-inquiries/:id
// @access  Private/Admin
exports.deleteInquiry = catchAsync(async (req, res, next) => {
  const inquiry = await PackageInquiry.findByIdAndDelete(req.params.id);

  if (!inquiry) {
    return next(new AppError('No inquiry found with that ID', 404));
  }

  res.status(204).json({
    success: true,
    data: null
  });
});
