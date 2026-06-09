const mongoose = require('mongoose');
const { Booking, Notification, Availability, Cab } = require('../models/index');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../config/email');
const { sendBookingNotification, sendNotification } = require('../services/notificationService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = catchAsync(async (req, res, next) => {
  const {
    vendorId, serviceId, packageSelected, eventDate, eventTime, eventVenue,
    eventCity, guestCount, specialRequirements, contactName, contactPhone, contactEmail, amount,
    selectedSlot, selectedSlotId
  } = req.body;

  let derivedVendorId = vendorId;
  if (serviceId) {
    const { Service } = require('../models/index');
    const service = await Service.findById(serviceId);
    if (!service) {
      return next(new AppError('Service not found.', 404));
    }
    if (service.status !== 'approved' && process.env.NODE_ENV !== 'development') {
      return next(new AppError('This service is not available for booking yet.', 400));
    }
    // Auto-assign vendorId from service to ensure correct routing
    derivedVendorId = service.vendor;
  }

  if (!derivedVendorId) {
    return next(new AppError('No vendor associated with this booking.', 400));
  }

  const vendor = await Vendor.findById(derivedVendorId);
  if (!vendor || vendor.approvalStatus !== 'approved') {
    return next(new AppError('Vendor not found or not available.', 404));
  }

  // DEBUG LOG AS REQUESTED
  console.log(`[BOOKING_DEBUG] Saving VendorId: ${vendor.user} (Matches User: ${vendor.user.toString() === req.user._id.toString()})`);
  console.log(`[BOOKING_DEBUG] Current UserID: ${req.user._id}`);

  // --- START ATOMIC AVAILABILITY CHECK ---
  const formattedDate = new Date(eventDate);
  formattedDate.setHours(0, 0, 0, 0);

  let availabilityQuery = {
    vendorId: derivedVendorId,
    date: formattedDate,
    isBlocked: false,
    status: { $ne: 'booked' }
  };

  let updateQuery = {};

  if (selectedSlotId) {
    availabilityQuery['slots._id'] = selectedSlotId;
    availabilityQuery['slots.status'] = { $ne: 'booked' };

    updateQuery = {
      $inc: { 'slots.$.bookedCount': 1, bookedCount: 1 },
      $set: { updatedAt: Date.now() }
    };
  } else {
    updateQuery = {
      $inc: { bookedCount: 1 },
      $set: { updatedAt: Date.now() }
    };
    // If maxBookings is defined, ensure we don't exceed it
    availabilityQuery['$expr'] = {
      $or: [
        { $eq: ["$maxBookings", 0] },
        { $lt: ["$bookedCount", "$maxBookings"] }
      ]
    };
  }

  const updatedAvailability = await Availability.findOneAndUpdate(
    availabilityQuery,
    updateQuery,
    { new: true }
  );

  // If no record found, it might be fully booked, blocked, or not initialized
  // But wait, if not initialized, we should probably allow booking if it's a "simple" vendor
  // However, the current logic assumes Availability record MUST exist or it skips the check.
  // Let's refine: if availability record EXISTS, it MUST satisfy the conditions.

  const existingRecord = await Availability.findOne({ vendorId: derivedVendorId, date: formattedDate });
  if (existingRecord) {
    if (!updatedAvailability) {
      if (existingRecord.isBlocked) return next(new AppError('This date is blocked by the vendor.', 400));
      return next(new AppError('This date or slot is no longer available.', 400));
    }

    // Final check for overall status update (non-atomic but safe-ish for status strings)
    if (updatedAvailability.maxBookings > 0 && updatedAvailability.bookedCount >= updatedAvailability.maxBookings) {
      updatedAvailability.status = 'booked';
    } else {
      updatedAvailability.status = 'partially_booked';
    }

    if (selectedSlotId) {
      const slot = updatedAvailability.slots.id(selectedSlotId);
      if (slot.bookedCount >= slot.maxBookings) slot.status = 'booked';
      else slot.status = 'partially_booked';
    }
    await updatedAvailability.save();
  }
  // --- END ATOMIC AVAILABILITY CHECK ---

  const bookingId = `SS-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  // Determine final price and populate service metadata
  let finalPrice = amount;
  let serviceName = '';
  let serviceCategory = '';

  if (serviceId) {
    const { Service } = require('../models/index');
    const service = await Service.findById(serviceId).populate('category');
    if (service) {
      if (packageSelected && packageSelected.price) {
        finalPrice = packageSelected.price;
      } else {
        finalPrice = service.price || service.startingPrice || 0;
      }
      serviceName =
        service.title ||
        service.name ||
        service.businessName ||
        (service.category && (service.category.name || service.category)) ||
        'Wedding Service';
      serviceCategory = service.category ? (service.category.name || service.category.toString()) : '';
    }
  }

  // Ensure serviceName is populated dynamically if not set
  if (!serviceName && vendor) {
    serviceName = vendor.businessName || 'Wedding Service';
    serviceCategory = vendor.category ? (vendor.category.name || vendor.category.toString()) : 'Wedding Service';
  }

  const parsedPrice = Number(finalPrice);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return next(new AppError('Invalid service price. Price must be a positive number.', 400));
  }

  const booking = await Booking.create({
    bookingId,
    userId: req.user._id,
    user: req.user._id,
    vendorId: vendor.user, // Store the vendor's User ID for direct matching
    vendor: vendor.user,
    vendorProfileId: derivedVendorId,
    bookingType: 'service',
    service: serviceId,
    serviceName,
    serviceCategory,
    packageSelected,
    eventDate,
    eventTime,
    eventVenue,
    eventCity,
    guestCount,
    specialRequirements,
    contactName,
    contactPhone,
    contactEmail,
    amount: parsedPrice,
    totalPrice: parsedPrice,
    selectedSlot,
    selectedSlotId,
    status: 'pending',
    timeline: [{ status: 'pending', note: 'Booking request submitted. Awaiting vendor confirmation.' }],
  });

  // DEBUG LOGS AS REQUESTED
  console.log('BOOKING CREATED:', booking);
  console.log('VENDOR ID:', booking.vendor);


  // Update vendor enquiries
  await Vendor.findByIdAndUpdate(derivedVendorId, { $inc: { enquiries: 1 } });

  // 1. Notify Vendor
  await sendNotification({
    recipient: vendor.user,
    sender: req.user._id,
    type: 'booking',
    title: 'New Booking Request',
    message: `New booking request from ${req.user.name}`,
    link: '/vendor/dashboard/customer-bookings',
    data: { bookingId: booking._id }
  });

  // 2. Notify all Admins
  const admins = await User.find({ role: 'admin' });
  for (const admin of admins) {
    await sendNotification({
      recipient: admin._id,
      sender: req.user._id,
      type: 'booking',
      title: 'New Booking Created',
      message: `New booking created for ${serviceName || 'Wedding Service'}`,
      link: `/admin/bookings`,
      data: { bookingId: booking._id }
    });
  }

  // Socket notification room emits (for other handlers/pages)
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${req.user._id}`).emit('booking_updated', { booking });
    io.to(`user_${vendor.user}`).emit('new_booking', { booking });
    io.to(vendor.user.toString()).emit('newBooking', booking);
    io.to('admin').emit('new_booking_admin', { booking });
    io.to('admin').emit('booking_updated', { booking });
  }

  // Send confirmation email
  console.log(`[EMAIL] 📨 BOOKING EMAIL FLOW STARTED for booking: ${booking._id}`);
  try {
    const bookingWithDetails = await Booking.findById(booking._id)
      .populate('service')
      .populate('vendor')
      .populate('cab')
      .populate('cabIds')
      .populate('vendorProfileId');

    let bookedServiceName = bookingWithDetails.serviceName || 'Wedding Service';

    if (!bookingWithDetails.serviceName) {
      if ((bookingWithDetails.bookingType === 'cab' || bookingWithDetails.bookingType === 'baraat-cab') && (bookingWithDetails.cab || (bookingWithDetails.cabIds && bookingWithDetails.cabIds[0]))) {
        const cabObj = bookingWithDetails.cab || bookingWithDetails.cabIds[0];
        bookedServiceName =
          cabObj.brand ||
          cabObj.model ||
          cabObj.vehicleName ||
          cabObj.name ||
          'Baraat Cab';
      } else if (bookingWithDetails.bookingType === 'service' && bookingWithDetails.service) {
        bookedServiceName =
          bookingWithDetails.service.title ||
          bookingWithDetails.service.name ||
          (bookingWithDetails.service.category && (bookingWithDetails.service.category.name || bookingWithDetails.service.category)) ||
          'Wedding Service';
      } else if (bookingWithDetails.vendorProfileId) {
        bookedServiceName = bookingWithDetails.vendorProfileId.businessName || 'Wedding Service';
      }
    }

    // 1. Send User Confirmation Email
    console.log(`[EMAIL] Sending booking confirmation to user: ${req.user.email}`);
    const template = emailTemplates.bookingConfirmation(req.user.name, {
      bookingId: bookingWithDetails.bookingId,
      serviceName: bookedServiceName,
      date: new Date(eventDate).toLocaleDateString('en-IN'),
      amount,
    });
    await sendEmail({ to: req.user.email, ...template });

    // 2. Send Vendor Alert Email (if vendor email exists)
    if (vendor && vendor.email) {
      try {
        console.log(`[EMAIL] Sending booking alert to vendor: ${vendor.email}`);
        const vendorTemplate = emailTemplates.vendorBookingAlert(
          vendor.businessName || 'Vendor Partner',
          req.user.name,
          {
            bookingId: bookingWithDetails.bookingId,
            serviceName: bookedServiceName,
            date: new Date(eventDate).toLocaleDateString('en-IN'),
            amount,
          }
        );
        await sendEmail({ to: vendor.email, ...vendorTemplate });
      } catch (err) {
        console.error('[EMAIL] ❌ Failed to send vendor booking alert email:', err.message);
      }
    } else {
      console.warn('[EMAIL] ⚠️ Vendor has no email address — skipping vendor alert email');
    }

    // 3. Send Admin Alert Email (to all admin users)
    try {
      const adminsList = await User.find({ role: 'admin' }).lean();
      for (const adm of adminsList) {
        if (adm.email) {
          console.log(`[EMAIL] Sending booking alert to admin: ${adm.email}`);
          const adminTemplate = emailTemplates.adminBookingAlert(
            adm.name || 'Administrator',
            req.user.name,
            vendor ? vendor.businessName : 'Wedding Service Vendor',
            {
              bookingId: bookingWithDetails.bookingId,
              serviceName: bookedServiceName,
              date: new Date(eventDate).toLocaleDateString('en-IN'),
              amount,
            }
          );
          await sendEmail({ to: adm.email, ...adminTemplate });
        }
      }
    } catch (err) {
      console.error('[EMAIL] ❌ Failed to send admin booking alert email:', err.message);
    }

    console.log('[EMAIL] ✅ ALL BOOKING EMAILS DISPATCHED SUCCESSFULLY');
  } catch (error) {
    console.error('[EMAIL] ❌ BOOKING EMAIL FLOW FAILED:', error.message);
  }

  const populatedBooking = await Booking.findById(booking._id)
    .populate('vendorProfileId', 'businessName phone email location images')
    .populate('userId', 'name email phone');

  res.status(201).json({
    status: 'success',
    message: 'Booking created successfully!',
    booking: populatedBooking
  });
});

// @desc    Create cab booking
// @route   POST /api/cab-booking
// @access  Private
exports.createCabBooking = catchAsync(async (req, res, next) => {
  let {
    fleetSelection, selectedVehicles, cabId, packageId, city, pickupLocation, dropLocation, eventDate, contactName, contactPhone, message, guestCount, packageType, totalAmount, specialRequests, subtotal, gst, advance, activeBundleId
  } = req.body;

  // Map selectedVehicles to fleetSelection format for CustomBundleBuilderPage
  if (!fleetSelection && selectedVehicles && Array.isArray(selectedVehicles)) {
    fleetSelection = selectedVehicles.map(v => ({
      cabId: v.vehicleId,
      count: Number(v.quantity || 1),
      pricePerVehicle: v.pricePerVehicle,
      totalFare: v.totalFare
    }));
  }

  // Resolve input aliases for payload compatibility
  const name = contactName || req.body.customerName || (req.user && req.user.name);
  const phone = contactPhone || req.body.customerPhone || (req.user && req.user.phone) || '0000000000';
  const email = req.body.contactEmail || req.body.customerEmail || (req.user && req.user.email);
  const remarks = message || specialRequests || req.body.specialRequirements || '';
  const guests = Number(guestCount || req.body.guestCount) || 1;
  const dropLoc = dropLocation || req.body.dropLocation || 'Same as Pickup / Local Event';
  const pkgType = packageType || req.body.packageType || 'custom_fleet';

  if (!city) return next(new AppError('Please provide all required fields in bundle booking cab (Missing city/region)', 400));
  if (!pickupLocation) return next(new AppError('Please provide all required fields in bundle booking cab (Missing pickup location address)', 400));
  if (!eventDate) return next(new AppError('Please provide all required fields in bundle booking cab (Missing event date)', 400));
  if (!name) return next(new AppError('Please provide all required fields in bundle booking cab (Missing customer name)', 400));
  if (!phone) return next(new AppError('Please provide all required fields in bundle booking cab (Missing customer phone)', 400));

  let finalPrice = 0;
  let serviceName = 'Baraat Custom Fleet';
  let vendorsSet = new Set();
  let primaryVendorProfileId = null;
  let primaryVendorId = null;
  let processedFleet = [];

  // Track cabs to update inventory if booking is successful
  const inventoryUpdates = [];

  if (fleetSelection && Array.isArray(fleetSelection) && fleetSelection.length > 0) {
    for (const item of fleetSelection) {
      if (!item.cabId) continue;
      const cabDoc = await Cab.findById(item.cabId);
      if (!cabDoc) continue;

      const requestedQty = Number(item.count || 1);
      const maxFleetSize = Number(cabDoc.totalFleet || cabDoc.quantityAvailable || 1);

      // Date-Specific Conflict Detection Algorithm
      const queryDate = new Date(eventDate);
      const startOfDay = new Date(queryDate.setHours(0,0,0,0));
      const endOfDay = new Date(queryDate.setHours(23,59,59,999));

      const overlappingBookings = await Booking.find({
        eventDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['confirmed', 'in_progress', 'on_the_way'] },
        bookingType: { $in: ['cab', 'baraat-cab'] },
        $or: [
          { "fleetSelection.cabId": cabDoc._id },
          { "cabIds": cabDoc._id },
          { "cab": cabDoc._id }
        ]
      });

      let totalBooked = 0;
      for (const b of overlappingBookings) {
        if (b.fleetSelection && b.fleetSelection.length > 0) {
          const match = b.fleetSelection.find(f => f.cabId && f.cabId.toString() === cabDoc._id.toString());
          if (match) totalBooked += (match.count || 1);
        } else if (b.vehicles && b.vehicles.length > 0) {
          const idx = b.cabIds?.findIndex(id => id.toString() === cabDoc._id.toString());
          if (idx !== -1 && b.vehicles[idx]) {
            totalBooked += (b.vehicles[idx].count || 1);
          } else {
            totalBooked += 1;
          }
        } else {
          totalBooked += 1;
        }
      }

      const availableQty = maxFleetSize - totalBooked;

      // Validate Overbooking
      if (requestedQty > availableQty) {
        return next(new AppError(`Only ${availableQty} vehicles available for selected date.`, 400));
      }

      inventoryUpdates.push({
        cabDoc,
        newQty: availableQty - requestedQty,
        requestedQty
      });

      let vId = cabDoc.vendor;
      if (!vId) {
        const ownerVendor = await Vendor.findOne({ user: cabDoc.createdBy });
        if (ownerVendor) vId = ownerVendor._id;
      }
      
      if (vId) {
        const vData = await Vendor.findById(vId);
        if (vData) {
          vendorsSet.add(vData.user.toString());
          if (!primaryVendorProfileId) {
            primaryVendorProfileId = vData._id;
            primaryVendorId = vData.user;
          }
        }
      }

      const itemTotal = Number(item.totalFare) || (Number(item.pricePerVehicle || cabDoc.price) * requestedQty);
      finalPrice += itemTotal;

      processedFleet.push({
        cabId: cabDoc._id,
        vendorId: primaryVendorId,
        count: requestedQty,
        pricePerVehicle: Number(item.pricePerVehicle || cabDoc.price),
        totalFare: itemTotal,
        vehicleType: cabDoc.type,
        name: cabDoc.name || cabDoc.vehicleName
      });
    }
  } else if (cabId && cabId !== 'undefined' && cabId !== 'null') {
    // Fallback to individual
    const cab = await Cab.findById(cabId);
    if (!cab) return next(new AppError('Cab vehicle not found.', 404));

    const requestedQty = 1;
    const maxFleetSize = Number(cab.totalFleet || cab.quantityAvailable || 1);

    const queryDate = new Date(eventDate);
    const startOfDay = new Date(queryDate.setHours(0,0,0,0));
    const endOfDay = new Date(queryDate.setHours(23,59,59,999));

    const overlappingBookings = await Booking.find({
      eventDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'in_progress', 'on_the_way'] },
      bookingType: { $in: ['cab', 'baraat-cab'] },
      $or: [
        { "fleetSelection.cabId": cab._id },
        { "cabIds": cab._id },
        { "cab": cab._id }
      ]
    });

    let totalBooked = 0;
    for (const b of overlappingBookings) {
      if (b.fleetSelection && b.fleetSelection.length > 0) {
        const match = b.fleetSelection.find(f => f.cabId && f.cabId.toString() === cab._id.toString());
        if (match) totalBooked += (match.count || 1);
      } else if (b.vehicles && b.vehicles.length > 0) {
        const idx = b.cabIds?.findIndex(id => id.toString() === cab._id.toString());
        if (idx !== -1 && b.vehicles[idx]) {
          totalBooked += (b.vehicles[idx].count || 1);
        } else {
          totalBooked += 1;
        }
      } else {
        totalBooked += 1;
      }
    }

    const availableQty = maxFleetSize - totalBooked;

    // Validate Overbooking
    if (requestedQty > availableQty) {
      return next(new AppError(`Only ${availableQty} vehicles available for selected date.`, 400));
    }

    inventoryUpdates.push({
      cabDoc: cab,
      newQty: availableQty - requestedQty,
      requestedQty
    });

    let cabPrice = Number(cab.price || (cab.pricing && cab.pricing.baseFare));
    serviceName = cab.brand || cab.model || cab.vehicleName || cab.name || 'Baraat Cab';
    if (packageId && cab.packages) {
      const pkg = cab.packages.find(p => p._id.toString() === packageId.toString());
      if (pkg) {
        cabPrice = pkg.price;
        serviceName = pkg.name;
      }
    }
    finalPrice = cabPrice;
    
    let vId = cab.vendor;
    if (!vId) {
      const ownerVendor = await Vendor.findOne({ user: cab.createdBy });
      if (ownerVendor) vId = ownerVendor._id;
    }
    const vendorData = await Vendor.findById(vId);
    if (vendorData) {
      vendorsSet.add(vendorData.user.toString());
      primaryVendorProfileId = vendorData._id;
      primaryVendorId = vendorData.user;
    }

    processedFleet.push({
      cabId: cab._id,
      vendorId: primaryVendorId,
      count: requestedQty,
      pricePerVehicle: cabPrice,
      totalFare: cabPrice,
      vehicleType: cab.type,
      name: serviceName
    });
  } else {
    return next(new AppError('Please provide fleet selection or cab id.', 400));
  }

  if (!finalPrice && totalAmount) {
    finalPrice = Number(totalAmount);
  }

  if (!finalPrice || isNaN(finalPrice)) {
    return next(new AppError('Cab price missing or invalid. Please contact support.', 400));
  }

  // Date-based inventory is validated dynamically above using overlappingBookings.
  // We no longer deduct from cab.quantityAvailable to preserve max fleet size.

  const bookingId = `FLEET-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  // Sync vehicles array and cabIds for backward compatibility and UI rendering consistency
  const bookingVehicles = processedFleet.map(item => ({
    vehicleType: item.vehicleType,
    count: item.count,
    pricePerVehicle: item.pricePerVehicle,
    totalFare: item.totalFare
  }));
  const cabIdsArray = processedFleet.map(f => f.cabId);

  const cabBooking = await Booking.create({
    bookingId,
    userId: req.user._id,
    user: req.user._id,
    vendorId: primaryVendorId, // Primary backward compat
    vendor: primaryVendorId,
    vendorProfileId: primaryVendorProfileId,
    vendorIds: Array.from(vendorsSet), // NEW
    fleetSelection: processedFleet, // NEW
    vehicles: bookingVehicles, // Sync vehicles field
    cabIds: cabIdsArray, // Sync cabIds field
    bookingType: 'baraat-cab',
    packageType: pkgType,
    serviceName: serviceName,
    serviceCategory: 'Baraat Cab',
    eventDate,
    eventTime: "Not specified",
    contactName: name,
    contactPhone: phone,
    contactEmail: email,
    pickupLocation: {
      address: typeof pickupLocation === 'object' ? pickupLocation.address : pickupLocation,
      city: city,
    },
    dropLocation: dropLoc,
    guestCount: guests,
    message: remarks,
    specialRequests: remarks,
    totalPrice: finalPrice,
    amount: finalPrice, // Use total price as standard amount
    subtotal: subtotal || finalPrice,
    gst: gst || 0,
    totalAmount: totalAmount || finalPrice,
    advance: advance || 0,
    advanceAmount: advance || 0,
    status: 'confirmed',
    timeline: [{ status: 'confirmed', note: 'Cab booking confirmed.' }]
  });

  // DEBUG LOGS AS REQUESTED
  console.log('BOOKING CREATED:', cabBooking);
  console.log('VENDOR ID:', cabBooking.vendor);

  // Add explicit logs for selectedQuantity, availableQuantity, savedQuantity
  processedFleet.forEach((item, idx) => {
    const origUpdate = inventoryUpdates.find(u => u.cabDoc._id.toString() === item.cabId.toString());
    const availQty = origUpdate ? origUpdate.cabDoc.quantityAvailable : 'N/A';
    const savedQty = cabBooking.fleetSelection[idx]?.count || (cabBooking.vehicles && cabBooking.vehicles[idx]?.count) || 'N/A';
    console.log(`[Quantity Audit] Index: ${idx} | Vehicle: ${item.name} | selectedQuantity: ${item.count} | availableQuantity: ${availQty} | savedQuantity: ${savedQty}`);
  });





  // 1. Notify Vendors
  for (const vId of vendorsSet) {
    await sendNotification({
      recipient: vId,
      sender: req.user._id,
      type: 'booking',
      title: 'New Booking Request',
      message: `New booking request from ${req.user.name}`,
      link: '/vendor/dashboard/customer-bookings',
      data: { bookingId: cabBooking._id, type: 'cab' }
    });
  }

  // 2. Notify all Admins
  const admins = await User.find({ role: 'admin' });
  for (const admin of admins) {
    await sendNotification({
      recipient: admin._id,
      sender: req.user._id,
      type: 'booking',
      title: 'New Booking Created',
      message: `New booking created for ${serviceName || 'Baraat Cab'}`,
      link: '/admin/bookings',
      data: { bookingId: cabBooking._id, type: 'cab' }
    });
  }

  // Socket notification
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${req.user._id}`).emit('booking_updated', { booking: cabBooking });
    for (const vId of vendorsSet) {
      io.to(`user_${vId}`).emit('new_booking', { booking: cabBooking });
      io.to(vId.toString()).emit('newBooking', cabBooking);
    }
    io.to('admin').emit('new_booking_admin', { booking: cabBooking });
  }

  // Send confirmation email
  try {
    const bookingWithDetails = await Booking.findById(cabBooking._id)
      .populate('service')
      .populate('vendor')
      .populate('cab')
      .populate('cabIds')
      .populate('vendorProfileId');

    let bookedServiceName = bookingWithDetails.serviceName || 'Baraat Cab';

    if (!bookingWithDetails.serviceName) {
      if ((bookingWithDetails.bookingType === 'cab' || bookingWithDetails.bookingType === 'baraat-cab') && (bookingWithDetails.cab || (bookingWithDetails.cabIds && bookingWithDetails.cabIds[0]))) {
        const cabObj = bookingWithDetails.cab || bookingWithDetails.cabIds[0];
        bookedServiceName =
          cabObj.brand ||
          cabObj.model ||
          cabObj.vehicleName ||
          cabObj.name ||
          'Baraat Cab';
      }
    }

    // 1. Send User Confirmation Email
    const template = emailTemplates.bookingConfirmation(req.user.name, {
      bookingId: bookingWithDetails.bookingId,
      serviceName: bookedServiceName,
      date: new Date(eventDate).toLocaleDateString('en-IN'),
      amount: finalPrice,
    });
    await sendEmail({ to: req.user.email, ...template });

    // 2. Send Vendor Alert Email(s)
    for (const vId of vendorsSet) {
      try {
        const vUser = await User.findById(vId);
        if (vUser && vUser.email) {
          const vProfile = await Vendor.findOne({ user: vId });
          const vendorTemplate = emailTemplates.vendorBookingAlert(
            vProfile ? vProfile.businessName : 'Cab Vendor Partner',
            req.user.name,
            {
              bookingId: bookingWithDetails.bookingId,
              serviceName: bookedServiceName,
              date: new Date(eventDate).toLocaleDateString('en-IN'),
              amount: finalPrice,
            }
          );
          await sendEmail({ to: vUser.email, ...vendorTemplate });
        }
      } catch (err) {
        console.error("❌ Failed to send cab vendor booking alert email:", err.message);
      }
    }

    // 3. Send Admin Alert Email (to all admin users)
    try {
      const adminsList = await User.find({ role: 'admin' }).lean();
      for (const adm of adminsList) {
        if (adm.email) {
          const adminTemplate = emailTemplates.adminBookingAlert(
            adm.name || 'Administrator',
            req.user.name,
            'Cab Vendor Partner(s)',
            {
              bookingId: bookingWithDetails.bookingId,
              serviceName: bookedServiceName,
              date: new Date(eventDate).toLocaleDateString('en-IN'),
              amount: finalPrice,
            }
          );
          await sendEmail({ to: adm.email, ...adminTemplate });
        }
      }
    } catch (err) {
      console.error("❌ Failed to send admin booking alert email:", err.message);
    }
  } catch (error) {
    console.error('Email error:', error);
  }

  res.status(201).json({
    success: true,
    status: 'success',
    message: activeBundleId ? 'Bundle booking confirmed' : 'Cab booking created successfully!',
    booking: cabBooking
  });
});


// @desc    Get user bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getMyBookings = catchAsync(async (req, res, next) => {
  const { status, page = 1, limit = 10, userId, bookingType } = req.query;

  // Strict isolation: Users can only see their own. Admins can see anyone's if userId provided.
  let queryUser = req.user._id;
  if (req.user.role === 'admin' && userId) {
    queryUser = userId;
  }

  const query = { userId: queryUser };

  if (bookingType === 'service') {
    query.bookingType = 'service';
  } else if (bookingType === 'cab' || bookingType === 'baraat-cab') {
    query.bookingType = { $in: ['cab', 'baraat-cab'] };
  }

  if (status && status !== 'all') {
    if (status === 'cancelled') {
      query.status = { $in: ['cancelled', 'rejected'] };
    } else {
      query.status = status;
    }
  }

  const matchQuery = { userId: new mongoose.Types.ObjectId(queryUser) };
  if (bookingType === 'service') {
    matchQuery.bookingType = 'service';
  } else if (bookingType === 'cab' || bookingType === 'baraat-cab') {
    matchQuery.bookingType = { $in: ['cab', 'baraat-cab'] };
  }

  const [bookings, total, counts] = await Promise.all([
    Booking.find(query)
      .populate('vendorProfileId', 'businessName images location category phone')
      .populate('service', 'title')
      .populate('cabIds', 'name brand model vehicleNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    Booking.countDocuments(query),
    Booking.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);

  const statusCounts = {
    all: counts.reduce((acc, curr) => acc + curr.count, 0),
    pending: counts.find(c => c._id === 'pending')?.count || 0,
    confirmed: counts.find(c => c._id === 'confirmed')?.count || 0,
    completed: counts.find(c => c._id === 'completed')?.count || 0,
    cancelled: counts.find(c => c._id === 'cancelled')?.count || 0,
  };

  res.status(200).json({
    status: 'success',
    bookings,
    counts: statusCounts,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
  });
});

// @desc    Get unified user dashboard stats
// @route   GET /api/bookings/user-dashboard
// @access  Private
exports.getUserDashboard = catchAsync(async (req, res, next) => {
  const { userId } = req.query;

  let targetUserId = req.user._id;
  if (req.user.role === 'admin' && userId && userId !== 'null' && userId !== 'undefined') {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new AppError('Invalid User ID format', 400));
    }
    targetUserId = userId;
  }

  const [bookings, cabBookings, bookingStats, cabStats] = await Promise.all([
    Booking.find({ userId: targetUserId, bookingType: 'service' })
      .populate('vendorProfileId', 'businessName images location category')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Booking.find({ userId: targetUserId, bookingType: { $in: ['cab', 'baraat-cab'] } })
      .populate('vendorProfileId', 'businessName images location')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Booking.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(targetUserId), bookingType: 'service' } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]),
    Booking.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(targetUserId), bookingType: { $in: ['cab', 'baraat-cab'] } } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ])
  ]);

  const totalBookings = (bookingStats[0]?.total || 0) + (cabStats[0]?.total || 0);

  res.status(200).json({
    status: 'success',
    stats: {
      totalBookings,
    },
    recentBookings: bookings,
    recentCabBookings: cabBookings
  });
});

// @desc    Get vendor bookings
// @route   GET /api/bookings/vendor-bookings
// @access  Private (vendor)
exports.getVendorBookings = catchAsync(async (req, res, next) => {
  const { status, page = 1, limit = 100, vendorId, bookingType } = req.query;

  let queryVendorUserId = req.user._id;
  if (req.user.role === 'admin' && vendorId) {
    // If admin passes vendorProfileId, let's find that vendor's user ID
    const targetVendor = await Vendor.findById(vendorId);
    if (targetVendor) {
      queryVendorUserId = targetVendor.user;
    }
  }

  const query = {
    $or: [
      { vendor: queryVendorUserId },
      { vendorId: queryVendorUserId }
    ]
  };

  if (bookingType === 'service') {
    query.bookingType = 'service';
  } else if (bookingType === 'cab' || bookingType === 'baraat-cab') {
    query.bookingType = { $in: ['cab', 'baraat-cab'] };
  }

  if (status && status !== 'all') {
    if (status === 'cancelled') {
      query.status = { $in: ['cancelled', 'rejected'] };
    } else {
      query.status = status;
    }
  }

  // DEBUG LOGS
  console.log('DASHBOARD_FETCH: Fetching for Vendor UserId:', queryVendorUserId, 'bookingType:', bookingType);

  const matchQuery = {
    $or: [
      { vendor: new mongoose.Types.ObjectId(queryVendorUserId) },
      { vendorId: new mongoose.Types.ObjectId(queryVendorUserId) }
    ]
  };

  if (bookingType === 'service') {
    matchQuery.bookingType = 'service';
  } else if (bookingType === 'cab' || bookingType === 'baraat-cab') {
    matchQuery.bookingType = { $in: ['cab', 'baraat-cab'] };
  }

  const [bookings, total, serviceCounts] = await Promise.all([
    Booking.find(query)
      .populate('userId', 'name email phone avatar')
      .populate('user', 'name email phone avatar')
      .populate('service', 'title')
      .populate('cabIds', 'name brand model vehicleNumber images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    Booking.countDocuments(query),
    Booking.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);

  // DEBUG LOG AS REQUESTED
  console.log('FETCHED VENDOR BOOKINGS:', bookings);

  const statusCounts = {
    all: serviceCounts.reduce((acc, curr) => acc + curr.count, 0),
    pending: serviceCounts.find(c => c._id === 'pending')?.count || 0,
    confirmed: serviceCounts.find(c => c._id === 'confirmed')?.count || 0,
    completed: serviceCounts.find(c => c._id === 'completed')?.count || 0,
    cancelled: serviceCounts.reduce((acc, curr) => ['cancelled', 'rejected'].includes(curr._id) ? acc + curr.count : acc, 0),
    in_progress: serviceCounts.find(c => c._id === 'in_progress')?.count || 0,
    rejected: serviceCounts.find(c => c._id === 'rejected')?.count || 0,
  };

  res.status(200).json({
    status: 'success',
    bookings,
    counts: statusCounts,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
  });
});

// @desc    Update booking status (vendor)
// @route   PATCH /api/bookings/:id/status
// @access  Private (vendor)
exports.updateBookingStatus = catchAsync(async (req, res, next) => {
  const { status, note } = req.body;
  const booking = await Booking.findById(req.params.id).populate('vendorProfileId').populate('userId', 'name email');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Schema validation safe: copy existing userId and vendorId to user and vendor if they aren't set
  if (!booking.user) {
    booking.user = booking.userId;
  }
  if (!booking.vendor) {
    booking.vendor = booking.vendorId;
  }

  // Vendor authorization: vendor can only update own bookings
  if (req.user.role === 'vendor') {
    if (booking.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
  }

  // --- START STATUS TRANSITION GUARDS ---
  const validTransitions = {
    'pending': ['confirmed', 'cancelled', 'rejected'],
    'pending_payment': ['confirmed', 'cancelled', 'rejected'],
    'confirmed': ['in_progress', 'completed', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [], // Terminal state
    'cancelled': ['refunded'], // Terminal state except for refund
    'rejected': [], // Terminal state
    'refunded': [] // Terminal state
  };

  if (booking.status === status) {
    return next(new AppError(`Booking is already in '${status}' status.`, 400));
  }

  if (req.user.role !== 'admin' && (!validTransitions[booking.status] || !validTransitions[booking.status].includes(status))) {
    return next(new AppError(`Cannot change booking status from '${booking.status}' to '${status}'.`, 400));
  }
  // --- END STATUS TRANSITION GUARDS ---

  booking.status = status;
  booking.updatedAt = new Date();
  booking.timeline.push({ status, note, updatedBy: req.user._id });

  if (status === 'completed') {
    await Vendor.findByIdAndUpdate(booking.vendorProfileId._id, {
      $inc: { totalBookings: 1, totalEarnings: booking.amount },
    });
  }

  // --- START AVAILABILITY RESTORE ON CANCELLATION ---
  if (status === 'cancelled' || status === 'rejected') {
    const formattedDate = new Date(booking.eventDate);
    formattedDate.setHours(0, 0, 0, 0);

    const availability = await Availability.findOne({ vendorId: booking.vendorProfileId, date: formattedDate });

    if (availability) {
      if (booking.selectedSlotId) {
        const slot = availability.slots.id(booking.selectedSlotId);
        if (slot && slot.bookedCount > 0) {
          slot.bookedCount -= 1;
          if (slot.bookedCount === 0) slot.status = 'available';
          else slot.status = 'partially_booked';
        }
      }

      if (availability.bookedCount > 0) {
        availability.bookedCount -= 1;
      }

      if (availability.bookedCount === 0 && !availability.isBlocked) {
        availability.status = 'available';
      } else if (availability.bookedCount > 0) {
        availability.status = 'partially_booked';
      }
      await availability.save();
    }

    // Inventory is restored implicitly because booking status changes to 'cancelled' or 'rejected',
    // which removes it from the Date-Specific Conflict Detection Algorithm.
  }
  // --- END AVAILABILITY RESTORE ---

  // Save the updated booking cleanly, validating modified fields only
  await booking.save({ validateModifiedOnly: true });



  // 1. Notify User in real-time
  const bookedServiceName = booking.serviceName || booking.vendorProfileId?.businessName || 'Bespoke Service';
  await sendNotification({
    recipient: booking.user,
    sender: req.user._id,
    type: 'booking',
    title: status === 'confirmed' ? 'Booking Confirmed' : 'Booking Rejected',
    message: status === 'confirmed'
      ? `Your booking for ${bookedServiceName} has been confirmed`
      : `Your booking for ${bookedServiceName} has been rejected`,
    link: '/dashboard/my-bookings',
    data: { bookingId: booking._id }
  });

  // 2. Notify all Admins in real-time
  const admins = await User.find({ role: 'admin' });
  for (const admin of admins) {
    await sendNotification({
      recipient: admin._id,
      sender: req.user._id,
      type: 'booking',
      title: `Booking ${status === 'confirmed' ? 'Confirmed' : 'Rejected'}`,
      message: `Booking #${booking.bookingId} has been ${status} by ${req.user.name}`,
      link: '/admin/bookings',
      data: { bookingId: booking._id }
    });
  }

  // Trigger Multi-channel Notifications (In-App, Email, SMS)
  try {
    await sendBookingNotification({
      userId: booking.userId,
      booking: booking,
      type: booking.bookingType || 'service',
      status: status
    });
  } catch (error) {
    console.error('Notification error:', error);
  }

  // Socket Real-time Sync
  const io = req.app.get('io');
  if (io) {
    // Standard event updates
    io.to(`user_${booking.userId._id}`).emit('booking_updated', { booking });
    io.to(`user_${booking.vendorId}`).emit('booking_updated', { booking });
    io.to('admin').emit('booking_updated', { booking });

    // Explicitly requested socket events
    io.to(booking.user.toString()).emit('bookingUpdated', booking);
    io.to(booking.vendor.toString()).emit('bookingUpdated', booking);
  }

  res.status(200).json({
    status: 'success',
    message: `Booking ${status} successfully.`,
    booking
  });
});

// @desc    Cancel booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = catchAsync(async (req, res, next) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.id).populate('vendor');

  if (!booking) return next(new AppError('Booking not found.', 404));
  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized.', 403));
  }
  if (['completed', 'cancelled'].includes(booking.status)) {
    return next(new AppError('Cannot cancel this booking.', 400));
  }

  booking.status = 'cancelled';
  booking.timeline.push({ status: 'cancelled', note: reason, updatedBy: req.user._id });
  booking.cancellationReason = reason;
  booking.cancelledAt = Date.now();
  booking.cancelledBy = req.user._id;

  // --- START AVAILABILITY RESTORE ---
  const formattedDate = new Date(booking.eventDate);
  formattedDate.setHours(0, 0, 0, 0);

  const availability = await Availability.findOne({ vendorId: booking.vendor, date: formattedDate });
  if (availability) {
    if (booking.selectedSlotId) {
      const slot = availability.slots.id(booking.selectedSlotId);
      if (slot && slot.bookedCount > 0) {
        slot.bookedCount -= 1;
        if (slot.bookedCount === 0) slot.status = 'available';
        else slot.status = 'partially_booked';
      }
    } else if (availability.bookedCount > 0) {
      availability.bookedCount -= 1;
    }

    if (availability.bookedCount === 0 && !availability.isBlocked) {
      availability.status = 'available';
    } else if (availability.bookedCount > 0) {
      availability.status = 'partially_booked';
    }

    await availability.save();
  }

  // Inventory is restored implicitly because booking status changes to 'cancelled',
  // which removes it from the Date-Specific Conflict Detection Algorithm.
  // --- END AVAILABILITY RESTORE ---

  await booking.save();

  // 1. Notify Customer (this also triggers the sendBookingNotification for emails/sms)
  try {
    await sendBookingNotification({
      userId: booking.user,
      booking: booking,
      type: booking.bookingType || 'service',
      status: 'cancelled'
    });
  } catch (error) {
    console.error('Notification error:', error);
  }

  // 2. Notify Vendor in real-time
  await sendNotification({
    recipient: booking.vendorProfileId || booking.vendor,
    sender: req.user._id,
    type: 'booking',
    title: 'Booking Cancelled',
    message: `Booking #${booking.bookingId} has been cancelled by ${req.user.name}.`,
    link: '/vendor/dashboard/customer-bookings',
    data: { bookingId: booking._id }
  });

  // 3. Notify all Admins in real-time
  const admins = await User.find({ role: 'admin' });
  for (const admin of admins) {
    await sendNotification({
      recipient: admin._id,
      sender: req.user._id,
      type: 'booking',
      title: 'Booking Cancelled',
      message: `Booking #${booking.bookingId} has been cancelled by ${req.user.name}.`,
      link: '/admin/bookings',
      data: { bookingId: booking._id }
    });
  }

  // Socket notification
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${booking.user}`).emit('booking_updated', { booking });
    io.to(`user_${booking.vendor.user}`).emit('booking_updated', { booking });
    io.to('admin').emit('booking_updated', { booking });
  }

  res.status(200).json({
    status: 'success',
    message: 'Booking cancelled.',
    booking
  });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate('vendorProfileId', 'businessName phone email socialLinks images location user')
    .populate('vendorId', 'name email phone')
    .populate('vendor', 'name email phone')
    .populate('userId', 'name email phone avatar')
    .populate('user', 'name email phone avatar')
    .populate('service')
    .populate('cabIds', 'name brand model vehicleNumber images')
    .lean();


  if (!booking) return next(new AppError('Booking not found.', 404));

  // DEBUG IDs
  console.log(
    '[DEBUG_AUTHORIZATION]',
    'vendorId:', booking.vendorId?._id || booking.vendorId,
    'vendor:', booking.vendor?._id || booking.vendor,
    'userId:', booking.userId?._id || booking.userId,
    'user:', booking.user?._id || booking.user,
    'req.user._id:', req.user._id,
    'req.user.role:', req.user.role
  );

  // Check access
  const bookingUserId = booking.userId?._id?.toString() || booking.userId?.toString() || booking.user?._id?.toString() || booking.user?.toString();
  const bookingVendorId = booking.vendorId?._id?.toString() || booking.vendorId?.toString() || booking.vendor?._id?.toString() || booking.vendor?.toString();

  const isUser = bookingUserId === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  const isVendor = req.user.role === 'vendor' && bookingVendorId === req.user._id.toString();

  if (!isUser && !isAdmin && !isVendor) {
    return next(new AppError('Not authorized.', 403));
  }

  res.status(200).json({
    status: 'success',
    booking
  });
});

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings/admin-bookings
// @access  Private (Admin)
exports.getAdminBookings = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, status, type = 'services', search } = req.query;
  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (type === 'cabs' || type === 'cab' || type === 'baraat-cab') {
    query.bookingType = { $in: ['cab', 'baraat-cab'] };
  } else if (type === 'services' || type === 'service') {
    query.bookingType = 'service';
  }

  if (search) {
    query.$or = [
      { bookingId: { $regex: search, $options: 'i' } },
      { contactName: { $regex: search, $options: 'i' } },
      { serviceName: { $regex: search, $options: 'i' } }
    ];
  }

  const countQuery = { ...query };
  delete countQuery.status;

  const [bookings, total, counts] = await Promise.all([
    Booking.find(query)
      .populate('user')
      .populate('vendor')
      .populate('userId', 'name email phone avatar')
      .populate('vendorId', 'name email phone')
      .populate('vendorProfileId', 'businessName location phone')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Booking.countDocuments(query),
    Booking.aggregate([
      { $match: countQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);

  const statusCounts = {
    all: counts.reduce((acc, curr) => acc + curr.count, 0),
    pending: counts.find(c => c._id === 'pending')?.count || 0,
    confirmed: counts.find(c => c._id === 'confirmed')?.count || 0,
    completed: counts.find(c => c._id === 'completed')?.count || 0,
    cancelled: counts.find(c => c._id === 'cancelled')?.count || 0,
    rejected: counts.find(c => c._id === 'rejected')?.count || 0,
    in_progress: counts.find(c => c._id === 'in_progress')?.count || 0,
  };

  const mappedBookings = bookings.map(b => {
    const bObj = b.toObject ? b.toObject() : b;
    if (!bObj.user && bObj.userId) {
      bObj.user = bObj.userId;
    }
    if (!bObj.vendor) {
      bObj.vendor = bObj.vendorProfileId || bObj.vendorId;
    }
    return bObj;
  });

  res.status(200).json({
    status: 'success',
    bookings: mappedBookings,
    counts: statusCounts,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
  });
});

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin)
exports.deleteBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new AppError('Booking not found.', 404));

  if (req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete bookings.', 403));
  }

  await Booking.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'Booking deleted successfully.'
  });
});

// @desc    Get vendor wedding services bookings
// @route   GET /api/bookings/vendor/services
// @access  Private (vendor/admin)
exports.getVendorServicesBookings = catchAsync(async (req, res, next) => {
  req.query.bookingType = 'service';
  return exports.getVendorBookings(req, res, next);
});

// @desc    Get vendor cab bookings
// @route   GET /api/bookings/vendor/cabs
// @access  Private (vendor/admin)
exports.getVendorCabsBookings = catchAsync(async (req, res, next) => {
  req.query.bookingType = 'cab';
  return exports.getVendorBookings(req, res, next);
});

module.exports = exports;

