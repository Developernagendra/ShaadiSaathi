const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../config/email');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// ---------------- GENERATE JWT TOKEN ----------------
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

// ---------------- REGISTER USER ----------------
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Name, email, and password are required.', 400));
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phone ? phone.trim() : null;

  // ── Duplicate check: email OR phone ────────────────────────────────
  const duplicateQuery = [{ email: normalizedEmail }];
  if (normalizedPhone) {
    duplicateQuery.push({ phone: normalizedPhone });
  }

  const existingUser = await User.findOne({ $or: duplicateQuery });

  if (existingUser) {
    // Case 1: Email already exists
    if (existingUser.email === normalizedEmail) {

      // Sub-case: Account exists but email not verified → resend verification
      if (!existingUser.isVerified) {
        const token = existingUser.generateEmailVerificationToken();
        await existingUser.save({ validateBeforeSave: false });

        const clientUrl = (process.env.CLIENT_URL || 'https://shaadi-saathi.vercel.app').replace(/\/$/, '');
        const verificationUrl = `${clientUrl}/verify-email/${token}`;

        try {
          const template = emailTemplates.verification(existingUser.name, verificationUrl);
          await sendEmail({ to: existingUser.email, subject: template.subject, html: template.html, text: template.text });
          console.log(`[AUTH] Resent verification email to unverified account: ${existingUser.email}`);
        } catch (err) {
          console.error('[AUTH] Failed to resend verification email:', err.message);
        }

        return res.status(400).json({
          success: false,
          message: 'This email is already registered but not verified. We have resent the verification link to your email.',
        });
      }

      // Sub-case: Verified account already exists
      return next(new AppError('Email already registered. Please login.', 400));
    }

    // Case 2: Phone already exists (different email)
    if (normalizedPhone && existingUser.phone === normalizedPhone) {
      return next(new AppError('Phone number already registered. Please use a different number or login.', 400));
    }
  }

  // ── Create account ─────────────────────────────────────────────────
  const userRole = role === 'vendor' ? 'vendor' : 'user';

  let user;
  try {
    user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone: normalizedPhone || undefined, // Don't save empty string (sparse index)
      role: userRole,
      isVerified: false,
      isEmailVerified: false,
    });
  } catch (err) {
    // Race condition: another request created the same user between our check and create
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      if (field === 'phone') {
        return next(new AppError('Phone number already registered. Please use a different number.', 400));
      }
      return next(new AppError('Email already registered. Please login.', 400));
    }
    throw err;
  }

  // Auto create vendor profile
  if (userRole === 'vendor') {
    const Vendor = require('../models/Vendor');

    const vendorProfile = await Vendor.create({
      user: user._id,
      businessName: `${name}'s Business (Pending)`,
      email: normalizedEmail,
      phone: normalizedPhone || '0000000000',
      approvalStatus: 'pending',
      profileCompletion: 0,
    });

    console.log('VENDOR REGISTERED');
    console.log('VENDOR PROFILE CREATED');

    user.vendorProfile = vendorProfile._id;
  }

  // Generate email verification token
  const token = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = (process.env.CLIENT_URL || 'https://shaadi-saathi.vercel.app').replace(/\/$/, '');

  const verificationUrl = `${clientUrl}/verify-email/${token}`;

  try {
    const template = emailTemplates.verification(
      user.name,
      verificationUrl
    );

    const emailResult = await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    console.log('[SMTP] ✅ VERIFICATION EMAIL DISPATCHED');
    console.log(`[SMTP]    → To        : ${user.email}`);
    console.log(`[SMTP]    → MessageID : ${emailResult?.messageId || 'N/A'}`);
  } catch (error) {
    console.error('[SMTP] ❌ VERIFICATION EMAIL FAILED:', error.message);
    await User.findByIdAndDelete(user._id);
    if (user.vendorProfile) {
      const Vendor = require('../models/Vendor');
      await Vendor.findByIdAndDelete(user.vendorProfile);
    }
    return next(new AppError('Failed to send verification email. Please try again.', 500));
  }

  // Do not generate token or set cookie upon registration.
  // The user MUST verify their email first before logging in.

  res.status(201).json({
    success: true,
    message: 'Registration successful! Please check your email to verify your account.',
    emailSent: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      avatar: user.avatar,
    },
  });
});

// ---------------- LOGIN USER ----------------
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new AppError(
        'Please provide email and password.',
        400
      )
    );
  }

  const normalizedEmail =
    email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select('+password');

  if (
    !user ||
    !(await user.comparePassword(password))
  ) {
    return next(
      new AppError(
        'Invalid email or password.',
        401
      )
    );
  }

  if (!user.isActive) {
    return next(
      new AppError(
        'Your account has been deactivated. Please contact support.',
        401
      )
    );
  }

  if (!user.isVerified && user.role !== 'admin') {
    return next(
      new AppError(
        'Please verify your email before continuing.',
        401
      )
    );
  }

  // Update login time
  user.lastLogin = Date.now();

  await user.save({
    validateBeforeSave: false,
  });

  const token = generateToken(
    user._id,
    user.role
  );

  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE || '7') * 24 * 60 * 60 * 1000)
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };
  res.cookie('token', token, cookieOptions);

  res.status(200).json({
    status: 'success',
    message: 'Login successful.',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      avatar: user.avatar,
      phone: user.phone,
    },
  });
});

// ---------------- VERIFY EMAIL ----------------
const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  if (
    !token ||
    token === 'undefined' ||
    token === 'null'
  ) {
    return next(
      new AppError(
        'Invalid or missing verification token.',
        400
      )
    );
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(
      new AppError(
        'Email verification token is invalid or has expired.',
        400
      )
    );
  }

  user.isVerified = true;
  user.isEmailVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message:
      'Email verified successfully! You can now login.',
  });
});

// ---------------- FORGOT PASSWORD ----------------
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const normalizedEmail =
    email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  // prevent email enumeration
  if (!user) {
    return res.status(200).json({
      status: 'success',
      message:
        'If an account exists with this email, you will receive a password reset link.',
    });
  }

  const resetToken =
    user.generatePasswordResetToken();

  await user.save({
    validateBeforeSave: false,
  });

  const clientUrl = (process.env.CLIENT_URL || 'https://shaadi-saathi.vercel.app').replace(/\/$/, '');

  const resetUrl =
    `${clientUrl}/reset-password/${resetToken}`;

  try {
    const template =
      emailTemplates.resetPassword(
        user.name,
        resetUrl
      );

    await sendEmail({
      to: user.email,
      ...template,
    });

    res.status(200).json({
      status: 'success',
      message:
        'Password reset email sent successfully.',
    });

  } catch (err) {

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({
      validateBeforeSave: false,
    });

    return next(
      new AppError(
        'Failed to send password reset email. Please try again.',
        500
      )
    );
  }
});

// ---------------- RESET PASSWORD ----------------
const resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  if (
    !token ||
    token === 'undefined' ||
    token === 'null'
  ) {
    return next(
      new AppError(
        'Invalid or missing password reset token.',
        400
      )
    );
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(
      new AppError(
        'Password reset token is invalid or has expired.',
        400
      )
    );
  }

  user.password = req.body.password;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  const jwtToken = generateToken(
    user._id,
    user.role
  );

  res.status(200).json({
    status: 'success',
    message: 'Password reset successful.',
    token: jwtToken,
  });
});

// ---------------- GET CURRENT USER ----------------
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .select('name email role avatar isVerified isEmailVerified phone isActive wishlist')
    .lean();

  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: 'User not found',
    });
  }

  let vendorProfile = null;
  if (user.role === 'vendor') {
    const Vendor = require('../models/Vendor');
    vendorProfile = await Vendor.findOne({ user: user._id })
      .select('businessName approvalStatus isFeatured coverImage logo rating user category')
      .populate('category', 'name slug')
      .lean();

    if (!vendorProfile) {
      console.log('VENDOR PROFILE NOT FOUND IN getMe - AUTO-CREATING FAIL-SAFE PROFILE');
      const newProfile = await Vendor.create({
        user: user._id,
        businessName: `${user.name}'s Business (Pending)`,
        email: user.email,
        phone: user.phone || '0000000000',
        approvalStatus: 'pending',
        profileCompletion: 0,
      });
      await User.findByIdAndUpdate(user._id, { vendorProfile: newProfile._id });

      vendorProfile = await Vendor.findById(newProfile._id)
        .select('businessName approvalStatus isFeatured coverImage logo rating user category')
        .populate('category', 'name slug')
        .lean();
    }
  }

  res.status(200).json({
    status: 'success',
    user: {
      ...user,
      isVerified: user.isVerified,
      isEmailVerified: user.isEmailVerified,
      vendorProfile,
    },
  });
});

// ---------------- CHANGE PASSWORD ----------------
const changePassword = catchAsync(async (req, res, next) => {

  const {
    currentPassword,
    newPassword,
  } = req.body;

  const user = await User.findById(
    req.user._id
  ).select('+password');

  if (
    !(await user.comparePassword(currentPassword))
  ) {
    return next(
      new AppError(
        'Current password is incorrect.',
        400
      )
    );
  }

  user.password = newPassword;

  await user.save();

  res.status(200).json({
    status: 'success',
    message:
      'Password changed successfully.',
  });
});

// ---------------- RESEND VERIFICATION ----------------
const resendVerification = catchAsync(async (req, res, next) => {

  const { email } = req.body;

  if (!email) {
    return next(
      new AppError(
        'Please provide an email address.',
        400
      )
    );
  }

  const normalizedEmail =
    email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    return next(
      new AppError(
        'No user found with this email address.',
        404
      )
    );
  }

  if (user.isVerified) {
    return next(
      new AppError(
        'This account is already verified.',
        400
      )
    );
  }

  const token = user.generateEmailVerificationToken();

  await user.save({
    validateBeforeSave: false,
  });

  const clientUrl = (process.env.CLIENT_URL || 'https://shaadi-saathi.vercel.app').replace(/\/$/, '');

  const verificationUrl = `${clientUrl}/verify-email/${token}`;

  try {

    const template =
      emailTemplates.verification(
        user.name,
        verificationUrl
      );

    await sendEmail({
      to: user.email,
      ...template,
    });

    res.status(200).json({
      status: 'success',
      message:
        'Verification link sent to your email.',
    });

  } catch (error) {

    return next(
      new AppError(
        'Failed to send verification email. Please try again later.',
        500
      )
    );
  }
});

// ---------------- LOGOUT ----------------
const logout = catchAsync(async (req, res, next) => {

  res.cookie('token', 'none', {
    expires:
      new Date(Date.now() + 10 * 1000),

    httpOnly: true,

    secure:
      process.env.NODE_ENV === 'production' ||
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https',

    sameSite:
      process.env.NODE_ENV === 'production'
        ? 'none'
        : 'lax',
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.',
  });
});

// ---------------- TEST EMAIL DIAGNOSTIC ----------------
const testEmail = catchAsync(async (req, res, next) => {
  try {
    const to = process.env.EMAIL_USER; // Send to self
    const subject = 'ShaadiSaathi SMTP Diagnostic Test';
    const html = `
      <div style="font-family:sans-serif;padding:20px;border:1px solid #ddd;border-radius:8px;">
        <h2 style="color:#22c55e;">SMTP Test Successful! ✅</h2>
        <p>If you are reading this email, the Nodemailer configuration in <b>ShaadiSaathi</b> is fully functional.</p>
        <p><b>Time:</b> ${new Date().toISOString()}</p>
        <p><b>Environment:</b> ${process.env.NODE_ENV}</p>
        <p>Your authentication gating and verification flow will now work smoothly.</p>
      </div>
    `;

    // Explicitly await for testing purposes to catch actual errors synchronously
    const info = await sendEmail({ to, subject, html });

    res.status(200).json({
      status: 'success',
      message: 'Test email sent successfully',
      data: {
        messageId: info.messageId,
        recipient: to
      }
    });
  } catch (error) {
    console.error('[SMTP] Test Endpoint Failed:', error);
    return next(new AppError(`SMTP Configuration Error: ${error.message}`, 500));
  }
});

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
  resendVerification,
  testEmail,
};