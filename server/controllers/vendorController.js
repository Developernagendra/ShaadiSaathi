const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const { Notification, Booking, Review } = require('../models/index');
const { deleteFromCloudinary } = require('../config/cloudinary');
const { sendEmail, emailTemplates } = require('../config/email');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// @desc    Create vendor profile
// @route   POST /api/vendors
// @access  Private (vendor role)
const createVendorProfile = catchAsync(async (req, res, next) => {
  let vendor = await Vendor.findOne({ user: req.user._id });
  const vendorData = { ...req.body, user: req.user._id, profileCompletion: 100 };

  if (vendor) {
    if (vendor.profileCompletion > 0) {
      return next(new AppError('Vendor profile already exists.', 400));
    }
    // Update the atomic empty profile created during registration
    Object.assign(vendor, vendorData);
    await vendor.save();
  } else {
    vendor = await Vendor.create(vendorData);
  }

  // Update user role to vendor just in case
  await User.findByIdAndUpdate(req.user._id, { role: 'vendor' });

  // Trigger Real-time notifications for Vendor and Admin
  try {
    const { sendNotification } = require('../services/notificationService');

    // 1. Notify the Vendor themselves
    await sendNotification({
      recipient: req.user._id,
      sender: req.user._id,
      type: 'vendor_approval',
      title: 'Registration Submitted',
      message: `Your vendor profile for ${vendor.businessName} has been submitted successfully and is pending approval.`,
      link: '/vendor/dashboard',
      data: { vendorId: vendor._id }
    });

    // 2. Notify all Admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await sendNotification({
        recipient: admin._id,
        sender: req.user._id,
        type: 'vendor_approval',
        title: 'New Vendor Registration',
        message: `New vendor ${vendor.businessName} has registered and is awaiting approval.`,
        link: '/admin/vendors',
        data: { vendorId: vendor._id }
      });
    }
  } catch (err) {
    console.error('Vendor registration notification failed:', err);
  }

  res.status(201).json({
    status: 'success',
    message: 'Vendor profile created. Awaiting admin approval.',
    vendor
  });
});

const getMyVendorProfile = catchAsync(async (req, res, next) => {
  const { vendorId } = req.query;
  
  console.log('FETCHING VENDOR PROFILE');

  let query;
  if (req.user.role === 'admin' && vendorId) {
    query = { _id: vendorId };
  } else {
    query = { user: req.user._id };
  }

  let vendor = await Vendor.findOne(query)
    .populate('category', 'name slug icon')
    .populate('user', 'name email phone avatar isVerified')
    .lean();

  if (!vendor && req.user.role === 'vendor' && !vendorId) {
    console.log('VENDOR PROFILE NOT FOUND IN getMyVendorProfile - AUTO-CREATING FAIL-SAFE PROFILE');
    const newProfile = await Vendor.create({
      user: req.user._id,
      businessName: `${req.user.name}'s Business (Pending)`,
      email: req.user.email,
      phone: req.user.phone || '0000000000',
      approvalStatus: 'pending',
      profileCompletion: 0,
    });
    
    // Import User model explicitly if needed
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { vendorProfile: newProfile._id });

    vendor = await Vendor.findById(newProfile._id)
      .populate('category', 'name slug icon')
      .populate('user', 'name email phone avatar isVerified')
      .lean();
  }

  if (!vendor) {
    return res.status(200).json({
      status: 'success',
      vendor: null
    });
  }

  console.log('VENDOR PROFILE FOUND');

  res.status(200).json({
    status: 'success',
    vendor
  });
});

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
// @access  Private (vendor)
const updateVendorProfile = catchAsync(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) return next(new AppError('Vendor profile not found.', 404));

  const restricted = ['user', 'approvalStatus', 'totalBookings', 'totalEarnings', 'rating', 'approvedAt', 'approvedBy'];
  restricted.forEach((field) => delete req.body[field]);

  // Handle nested location if sent flat
  if (req.body.city !== undefined || req.body.address !== undefined || req.body.state !== undefined || req.body.pincode !== undefined) {
    if (!vendor.location) vendor.location = {};
    if (req.body.city !== undefined) vendor.location.city = req.body.city;
    if (req.body.address !== undefined) vendor.location.address = req.body.address;
    if (req.body.state !== undefined) vendor.location.state = req.body.state;
    if (req.body.pincode !== undefined) vendor.location.pincode = req.body.pincode;
    
    delete req.body.city;
    delete req.body.address;
    delete req.body.state;
    delete req.body.pincode;
  }

  // Handle social links if sent flat
  if (req.body.instagram !== undefined || req.body.facebook !== undefined || req.body.website !== undefined || req.body.youtube !== undefined) {
    if (!vendor.socialLinks) vendor.socialLinks = {};
    if (req.body.instagram !== undefined) vendor.socialLinks.instagram = req.body.instagram;
    if (req.body.facebook !== undefined) vendor.socialLinks.facebook = req.body.facebook;
    if (req.body.website !== undefined) vendor.socialLinks.website = req.body.website;
    if (req.body.youtube !== undefined) vendor.socialLinks.youtube = req.body.youtube;
    
    delete req.body.instagram;
    delete req.body.facebook;
    delete req.body.website;
    delete req.body.youtube;
  }

  // Validate packages and calculate starting price
  if (req.body.packages && Array.isArray(req.body.packages)) {
    let minPrice = Infinity;
    for (const pkg of req.body.packages) {
      if (!pkg.price || pkg.price <= 0) {
        return next(new AppError('Every package must have a valid price.', 400));
      }
      if (pkg.price < minPrice) minPrice = pkg.price;
    }
    if (minPrice !== Infinity) {
      req.body.startingPrice = minPrice;
      req.body.price = minPrice;
      // Also update vendor basePrice for consistency
      vendor.basePrice = minPrice;
    }
  }

  Object.assign(vendor, req.body);


  await vendor.save();

  // Populate necessary fields before returning to frontend
  await vendor.populate('category', 'name slug icon');
  await vendor.populate('user', 'name email avatar');

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully.',
    vendor
  });
});

// @desc    Upload vendor images
// @route   POST /api/vendors/images
// @access  Private (vendor)
const uploadVendorImages = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload at least one image.', 400));
  }

  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) return next(new AppError('Vendor profile not found.', 404));

  const newImages = req.files.map((file, index) => ({
    url: file.path,
    publicId: file.filename,
    isPrimary: vendor.images.length === 0 && index === 0,
  }));

  vendor.images.push(...newImages);
  await vendor.save();

  res.status(200).json({
    status: 'success',
    message: 'Images uploaded successfully.',
    images: vendor.images
  });
});

// @desc    Delete vendor image
// @route   DELETE /api/vendors/images/:imageId
// @access  Private (vendor)
const deleteVendorImage = catchAsync(async (req, res, next) => {
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) return next(new AppError('Vendor profile not found.', 404));

  const image = vendor.images.id(req.params.imageId);
  if (!image) return next(new AppError('Image not found.', 404));

  if (image.publicId) await deleteFromCloudinary(image.publicId);
  vendor.images.pull(req.params.imageId);
  await vendor.save();

  res.status(200).json({
    status: 'success',
    message: 'Image deleted successfully.'
  });
});

// @desc    Upload vendor cover image
// @route   POST /api/vendors/cover-image
// @access  Private (vendor)
const uploadVendorCoverImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image.', 400));
  }

  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) return next(new AppError('Vendor profile not found.', 404));

  // Delete old cover image if exists
  if (vendor.coverImage?.publicId) {
    await deleteFromCloudinary(vendor.coverImage.publicId);
  }

  vendor.coverImage = {
    url: req.file.path,
    publicId: req.file.filename,
  };
  await vendor.save();

  res.status(200).json({
    status: 'success',
    message: 'Cover image updated successfully.',
    coverImage: vendor.coverImage
  });
});

// @desc    Get all vendors with search & filters
// @route   GET /api/vendors
// @access  Public
const getAllVendors = catchAsync(async (req, res, next) => {
  const {
    page = 1, limit = 12, city, category, minPrice, maxPrice,
    rating, search, sortBy = 'createdAt', order = 'desc', featured,
    experience
  } = req.query;

  const query = { 
    approvalStatus: 'approved', 
    isActive: true 
  };

  if (city) query['location.city'] = { $regex: city, $options: 'i' };
  
  if (category) {
    const { Category } = require('../models/index');
    const mongoose = require('mongoose');
    
    // Check if valid ObjectId, else treat as slug
    if (mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    } else {
      const catObj = await Category.findOne({ slug: category.toLowerCase() });
      if (catObj) {
        query.category = catObj._id;
      } else {
        // Return no results if category slug not found
        return res.status(200).json({
          vendors: [],
          pagination: { total: 0, page: Number(page), pages: 0 }
        });
      }
    }
  }
  
  if (minPrice || maxPrice) {
    query.basePrice = {};
    if (minPrice) query.basePrice.$gte = Number(minPrice);
    if (maxPrice) query.basePrice.$lte = Number(maxPrice);
  }

  if (rating) query['rating.average'] = { $gte: Number(rating) };
  if (featured === 'true') query.isFeatured = true;

  if (experience) {
    if (experience === '1-3') query.yearsOfExperience = { $gte: 1, $lte: 3 };
    else if (experience === '3-5') query.yearsOfExperience = { $gte: 3, $lte: 5 };
    else if (experience === '5-10') query.yearsOfExperience = { $gte: 5, $lte: 10 };
    else if (experience === '10+') query.yearsOfExperience = { $gte: 10 };
  }

  if (search) {
    query.$text = { $search: search };
  }

  const sortOptions = {};
  if (sortBy === 'price') sortOptions.basePrice = order === 'asc' ? 1 : -1;
  else if (sortBy === 'rating') sortOptions['rating.average'] = -1;
  else if (sortBy === 'bookings') sortOptions.totalBookings = -1;
  else sortOptions[sortBy] = order === 'asc' ? 1 : -1;

  const total = await Vendor.countDocuments(query);
  const vendors = await Vendor.find(query)
    .populate('category', 'name slug icon')
    .populate('user', 'name avatar')
    .select('businessName tagline images coverImage basePrice location rating category isFeatured isTrending yearsOfExperience responseTime')
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();

  // Redact addresses on lists when contact protection is enabled
  const SystemConfig = mongoose.model('SystemConfig');
  const config = await SystemConfig.findOne();
  const showContactAfterBookingOnly = config ? config.showContactAfterBookingOnly : true;

  if (showContactAfterBookingOnly) {
    vendors.forEach(v => {
      if (v.location) {
        v.location.address = '';
        v.location.pincode = '';
      }
      v.phone = '';
      v.email = '';
    });
  }

  res.status(200).json({
    status: 'success',
    vendors,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit), limit: Number(limit) },
  });
});

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Public
const getVendorById = catchAsync(async (req, res, next) => {
  const vendor = await Vendor.findById(req.params.id)
    .populate('category', 'name slug icon')
    .populate('user', 'name email avatar')
    .select('-bankDetails -verificationDocuments -gstNumber')
    .lean();

  if (!vendor) {
    return next(new AppError('Vendor not found.', 404));
  }

  let isAuthorized = false;
  if (req.user) {
    if (req.user.role === 'admin') {
      isAuthorized = true;
    } else if (req.user._id.toString() === vendor.user?._id?.toString() || req.user._id.toString() === vendor.user?.toString()) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    if (vendor.approvalStatus !== 'approved' || vendor.isActive === false) {
      return next(new AppError('The profile you are looking for has been removed or is currently private.', 404));
    }
  }

  // Check contact protection configuration
  const SystemConfig = mongoose.model('SystemConfig');
  const Booking = mongoose.model('Booking');
  const Chat = mongoose.model('Chat');
  const Lead = mongoose.model('Lead');
  const Review = mongoose.model('Review');
  const config = await SystemConfig.findOne();
  const showContactAfterBookingOnly = config ? config.showContactAfterBookingOnly : true;

  let isUnlocked = true;

  if (showContactAfterBookingOnly) {
    isUnlocked = false;

    // Check if the user is authorized to bypass protection
    if (req.user) {
      const isSelf = req.user._id.toString() === vendor.user?._id?.toString() || 
                     req.user._id.toString() === vendor.user?.toString();
      
      if (req.user.role === 'admin' || isSelf) {
        isUnlocked = true;
      } else {
        const bookingCount = await Booking.countDocuments({
          user: req.user._id,
          vendorProfileId: vendor._id,
          status: { $in: ['confirmed', 'completed', 'pending', 'in_progress', 'on_the_way'] }
        });

        if (bookingCount > 0) {
          isUnlocked = true;
        }
      }
    }
  }

  // Redact contact info if not unlocked
  if (!isUnlocked) {
    vendor.phone = '';
    vendor.alternatePhone = '';
    vendor.email = '';
    if (vendor.location) {
      vendor.location.address = 'Available after Booking or Inquiry';
      vendor.location.pincode = '';
    }
    vendor.socialLinks = {
      instagram: '',
      facebook: '',
      youtube: '',
      website: ''
    };
    vendor.isContactLocked = true;
  } else {
    vendor.isContactLocked = false;
  }

  // --- DYNAMIC DATA ENHANCEMENTS ---
  
  // 1. Calculate dynamic completed bookings
  const completedBookings = await Booking.countDocuments({
    vendorId: vendor.user?._id || vendor.user,
    status: 'completed'
  });
  vendor.completedBookings = completedBookings;

  // 2. Calculate experience from createdAt if not set
  let exp = vendor.yearsOfExperience;
  if (!exp) {
    const startYear = new Date(vendor.createdAt || Date.now()).getFullYear();
    const currentYear = new Date().getFullYear();
    exp = currentYear - startYear;
    if (exp === 0) exp = 1; // Minimum 1 year
  }
  vendor.calculatedExperience = exp;

  // 3. Ensure Category Exists
  if (!vendor.category) {
    vendor.category = { name: 'Wedding Service', slug: 'wedding-service' };
  }

  // 4. Calculate Dynamic Rating from actual Review collection
  const reviews = await Review.find({ vendor: vendor._id }).select('rating');
  let totalRating = 0;
  reviews.forEach(r => { totalRating += r.rating; });
  const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
  
  vendor.dynamicRating = {
    average: parseFloat(avgRating),
    count: reviews.length
  };

  // 5. Set default response time
  if (!vendor.responseTime) {
    vendor.responseTime = 'Usually 1hr';
  }

  // ---------------------------------

  // Increment views in background
  Vendor.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).catch(e => console.error('View inc error:', e));

  res.status(200).json({
    status: 'success',
    vendor
  });
});

// @desc    Approve/Reject vendor (Admin)
// @route   PATCH /api/vendors/:id/approval
// @access  Admin
const updateVendorApproval = catchAsync(async (req, res, next) => {
  const { status, note } = req.body;

  if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) {
    return next(new AppError('Invalid approval status provided.', 400));
  }

  const vendor = await Vendor.findById(req.params.id).populate('user', 'name email');
  if (!vendor) return next(new AppError('Vendor profile not found.', 404));

  // Sync approval status
  vendor.approvalStatus = status;
  vendor.approvalNote = note || vendor.approvalNote;
  
  if (status === 'approved') {
    vendor.approvedAt = Date.now();
    vendor.approvedBy = req.user._id;
    // CRITICAL: Update user role to vendor upon approval
    const User = require('../models/User');
    await User.findByIdAndUpdate(vendor.user._id, { role: 'vendor' });
  } else if (status === 'suspended' || status === 'rejected') {
    // Optional: Downgrade role if suspended? Usually we keep it as vendor but block access via middleware
  }

  await vendor.save();

  // Send email notification (Fail-safe)
  try {
    if (emailTemplates && emailTemplates.vendorApproval) {
      const template = emailTemplates.vendorApproval(vendor.user.name, status);
      await sendEmail({ to: vendor.user.email, ...template });
    }
  } catch (err) {
    console.error('Email notification failed during vendor approval:', err);
  }

  // Create system notification
  try {
    const { sendNotification } = require('../services/notificationService');
    await sendNotification({
      recipient: vendor.user._id,
      sender: req.user._id,
      type: 'vendor_approval',
      title: status === 'approved' ? 'Partner Account Approved! 🎉' : 'Vendor Status Update',
      message: status === 'approved'
        ? 'Congratulations! Your vendor profile has been approved. You can now start adding services and receiving bookings.'
        : `Your vendor account status has been updated to ${status}. ${note ? 'Reason: ' + note : ''}`,
      link: '/vendor/dashboard',
      data: { vendorId: vendor._id }
    });
  } catch (err) {
    console.error('Vendor approval notification failed:', err);
  }

  res.status(200).json({
    status: 'success',
    message: `Vendor account ${status} successfully.`,
    data: { vendor }
  });
});

// @desc    Get vendor dashboard stats
// @route   GET /api/vendors/dashboard
// @access  Private (vendor)
const getVendorDashboard = catchAsync(async (req, res, next) => {
  const { vendorId } = req.query;
  
  const mongoose = require('mongoose');
  let queryVendor;
  
  if (req.user.role === 'admin' && vendorId && vendorId !== 'null' && vendorId !== 'undefined') {
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return next(new AppError('Invalid Vendor ID format', 400));
    }
    queryVendor = await Vendor.findById(vendorId).lean();
  } else {
    queryVendor = await Vendor.findOne({ user: req.user._id }).lean();
  }

  if (!queryVendor && req.user.role === 'vendor' && (!vendorId || vendorId === 'null')) {
    console.log('VENDOR PROFILE NOT FOUND IN getVendorDashboard - AUTO-CREATING FAIL-SAFE PROFILE');
    queryVendor = await Vendor.create({
      user: req.user._id,
      businessName: `${req.user.name}'s Business (Pending)`,
      email: req.user.email,
      phone: req.user.phone || '0000000000',
      approvalStatus: 'pending',
      profileCompletion: 0,
    });
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { vendorProfile: queryVendor._id });

    queryVendor = await Vendor.findById(queryVendor._id).lean();
  }

  if (!queryVendor) {
    return res.status(200).json({
      status: 'success',
      message: 'No vendor profile associated with this account.',
      vendor: null,
      stats: { totalBookings: 0, totalEarnings: 0, pendingBookings: 0, confirmedBookings: 0, completedBookings: 0, cancelledBookings: 0, totalCabs: 0 }
    });
  }

  const vendor = queryVendor;

  console.time('vendorDashboard-AggregateQuery');
  const [
    bookingStats, recentBookings, recentReviews, monthlyBookings,
    cabStats, recentCabBookings, monthlyCabBookings, totalCabs,
    paymentStats
  ] = await Promise.all([
    // 1. Service Stats
    Booking.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendor.user._id || vendor.user), bookingType: 'service' } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$amount' },
        },
      },
    ]),
    Booking.find({ vendorId: vendor.user, bookingType: 'service' })
      .select('bookingId userId contactName eventDate status amount createdAt bookingType')
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Review.find({ vendor: vendor._id })
      .select('user rating comment createdAt')
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Booking.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendor.user._id || vendor.user), status: 'completed', bookingType: 'service' } },
      {
        $group: {
          _id: {
            year: { $year: '$eventDate' },
            month: { $month: '$eventDate' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]),
    // 2. Cab Stats
    Booking.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendor.user._id || vendor.user), bookingType: { $in: ['cab', 'baraat-cab'] } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$amount' },
        },
      },
    ]),
    Booking.find({ vendorId: vendor.user, bookingType: { $in: ['cab', 'baraat-cab'] } })
      .select('bookingId userId contactName eventDate status amount createdAt bookingType vehicles pickupLocation cabIds')
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Booking.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendor.user._id || vendor.user), status: 'completed', bookingType: { $in: ['cab', 'baraat-cab'] } } },
      {
        $group: {
          _id: {
            year: { $year: '$eventDate' },
            month: { $month: '$eventDate' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]),
    require('../models/index').Cab.countDocuments({ vendor: vendor._id }),
    // 3. Payment Stats
    Booking.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendor.user._id || vendor.user) } },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $in: ['$paymentStatus', ['paid', 'fully_paid']] },
                '$totalPrice',
                '$advanceAmount'
              ]
            }
          }
        }
      }
    ])
  ]);
  console.timeEnd('vendorDashboard-AggregateQuery');

  const totalCount = bookingStats.reduce((acc, curr) => acc + curr.count, 0) + cabStats.reduce((acc, curr) => acc + curr.count, 0);
  
  const totalEarnings = (bookingStats.find(s => s._id === 'completed')?.revenue || 0) + (cabStats.find(s => s._id === 'completed')?.revenue || 0);

  const paidCount = paymentStats.find(p => ['paid', 'fully_paid'].includes(p._id))?.count || 0;
  const paidEarnings = paymentStats.find(p => ['paid', 'fully_paid'].includes(p._id))?.revenue || 0;
  const pendingCount = paymentStats.find(p => ['pending', 'failed', 'unpaid'].includes(p._id))?.count || 0;
  const pendingEarnings = paymentStats.find(p => ['pending', 'failed', 'unpaid'].includes(p._id))?.revenue || 0;
  const partialPaidCount = paymentStats.find(p => ['partial_paid', 'advance_paid'].includes(p._id))?.count || 0;
  const partialPaidEarnings = paymentStats.find(p => ['partial_paid', 'advance_paid'].includes(p._id))?.revenue || 0;
  
  const stats = {
    totalBookings: totalCount,
    totalEarnings: totalEarnings || vendor.totalEarnings || 0,
    rating: vendor.rating,
    views: vendor.views,
    enquiries: vendor.enquiries,
    pendingBookings: (bookingStats.find(s => s._id === 'pending')?.count || 0) + (cabStats.find(s => s._id === 'pending')?.count || 0),
    confirmedBookings: (bookingStats.find(s => s._id === 'confirmed')?.count || 0) + (cabStats.find(s => s._id === 'confirmed')?.count || 0),
    completedBookings: (bookingStats.find(s => s._id === 'completed')?.count || 0) + (cabStats.find(s => s._id === 'completed')?.count || 0),
    cancelledBookings: (bookingStats.find(s => ['cancelled', 'rejected'].includes(s._id))?.count || 0) + (cabStats.find(s => ['cancelled', 'rejected'].includes(s._id))?.count || 0),
    totalCabs: totalCabs || 0,
    paymentStats: {
      paid: { count: paidCount, earnings: paidEarnings },
      pending: { count: pendingCount, earnings: pendingEarnings },
      partialPaid: { count: partialPaidCount, earnings: partialPaidEarnings }
    }
  };

  res.status(200).json({
    status: 'success',
    vendor,
    stats,
    bookingStats,
    cabStats,
    recentBookings,
    recentCabBookings,
    recentReviews,
    monthlyBookings,
    monthlyCabBookings
  });
});

// @desc    Manage availability calendar
// @route   POST /api/vendors/availability
// @access  Private (vendor)
const updateAvailability = catchAsync(async (req, res, next) => {
  const { dates, action } = req.body; // action: 'block' or 'unblock'
  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) return next(new AppError('Vendor not found.', 404));

  if (action === 'block') {
    const newDates = dates.map((d) => ({ date: new Date(d), isBooked: true }));
    vendor.availability.push(...newDates);
  } else {
    vendor.availability = vendor.availability.filter(
      (a) => !dates.includes(a.date.toISOString().split('T')[0])
    );
  }

  await vendor.save();
  res.status(200).json({
    status: 'success',
    message: 'Availability updated.',
    availability: vendor.availability
  });
});

// @desc    Get featured vendors
// @route   GET /api/vendors/featured
// @access  Public
const getFeaturedVendors = catchAsync(async (req, res, next) => {

  let vendors = await Vendor.find({
    isFeatured: true,
    approvalStatus: 'approved',
    isActive: true
  })
  .populate('category', 'name slug icon')
  .populate('user', 'name avatar')
  .select('businessName tagline images coverImage basePrice location rating category isFeatured isTrending yearsOfExperience responseTime')
  .lean();

  console.log(`[DEBUG] Fetched ${vendors ? vendors.length : 0} explicitly featured vendors.`);

  // FALLBACK LOGIC: If no featured vendors exist, fallback to displaying approved and active vendors
  if (!vendors || vendors.length === 0) {
    console.log('[DEBUG] No explicitly featured vendors found. Falling back to active and approved vendors.');
    vendors = await Vendor.find({
      approvalStatus: 'approved',
      isActive: true
    })
    .populate('category', 'name slug icon')
    .populate('user', 'name avatar')
    .select('businessName tagline images coverImage basePrice location rating category isFeatured isTrending yearsOfExperience responseTime')
    .limit(8)
    .lean();
    console.log(`[DEBUG] Fallback fetch complete. Loaded ${vendors ? vendors.length : 0} approved vendors.`);
  }

  // Redact addresses on lists when contact protection is enabled
  const SystemConfig = mongoose.model('SystemConfig');
  const config = await SystemConfig.findOne();
  const showContactAfterBookingOnly = config ? config.showContactAfterBookingOnly : true;

  if (showContactAfterBookingOnly) {
    vendors.forEach(v => {
      if (v.location) {
        v.location.address = '';
        v.location.pincode = '';
      }
      v.phone = '';
      v.email = '';
    });
  }

  res.status(200).json({
    success: true,
    status: 'success',
    vendors
  });
});

const activateSubscription = catchAsync(async (req, res, next) => {
  const { planName } = req.body;
  if (!planName || !['free', 'silver', 'gold', 'platinum'].includes(planName.toLowerCase())) {
    return next(new AppError('Invalid subscription plan name', 400));
  }

  const vendor = await Vendor.findOne({ user: req.user._id });
  if (!vendor) return next(new AppError('Vendor profile not found.', 404));

  vendor.subscription = {
    plan: planName.toLowerCase(),
    startDate: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    isActive: true,
    paymentId: 'free_marketplace_activation',
    autoRenew: true
  };

  await vendor.save();

  res.status(200).json({
    status: 'success',
    message: `Plan ${planName} activated successfully.`,
    vendor
  });
});

module.exports = {
  createVendorProfile, getMyVendorProfile, updateVendorProfile,
  uploadVendorImages, deleteVendorImage, uploadVendorCoverImage, getAllVendors, getVendorById,
  updateVendorApproval, getVendorDashboard, updateAvailability, getFeaturedVendors,
  activateSubscription,
};
