const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 resolution to prevent Gmail SMTP ENETUNREACH timeouts on systems without full IPv6 routing
dns.setDefaultResultOrder('ipv4first');

// ─── Configuration ───────────────────────────────────────────────────
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true'; // false for port 587 (STARTTLS)
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || `ShaadiSaathi <${EMAIL_USER}>`;
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

const COLORS = {
  primary: '#C2185B',
  secondary: '#D4AF37',
  background: '#FAFAFA',
  text: '#333333',
  lightText: '#666666',
};

// ─── Nodemailer Transporter (Gmail SMTP) ─────────────────────────────
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('[SMTP] ❌ EMAIL_USER or EMAIL_PASS is missing. Emails will NOT be sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    pool: true,           // Use connection pooling for better throughput
    maxConnections: 3,
    maxMessages: 100,
    tls: {
      rejectUnauthorized: false, // Allow self-signed certs (some SMTP relays need this)
    },
    connectionTimeout: 10000,  // 10 seconds to establish connection
    greetingTimeout: 10000,
    socketTimeout: 15000,      // 15 seconds for socket operations
  });

  return transporter;
};

// ─── Verify SMTP Connection ──────────────────────────────────────────
const verifySMTP = async () => {
  const t = getTransporter();
  if (!t) {
    console.warn('[SMTP] ⚠️  Transporter not available — skipping verification.');
    return false;
  }

  try {
    await t.verify();
    console.log('[SMTP] ✅ Gmail SMTP connection verified successfully');
    console.log(`[SMTP]    → Host     : ${EMAIL_HOST}:${EMAIL_PORT}`);
    console.log(`[SMTP]    → User     : ${EMAIL_USER}`);
    console.log(`[SMTP]    → From     : ${EMAIL_FROM}`);
    return true;
  } catch (err) {
    console.error('[SMTP] ❌ SMTP verification failed:', err.message);
    console.error('[SMTP]    → Check EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT in your .env');
    return false;
  }
};

// ─── Retry Helper ────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Send Email with Retry Logic ─────────────────────────────────────
const sendEmail = async (options) => {
  const mailOptions = {
    from: options.from || EMAIL_FROM,
    to: options.to || options.email,
    subject: options.subject,
    html: options.html,
    text: options.text || (options.html ? options.html.replace(/<[^>]*>?/gm, '') : ''),
  };

  // Centralized Nodemailer Dispatch
  const t = getTransporter();
  if (!t) {
    const msg = 'Email transport not configured. Check EMAIL_USER and EMAIL_PASS environment variables.';
    console.error(`[SMTP] ❌ ${msg}`);
    throw new Error(msg);
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [3000, 6000, 12000]; // 3s, 6s, 12s exponential backoff
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[SMTP] 📨 Sending email to ${mailOptions.to} (attempt ${attempt}/${MAX_RETRIES})...`);
      const info = await t.sendMail(mailOptions);
      console.log(`[SMTP] ✅ Email sent successfully. MessageID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      lastError = err;
      console.error(`[SMTP] ❌ Attempt ${attempt}/${MAX_RETRIES} failed:`);
      console.error(`[SMTP]    → Host   : ${EMAIL_HOST}`);
      console.error(`[SMTP]    → Port   : ${EMAIL_PORT}`);
      console.error(`[SMTP]    → Code   : ${err.code || 'UNKNOWN'}`);
      console.error(`[SMTP]    → Error  : ${err.message}`);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt - 1] || 3000;
        console.log(`[SMTP] ⏳ Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      }
    }
  }

  console.error(`[SMTP] 💀 All ${MAX_RETRIES} attempts failed for email to ${mailOptions.to}`);
  throw lastError;
};

// ─── Base HTML Template ──────────────────────────────────────────────
const getBaseTemplate = (title, content, preheader = '') => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7fa; -webkit-font-smoothing: antialiased; word-wrap: break-word;">
        ${preheader ? `<div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>` : ''}
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: ${COLORS.primary}; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">ShaadiSaathi 💍</h1>
            <p style="color: #ffffff; margin: 5px 0 0 0; opacity: 0.9; font-style: italic;">Your Wedding, Perfected</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            ${content}
          </div>
          
          <!-- Footer -->
          <div style="background-color: ${COLORS.background}; padding: 20px; text-align: center; border-top: 1px solid #EAEAEA;">
            <p style="color: ${COLORS.lightText}; font-size: 14px; margin: 0;">Need help? Contact our <a href="${CLIENT_URL}/contact" style="color: ${COLORS.primary}; text-decoration: none;">Support Team</a></p>
            <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">&copy; ${new Date().getFullYear()} ShaadiSaathi. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// ─── Email Templates ─────────────────────────────────────────────────
const emailTemplates = {
  // ── Verification Email ──────────────────────────────────────────────
  verification: (name, url) => {
    const html = getBaseTemplate(
      'Verify Your Email Address',
      `<h2 style="color: ${COLORS.text}; margin-top: 0;">Hi ${name},</h2>
       <p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">Welcome to ShaadiSaathi! Please verify your email address to get started.</p>
       <div style="text-align: center; margin: 30px 0;">
         <a href="${url}" style="display: inline-block; background-color: ${COLORS.primary}; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">Verify Email Address</a>
       </div>
       <p style="color: ${COLORS.lightText}; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
       <p style="color: ${COLORS.primary}; font-size: 13px; word-break: break-all;">${url}</p>
       <p style="color: ${COLORS.lightText}; font-size: 14px; margin-bottom: 0;">This link will expire in 24 hours.</p>`,
      'Please verify your email to complete your ShaadiSaathi registration'
    );
    return { subject: 'Verify your email - ShaadiSaathi', html };
  },

  // ── Reset Password ─────────────────────────────────────────────────
  resetPassword: (name, url) => {
    const html = getBaseTemplate(
      'Reset Your Password',
      `<h2 style="color: ${COLORS.text}; margin-top: 0;">Hi ${name},</h2>
       <p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">You requested a password reset. Click the button below to choose a new password.</p>
       <div style="text-align: center; margin: 30px 0;">
         <a href="${url}" style="display: inline-block; background-color: ${COLORS.primary}; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">Reset Password</a>
       </div>
       <p style="color: ${COLORS.lightText}; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
       <p style="color: ${COLORS.primary}; font-size: 13px; word-break: break-all;">${url}</p>
       <p style="color: ${COLORS.lightText}; font-size: 14px; margin-bottom: 0;">This link will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>`
    );
    return { subject: 'Password Reset Request - ShaadiSaathi', html };
  },

  // ── Password Changed Confirmation ──────────────────────────────────
  passwordChanged: (name) => {
    const html = getBaseTemplate(
      'Password Changed Successfully',
      `<h2 style="color: ${COLORS.text}; margin-top: 0;">Hi ${name},</h2>
       <p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">Your password has been changed successfully.</p>
       <div style="background-color: #FFF3E0; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
         <p style="color: #E65100; margin: 0; font-size: 14px;">⚠️ If you did not make this change, please reset your password immediately or contact our support team.</p>
       </div>
       <div style="text-align: center; margin: 30px 0;">
         <a href="${CLIENT_URL}/forgot-password" style="display: inline-block; background-color: ${COLORS.primary}; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">Reset Password</a>
       </div>`
    );
    return { subject: 'Password Changed - ShaadiSaathi', html };
  },

  // ── Vendor Approval ────────────────────────────────────────────────
  vendorApproval: (name, status) => {
    const isApproved = status === 'approved';
    const html = getBaseTemplate(
      'Vendor Application Update',
      `<h2 style="color: ${COLORS.text}; margin-top: 0;">Hi ${name},</h2>
       <p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">Your vendor application has been <strong>${status}</strong>.</p>
       ${isApproved ? 
         `<p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">You can now login and start managing your services.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${CLIENT_URL}/vendor/dashboard" style="display: inline-block; background-color: ${COLORS.primary}; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
          </div>` :
         `<p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">Please contact support for more details regarding this decision.</p>`
       }`
    );
    return { subject: `Vendor Application ${status === 'approved' ? 'Approved' : 'Update'}`, html };
  },

  // ── Service Approved ───────────────────────────────────────────────
  serviceApproved: (name, title, url) => {
    const html = getBaseTemplate(
      'Service Approved',
      `<h2 style="color: ${COLORS.text}; margin-top: 0;">Hi ${name},</h2>
       <p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">Great news! Your service <strong>${title}</strong> has been approved and is now live on the platform.</p>
       <div style="text-align: center; margin: 30px 0;">
         <a href="${url}" style="display: inline-block; background-color: ${COLORS.primary}; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">View Service</a>
       </div>`
    );
    return { subject: 'Your Service is Live! - ShaadiSaathi', html };
  },

  // ── Booking Confirmation ───────────────────────────────────────────
  bookingConfirmation: (name, details) => {
    const html = getBaseTemplate(
      'Booking Confirmation',
      `<h2 style="color: ${COLORS.text}; margin-top: 0;">Hi ${name},</h2>
       <p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">Your booking has been successfully confirmed!</p>
       
       <h3 style="color: ${COLORS.text}; margin-top: 30px; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 5px; display: inline-block;">Booking Summary</h3>
       <div style="background-color: #F8F9FA; padding: 20px; border-radius: 8px; margin: 10px 0; border: 1px solid #EAEAEA;">
         <p style="margin: 8px 0; word-break: break-all;"><strong>Booking ID:</strong> ${details.bookingId || 'N/A'}</p>
         <p style="margin: 8px 0;"><strong>Service:</strong> ${details.serviceName || 'Wedding Service'}</p>
         <p style="margin: 8px 0;"><strong>Vendor:</strong> ${details.vendorName || 'ShaadiSaathi Vendor'}</p>
         <p style="margin: 8px 0;"><strong>Date:</strong> ${details.eventDate || 'To Be Confirmed'}</p>
         <p style="margin: 8px 0;"><strong>Time:</strong> ${details.eventTime || 'TBD'}</p>
         <p style="margin: 8px 0;"><strong>Location:</strong> ${details.eventLocation || 'TBD'}</p>
         <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #CCCCCC;">
           <p style="margin: 0; font-size: 18px; color: ${COLORS.primary};"><strong>Total Amount:</strong> ₹${details.bookingAmount || 0}</p>
         </div>
       </div>

       <div style="text-align: center; margin: 40px 0 20px;">
         <a href="${CLIENT_URL}/user/bookings" style="display: inline-block; background-color: ${COLORS.primary}; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(194, 24, 91, 0.2);">View Booking</a>
       </div>`
    );
    return { subject: 'Booking Confirmation - ShaadiSaathi', html };
  },

  // ── Vendor Booking Alert ───────────────────────────────────────────
  vendorBookingAlert: (name, details) => {
    const html = getBaseTemplate(
      'New Booking Alert',
      `<h2 style="color: ${COLORS.text}; margin-top: 0;">Hi ${name || 'Vendor'},</h2>
       <p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">You have received a new booking through ShaadiSaathi!</p>
       
       <h3 style="color: ${COLORS.text}; margin-top: 30px; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 5px; display: inline-block;">Booking Summary</h3>
       <div style="background-color: #F8F9FA; padding: 20px; border-radius: 8px; margin: 10px 0; border: 1px solid #EAEAEA;">
         <p style="margin: 8px 0; word-break: break-all;"><strong>Booking ID:</strong> ${details.bookingId || 'N/A'}</p>
         <p style="margin: 8px 0;"><strong>Service:</strong> ${details.serviceName || 'Wedding Service'}</p>
         <p style="margin: 8px 0;"><strong>Date:</strong> ${details.eventDate || 'To Be Confirmed'}</p>
         <p style="margin: 8px 0;"><strong>Time:</strong> ${details.eventTime || 'TBD'}</p>
         <p style="margin: 8px 0;"><strong>Location:</strong> ${details.eventLocation || 'TBD'}</p>
         <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #CCCCCC;">
           <p style="margin: 0; font-size: 18px; color: ${COLORS.primary};"><strong>Amount:</strong> ₹${details.bookingAmount || 0}</p>
         </div>
       </div>

       <h3 style="color: ${COLORS.text}; margin-top: 30px; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid ${COLORS.secondary}; padding-bottom: 5px; display: inline-block;">Customer Details</h3>
       <div style="background-color: #F8F9FA; padding: 20px; border-radius: 8px; margin: 10px 0; border: 1px solid #EAEAEA;">
         <p style="margin: 8px 0;"><strong>Name:</strong> ${details.customerName || 'Customer'}</p>
         <p style="margin: 8px 0;"><strong>Phone:</strong> <a href="tel:${details.customerPhone || ''}" style="color: ${COLORS.text}; text-decoration: none;">${details.customerPhone || 'Not Provided'}</a></p>
         <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${details.customerEmail || ''}" style="color: ${COLORS.text}; text-decoration: none;">${details.customerEmail || 'Not Provided'}</a></p>
       </div>

       <div style="text-align: center; margin: 40px 0 20px;">
         <a href="${CLIENT_URL}/vendor/bookings" style="display: inline-block; background-color: ${COLORS.primary}; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(194, 24, 91, 0.2);">Open Vendor Dashboard</a>
       </div>`
    );
    return { subject: 'New Booking Received - ShaadiSaathi', html };
  },

  // ── Admin Booking Alert ────────────────────────────────────────────
  adminBookingAlert: (name, details) => {
    const html = getBaseTemplate(
      'Admin Booking Alert',
      `<h2 style="color: ${COLORS.text}; margin-top: 0;">Hi ${name},</h2>
       <p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">A new booking has been placed on the platform.</p>
       
       <h3 style="color: ${COLORS.text}; margin-top: 30px; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #333333; padding-bottom: 5px; display: inline-block;">Platform Booking Summary</h3>
       <div style="background-color: #F8F9FA; padding: 20px; border-radius: 8px; margin: 10px 0; border: 1px solid #EAEAEA;">
         <p style="margin: 8px 0; word-break: break-all;"><strong>Booking ID:</strong> ${details.bookingId || 'N/A'}</p>
         <p style="margin: 8px 0;"><strong>Service:</strong> ${details.serviceName || 'Wedding Service'}</p>
         <p style="margin: 8px 0;"><strong>Vendor:</strong> ${details.vendorName || 'ShaadiSaathi Vendor'}</p>
         <p style="margin: 8px 0;"><strong>Date:</strong> ${details.eventDate || 'To Be Confirmed'}</p>
         <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #CCCCCC;">
           <p style="margin: 0; font-size: 18px;"><strong>Amount:</strong> ₹${details.bookingAmount || 0}</p>
         </div>
       </div>

       <h3 style="color: ${COLORS.text}; margin-top: 30px; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #333333; padding-bottom: 5px; display: inline-block;">Customer Details</h3>
       <div style="background-color: #F8F9FA; padding: 20px; border-radius: 8px; margin: 10px 0; border: 1px solid #EAEAEA;">
         <p style="margin: 8px 0;"><strong>Name:</strong> ${details.customerName || 'Customer'}</p>
         <p style="margin: 8px 0;"><strong>Phone:</strong> ${details.customerPhone || 'Not Provided'}</p>
         <p style="margin: 8px 0;"><strong>Email:</strong> ${details.customerEmail || 'Not Provided'}</p>
       </div>

       <div style="text-align: center; margin: 40px 0 20px;">
         <a href="${CLIENT_URL}/admin/bookings" style="display: inline-block; background-color: ${COLORS.text}; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px;">View in Admin Panel</a>
       </div>`
    );
    return { subject: 'New Platform Booking - ShaadiSaathi', html };
  },

  // ── Booking Status Update ──────────────────────────────────────────
  bookingStatusUpdate: (name, details) => {
    const statusColors = {
      confirmed: '#4CAF50',
      cancelled: '#F44336',
      completed: '#2196F3',
      rejected: '#FF9800',
    };
    const statusIcons = {
      confirmed: '✅',
      cancelled: '❌',
      completed: '🎉',
      rejected: '⚠️',
    };
    const currentStatus = details.bookingStatus || details.status || 'updated';
    const color = statusColors[currentStatus] || COLORS.primary;
    const icon = statusIcons[currentStatus] || '📋';
    const statusFormatted = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);

    const html = getBaseTemplate(
      'Booking Status Update',
      `<h2 style="color: ${COLORS.text}; margin-top: 0;">Hi ${name},</h2>
       <p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">Your booking status has been updated.</p>
       
       <div style="background-color: #F8F9FA; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #EAEAEA; border-left: 5px solid ${color};">
         <p style="font-size: 20px; font-weight: bold; color: ${color}; margin-top: 0; margin-bottom: 15px;">${icon} ${statusFormatted}</p>
         <p style="margin: 8px 0; word-break: break-all;"><strong>Booking ID:</strong> ${details.bookingId || 'N/A'}</p>
         <p style="margin: 8px 0;"><strong>Service:</strong> ${details.serviceName || 'Wedding Service'}</p>
         <p style="margin: 8px 0;"><strong>Date:</strong> ${details.eventDate || 'To Be Confirmed'}</p>
         <p style="margin: 8px 0;"><strong>Time:</strong> ${details.eventTime || 'TBD'}</p>
         <p style="margin: 8px 0;"><strong>Vendor:</strong> ${details.vendorName || 'ShaadiSaathi Vendor'}</p>
       </div>

       <div style="text-align: center; margin: 40px 0 20px;">
         <a href="${CLIENT_URL}/user/bookings" style="display: inline-block; background-color: ${COLORS.primary}; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(194, 24, 91, 0.2);">View Booking</a>
       </div>`
    );
    return { subject: `Booking ${statusFormatted} - ShaadiSaathi`, html };
  },

  // ── Admin Notification (Generic) ───────────────────────────────────
  adminNotification: (title, details) => {
    const detailsHtml = details && typeof details === 'object'
      ? Object.entries(details).map(([key, val]) => `<p><strong>${key}:</strong> ${val}</p>`).join('')
      : `<p>${details || ''}</p>`;

    const html = getBaseTemplate(
      title,
      `<h2 style="color: ${COLORS.text}; margin-top: 0;">${title}</h2>
       <div style="background-color: #F8F9FA; padding: 20px; border-radius: 8px; margin: 20px 0;">
         ${detailsHtml}
       </div>
       <div style="text-align: center; margin: 30px 0;">
         <a href="${CLIENT_URL}/admin" style="display: inline-block; background-color: ${COLORS.text}; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">Open Admin Panel</a>
       </div>`
    );
    return { subject: `${title} - ShaadiSaathi Admin`, html };
  },
};

// ─── Legacy / Newsletter helpers (migrated from utils/email.js) ──────
const getWelcomeEmailHTML = (email) => {
  const unsubscribeUrl = `${CLIENT_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
  return getBaseTemplate(
    'Welcome to ShaadiSaathi!',
    `<h2 style="color: ${COLORS.text}; margin-top: 0;">Welcome to ShaadiSaathi!</h2>
     <p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">Thank you for subscribing to our newsletter! We are thrilled to be part of your wedding journey.</p>
     <div style="text-align: center; margin: 30px 0;">
       <a href="${CLIENT_URL}/services" style="display: inline-block; background-color: ${COLORS.primary}; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">Explore Vendors</a>
     </div>
     <p style="color: #999999; font-size: 12px; text-align: center;">
        <a href="${unsubscribeUrl}" style="color: #999999; text-decoration: underline;">Unsubscribe from this list</a>
     </p>`
  );
};

const getCampaignEmailHTML = (email, subject, content, bannerUrl) => {
  const unsubscribeUrl = `${CLIENT_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
  return getBaseTemplate(
    subject,
    `${bannerUrl ? `<img src="${bannerUrl}" alt="Campaign Banner" style="width: 100%; height: auto; display: block; margin-bottom: 20px; border-radius: 8px;" />` : ''}
     <h2 style="color: ${COLORS.text}; margin-top: 0;">${subject}</h2>
     <div style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">
       ${content}
     </div>
     <div style="text-align: center; margin: 30px 0;">
       <a href="${CLIENT_URL}" style="display: inline-block; background-color: ${COLORS.primary}; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">Visit ShaadiSaathi</a>
     </div>
     <p style="color: #999999; font-size: 12px; text-align: center;">
        <a href="${unsubscribeUrl}" style="color: #999999; text-decoration: underline;">Unsubscribe from this list</a>
     </p>`
  );
};

const getPackageUserEmailHTML = (name, packageName) => {
  return getBaseTemplate(
    'Package Inquiry Received',
    `<h2 style="color: ${COLORS.text}; margin-top: 0;">Hi ${name},</h2>
     <p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">Thank you for inquiring about our <strong>${packageName}</strong>! We've successfully received your details.</p>
     <p style="color: ${COLORS.lightText}; font-size: 16px; line-height: 1.6;">Our wedding coordination team is currently reviewing your requirements and will reach out to you shortly to discuss availability, customizations, and next steps.</p>`
  );
};

const getPackageAdminEmailHTML = (inquiry, pkg) => {
  return getBaseTemplate(
    'New Package Inquiry Received',
    `<h2 style="color: ${COLORS.text}; margin-top: 0;">🚨 New Package Inquiry Received</h2>
     <div style="background-color: #F8F9FA; padding: 20px; border-radius: 8px; margin: 20px 0;">
       <p><strong>Package:</strong> ${pkg.name}</p>
       <p><strong>Name:</strong> ${inquiry.name}</p>
       <p><strong>Phone:</strong> ${inquiry.phone}</p>
       <p><strong>Email:</strong> ${inquiry.email || 'N/A'}</p>
       <p><strong>City:</strong> ${inquiry.city}</p>
       <p><strong>Wedding Date:</strong> ${new Date(inquiry.weddingDate).toLocaleDateString()}</p>
     </div>`
  );
};

module.exports = {
  sendEmail,
  emailTemplates,
  verifySMTP,
  getWelcomeEmailHTML,
  getCampaignEmailHTML,
  getPackageUserEmailHTML,
  getPackageAdminEmailHTML,
};
