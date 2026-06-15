const { Lead, Guest, Checklist, Blog, Contract, Category, Vendor, Service, Testimonial, HomeStats } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { cloudinary } = require('../config/cloudinary');
const { Parser } = require('json2csv');
const csv = require('csv-parser');
const stream = require('stream');

// ==================== BUDGET CALCULATOR ====================
exports.calculateBudget = catchAsync(async (req, res, next) => {
  const { budget, guestCount } = req.body;

  const distribution = {
    venue: Math.round(budget * 0.35),
    catering: Math.round(budget * 0.25),
    decoration: Math.round(budget * 0.15),
    photography: Math.round(budget * 0.10),
    makeup: Math.round(budget * 0.05),
    transport: Math.round(budget * 0.05),
    miscellaneous: Math.round(budget * 0.05)
  };

  res.status(200).json({
    status: 'success',
    data: { distribution }
  });
});

// ==================== GUEST MANAGEMENT ====================
exports.addGuest = catchAsync(async (req, res, next) => {
  req.body.user = req.user._id;
  const guest = await Guest.create(req.body);
  res.status(201).json({ status: 'success', data: { guest } });
});

exports.getGuests = catchAsync(async (req, res, next) => {
  const guests = await Guest.find({ user: req.user._id });
  res.status(200).json({ status: 'success', results: guests.length, data: { guests } });
});

exports.updateGuest = catchAsync(async (req, res, next) => {
  const guest = await Guest.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!guest) return next(new AppError('Guest not found', 404));
  res.status(200).json({ status: 'success', data: { guest } });
});

exports.deleteGuest = catchAsync(async (req, res, next) => {
  const guest = await Guest.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!guest) return next(new AppError('Guest not found', 404));
  res.status(204).json({ status: 'success', data: null });
});

exports.exportGuests = catchAsync(async (req, res, next) => {
  const guests = await Guest.find({ user: req.user._id });

  if (!guests || guests.length === 0) {
    return next(new AppError('No guests found to export', 404));
  }

  const fields = ['name', 'email', 'phone', 'relation', 'category', 'status', 'guestCount'];
  const json2csvParser = new Parser({ fields });
  const csvData = json2csvParser.parse(guests);

  res.header('Content-Type', 'text/csv');
  res.attachment('guests.csv');
  res.send(csvData);
});

exports.importGuests = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a CSV file', 400));
  }

  const guests = [];
  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  bufferStream
    .pipe(csv())
    .on('data', (row) => {
      guests.push({
        ...row,
        user: req.user._id,
        guestCount: parseInt(row.guestCount) || 1
      });
    })
    .on('end', async () => {
      try {
        await Guest.insertMany(guests);
        res.status(200).json({
          status: 'success',
          message: `${guests.length} guests imported successfully`,
        });
      } catch (err) {
        return next(new AppError('Error importing guests. Check CSV format.', 400));
      }
    });
});

// ==================== LEAD MARKETPLACE ====================
exports.createLead = catchAsync(async (req, res, next) => {
  req.body.user = req.user._id;
  const lead = await Lead.create(req.body);
  res.status(201).json({ status: 'success', data: { lead } });
});

exports.getLeads = catchAsync(async (req, res, next) => {
  const leads = await Lead.find({ user: req.user._id }).populate('serviceType');
  res.status(200).json({ status: 'success', data: { leads } });
});

exports.getNearbyLeads = catchAsync(async (req, res, next) => {
  // Logic for vendors to see leads in their city
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) return next(new AppError('Vendor profile not found', 404));

  const leads = await Lead.find({
    city: vendor.location.city,
    status: 'open'
  }).populate('user', 'name avatar');

  res.status(200).json({ status: 'success', data: { leads } });
});

exports.submitQuotation = catchAsync(async (req, res, next) => {
  const { leadId, amount, message } = req.body;
  const vendor = await Vendor.findOne({ user: req.user._id });

  const lead = await Lead.findById(leadId);
  if (!lead) return next(new AppError('Lead not found', 404));

  lead.quotations.push({
    vendor: vendor._id,
    amount,
    message
  });

  await lead.save();
  res.status(200).json({ status: 'success', data: { lead } });
});

// ==================== CHECKLIST ====================
exports.getChecklist = catchAsync(async (req, res, next) => {
  let checklist = await Checklist.findOne({ user: req.user._id });
  if (!checklist) {
    // Create default checklist
    const defaultTasks = [
      { title: 'Set Wedding Date', category: 'Planning' },
      { title: 'Finalize Budget', category: 'Planning' },
      { title: 'Book Venue', category: 'Booking' },
      { title: 'Hire Caterer', category: 'Booking' }
    ];
    checklist = await Checklist.create({ user: req.user._id, tasks: defaultTasks });
  }
  res.status(200).json({ status: 'success', data: { checklist } });
});

exports.updateChecklistTask = catchAsync(async (req, res, next) => {
  const { taskId, isCompleted, title, category, deadline, notes } = req.body;

  const updateFields = {};
  if (isCompleted !== undefined) updateFields['tasks.$.isCompleted'] = isCompleted;
  if (title) updateFields['tasks.$.title'] = title;
  if (category) updateFields['tasks.$.category'] = category;
  if (deadline) updateFields['tasks.$.deadline'] = deadline;
  if (notes) updateFields['tasks.$.notes'] = notes;

  const checklist = await Checklist.findOneAndUpdate(
    { user: req.user._id, 'tasks._id': taskId },
    { $set: updateFields },
    { new: true }
  );

  if (!checklist) return next(new AppError('Task not found', 404));
  res.status(200).json({ status: 'success', data: { checklist } });
});

exports.addTaskToChecklist = catchAsync(async (req, res, next) => {
  const { title, category, deadline, notes } = req.body;
  if (!title) return next(new AppError('Task title is required', 400));

  const checklist = await Checklist.findOneAndUpdate(
    { user: req.user._id },
    { $push: { tasks: { title, category, deadline, notes } } },
    { new: true, upsert: true }
  );

  res.status(201).json({ status: 'success', data: { checklist } });
});

exports.deleteTaskFromChecklist = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const checklist = await Checklist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { tasks: { _id: taskId } } },
    { new: true }
  );

  if (!checklist) return next(new AppError('Task not found', 404));
  res.status(200).json({ status: 'success', data: { checklist } });
});

// ==================== BLOG ====================
exports.getBlogs = catchAsync(async (req, res, next) => {
  const blogs = await Blog.find({ isPublished: true })
    .populate('author', 'name email avatar')
    .sort('-createdAt');
  res.status(200).json({ status: 'success', data: { blogs } });
});

exports.getBlogBySlug = catchAsync(async (req, res, next) => {
  const blog = await Blog.findOne({ slug: req.params.slug })
    .populate('author', 'name email avatar');

  if (!blog) return next(new AppError('Blog not found', 404));

  // Increment views
  blog.views += 1;
  await blog.save({ validateBeforeSave: false });

  // Get related blogs
  const related = await Blog.find({
    category: blog.category,
    _id: { $ne: blog._id },
    isPublished: true
  }).limit(3).select('title slug coverImage category createdAt');

  res.status(200).json({ status: 'success', data: { blog, related } });
});

// ==================== TESTIMONIALS ====================
exports.getTestimonials = catchAsync(async (req, res, next) => {
  try {
    let testimonials = await Testimonial.find({ isFeatured: true }).limit(6);
    if (!testimonials) testimonials = [];

    res.status(200).json({
      success: true,
      data: testimonials
    });
  } catch (error) {
    // Return empty array instead of 500
    res.status(200).json({
      success: true,
      data: []
    });
  }
});

// ==================== HOME STATS ====================
exports.getHomeStats = catchAsync(async (req, res, next) => {
  try {
    const statsDoc = await HomeStats.findOne();

    const stats = {
      vendors: statsDoc ? parseInt(statsDoc.vendors) || 0 : 0,
      bookings: statsDoc ? parseInt(statsDoc.bookings) || 0 : 0,
      cities: statsDoc ? parseInt(statsDoc.cities) || 0 : 0,
      rating: statsDoc ? parseFloat(statsDoc.rating) || 0 : 0
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    // Fail safe fallback
    res.status(200).json({
      success: true,
      data: { vendors: 0, bookings: 0, cities: 0, rating: 0 }
    });
  }
});

// ==================== CONTACT INFO ====================
exports.getContactInfo = catchAsync(async (req, res, next) => {
  try {
    // In a real app, this might come from a Settings model
    const contact = {
      email: "n4narendrakr@gmail.com",
      phone: "+91 7903075243",
      address: "Darbhanga, Bihar, India",
      company: "ShaadiSaathi",
      socialLinks: {
        instagram: "https://www.instagram.com/_shaadisaathi/",
        facebook: "https://facebook.com/shaadisaathi",
        youtube: "https://youtube.com/shaadisaathi",
        twitter: "https://twitter.com/shaadisaathi"
      }
    };

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      data: {
        email: "n4narendrakr@gmail.com",
        phone: "+91 7903075243",
        address: "Darbhanga, Bihar, India"
      }
    });
  }
});

const { sendEmail } = require('../services/emailService');

exports.submitContact = catchAsync(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return next(new AppError('Please provide all required fields', 400));
  }

  // Send email to admin
  try {
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `📞 New Contact Inquiry: ${subject}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #c2185b;">New Contact Inquiry</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `
    });

    // Send confirmation to user
    await sendEmail({
      to: email,
      subject: '🌸 We received your message - ShaadiSaathi',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #c2185b;">Hi ${name},</h2>
          <p>Thank you for reaching out to ShaadiSaathi. We have received your message regarding "<strong>${subject}</strong>".</p>
          <p>Our team will review your inquiry and get back to you within 24-48 hours.</p>
          <br />
          <p>Best Regards,</p>
          <p><strong>ShaadiSaathi Support Team</strong></p>
        </div>
      `
    });
  } catch (err) {
    console.error('Email failed:', err);
  }

  res.status(200).json({
    status: 'success',
    message: 'Your message has been sent successfully. We will get back to you soon.'
  });
});

// ==================== FILE UPLOAD ====================
exports.uploadFile = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please provide a file', 400));

  // Check if we have path (multer-storage-cloudinary or disk) or buffer
  let result;
  if (req.file.path) {
    result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'shaadisaathi/uploads'
    });
  } else if (req.file.buffer) {
    result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
      folder: 'shaadisaathi/uploads'
    });
  } else {
    return next(new AppError('File format not supported for upload', 400));
  }

  res.status(200).json({
    status: 'success',
    url: result.secure_url,
    publicId: result.public_id
  });
});

// @desc    Get system configuration (Public)
// @route   GET /api/features/config
// @access  Public
exports.getSystemConfig = catchAsync(async (req, res, next) => {
  const { SystemConfig } = require('../models/index');
  let config = await SystemConfig.findOne();
  if (!config) {
    config = await SystemConfig.create({});
  }
  res.status(200).json({
    status: 'success',
    data: config
  });
});
