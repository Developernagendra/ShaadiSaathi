'use strict';
const nodemailer = require('nodemailer');

// ============================================================
// SMTP CONFIGURATION
// Transporter is created LAZILY (on first use) so that it
// always reads the final, fully-loaded process.env values.
// ============================================================

let _transporter = null;

const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS
    ? process.env.EMAIL_PASS.replace(/\s+/g, '')
    : '';

  if (!user || !pass) {
    console.error('[SMTP] ❌ EMAIL_USER or EMAIL_PASS missing in environment!');
    return null;
  }

  console.log(`[SMTP] Creating transporter for: ${host}:${port}`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    pool: true,          // Reuse connections
    maxConnections: 5,
    rateDelta: 1000,
    rateLimit: 5,
  });

  return transporter;
};

const getTransporter = () => {
  if (!_transporter) {
    _transporter = createTransporter();
  }
  return _transporter;
};

// Verify SMTP on startup (non-blocking)
const verifySmtp = () => {
  console.log('[EMAIL] Provider: Nodemailer SMTP');
  console.log('[EMAIL] Host:', process.env.EMAIL_HOST || 'smtp.gmail.com');
  console.log('[EMAIL] User:', process.env.EMAIL_USER || 'Not provided');

  const t = getTransporter();
  if (!t) return;

  t.verify((error) => {
    if (error) {
      console.error('[SMTP] ❌ SMTP VERIFICATION FAILED:', error.message);
      // Reset so next sendEmail() attempt will re-create transporter
      _transporter = null;
    } else {
      console.log('[SMTP] ✅ SMTP READY — Connection verified successfully.');
    }
  });
};

// ============================================================
// SEND EMAIL — Central dispatcher with retry logic
// ============================================================

const sendEmail = async ({ to, subject, html, text, retryCount = 0 }) => {
  const MAX_RETRIES = 2;

  if (!to) {
    console.error('[SMTP] ❌ sendEmail() called with no recipient address!');
    throw new Error('Email recipient (to) is required.');
  }

  const transporter = getTransporter();
  if (!transporter) {
    throw new Error('[SMTP] Transporter could not be created. Check EMAIL_USER and EMAIL_PASS in .env');
  }

  const fromName = process.env.EMAIL_FROM_NAME || 'ShaadiSaathi';
  const fromAddr = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromAddr}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>?/gm, '').replace(/\n\s*\n/g, '\n').trim(),
  };

  try {
    console.log(`[SMTP] 📨 Sending email to: ${to} | Subject: "${subject}" (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] ✅ EMAIL SENT SUCCESSFULLY | MessageID: ${info.messageId} | To: ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[SMTP] ❌ EMAIL SEND FAILED | To: ${to} | Error: ${error.message}`);

    // If auth error, reset transporter so next retry re-creates with fresh env
    if (error.message.includes('535') || error.message.includes('auth')) {
      console.error('[SMTP] 🔑 AUTH ERROR — resetting transporter cache');
      _transporter = null;
    }

    if (retryCount < MAX_RETRIES) {
      const delay = (retryCount + 1) * 3000; // 3s, 6s
      console.log(`[SMTP] ⏳ Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendEmail({ to, subject, html, text, retryCount: retryCount + 1 });
    }

    console.error(`[SMTP] ❌ ALL ${MAX_RETRIES + 1} DELIVERY ATTEMPTS FAILED for: ${to}`);
    throw new Error(`Email delivery failed after ${MAX_RETRIES + 1} attempts: ${error.message}`);
  }
};

// ============================================================
// EMAIL TEMPLATES — Professional HTML
// All links use CLIENT_URL env var (no hardcoded domains)
// ============================================================

const getClientUrl = () => {
  return (process.env.CLIENT_URL || 'https://shaadi-saathi.vercel.app').replace(/\/$/, '');
};

const emailTemplates = {

  // 1. Email Verification
  verification: (name, verificationUrl) => ({
    subject: '🌸 Verify Your Email — ShaadiSaathi | अपना ईमेल सत्यापित करें',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#c41e6b,#e91e8c);padding:48px 40px;text-align:center">
          <h1 style="color:white;margin:0;font-size:32px;font-weight:700;letter-spacing:-0.5px">💒 ShaadiSaathi</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px">Your Wedding Planning Partner</p>
        </div>
        <div style="padding:48px 40px">
          <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:24px">Welcome, ${name}! 🎉</h2>
          <p style="color:#555;line-height:1.7;font-size:16px;margin:0 0 32px">Thank you for joining ShaadiSaathi. Please verify your email address to get started planning your dream wedding.</p>
          <div style="text-align:center;margin:0 0 32px">
            <a href="${verificationUrl}" style="display:inline-block;background:linear-gradient(135deg,#c41e6b,#e91e8c);color:white;padding:16px 40px;border-radius:50px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.3px">✉️ Verify Email Address</a>
          </div>
          <p style="color:#999;font-size:13px;text-align:center;margin:0">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
        </div>
        <div style="background:#fafafa;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0">
          <p style="color:#bbb;font-size:12px;margin:0">© 2024 ShaadiSaathi. Made with ❤️ for Indian weddings.</p>
        </div>
      </div>`,
  }),

  // 2. Password Reset
  resetPassword: (name, resetUrl) => ({
    subject: '🔐 Reset Your ShaadiSaathi Password | अपना पासवर्ड रीसेट करें',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#c41e6b,#e91e8c);padding:48px 40px;text-align:center">
          <h1 style="color:white;margin:0;font-size:32px;font-weight:700">💒 ShaadiSaathi</h1>
        </div>
        <div style="padding:48px 40px">
          <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:24px">Password Reset Request</h2>
          <p style="color:#555;line-height:1.7;font-size:16px;margin:0 0 32px">Hi ${name}, we received a request to reset your password. Click below to create a new one.</p>
          <div style="text-align:center;margin:0 0 32px">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#c41e6b,#e91e8c);color:white;padding:16px 40px;border-radius:50px;text-decoration:none;font-weight:700;font-size:16px">🔐 Reset Password</a>
          </div>
          <p style="color:#999;font-size:13px;text-align:center">This link expires in 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
        <div style="background:#fafafa;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0">
          <p style="color:#bbb;font-size:12px;margin:0">© 2024 ShaadiSaathi</p>
        </div>
      </div>`,
  }),

  // 3. Booking Confirmation (to User)
  bookingConfirmation: (name, booking) => ({
    subject: `✅ Booking Confirmed | बुकिंग कन्फर्म — ${booking.serviceName} | ShaadiSaathi`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#c41e6b,#e91e8c);padding:48px 40px;text-align:center">
          <h1 style="color:white;margin:0;font-size:32px;font-weight:700">💒 ShaadiSaathi</h1>
        </div>
        <div style="padding:48px 40px">
          <h2 style="color:#27ae60;margin:0 0 8px;font-size:28px">🎊 Booking Confirmed!</h2>
          <p style="color:#555;font-size:16px;margin:0 0 32px">Hi ${name}, your booking has been successfully placed.</p>
          <div style="background:#f8f9fa;border-radius:12px;padding:28px;margin:0 0 32px;border-left:4px solid #c41e6b">
            <h3 style="color:#1a1a2e;margin:0 0 20px;font-size:18px">${booking.serviceName}</h3>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eee;width:40%">Booking ID</td><td style="padding:10px 0;color:#1a1a2e;font-weight:700;text-align:right;border-bottom:1px solid #eee">#${booking.bookingId}</td></tr>
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eee">Event Date</td><td style="padding:10px 0;color:#1a1a2e;font-weight:700;text-align:right;border-bottom:1px solid #eee">${booking.date}</td></tr>
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eee">Amount</td><td style="padding:10px 0;color:#c41e6b;font-weight:700;font-size:18px;text-align:right;border-bottom:1px solid #eee">₹${booking.amount}</td></tr>
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:0.5px">Status</td><td style="padding:10px 0;text-align:right"><span style="background:#d4edda;color:#27ae60;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:700">Confirmed ✓</span></td></tr>
            </table>
          </div>
          <div style="text-align:center">
            <a href="${getClientUrl()}/bookings" style="display:inline-block;background:#1a1a2e;color:white;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px">View My Bookings</a>
          </div>
        </div>
        <div style="background:#fafafa;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0">
          <p style="color:#bbb;font-size:12px;margin:0">© 2024 ShaadiSaathi. All rights reserved.</p>
        </div>
      </div>`,
  }),

  // 4. Vendor Booking Alert (to Vendor)
  vendorBookingAlert: (vendorName, clientName, booking) => ({
    subject: `🔔 New Booking Received | नई बुकिंग — #${booking.bookingId} | ShaadiSaathi`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#c41e6b,#e91e8c);padding:48px 40px;text-align:center">
          <h1 style="color:white;margin:0;font-size:32px;font-weight:700">💒 ShaadiSaathi Vendor</h1>
        </div>
        <div style="padding:48px 40px">
          <h2 style="color:#1a1a2e;margin:0 0 8px;font-size:24px">Hello ${vendorName}! 👋</h2>
          <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 32px">You have received a new booking request from <strong>${clientName}</strong>.</p>
          <div style="background:#f8f9fa;border-radius:12px;padding:28px;margin:0 0 32px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;border-bottom:1px solid #eee;width:40%">Service</td><td style="padding:10px 0;color:#1a1a2e;font-weight:700;text-align:right;border-bottom:1px solid #eee">${booking.serviceName}</td></tr>
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;border-bottom:1px solid #eee">Booking ID</td><td style="padding:10px 0;color:#1a1a2e;font-weight:700;text-align:right;border-bottom:1px solid #eee">#${booking.bookingId}</td></tr>
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;border-bottom:1px solid #eee">Event Date</td><td style="padding:10px 0;color:#1a1a2e;font-weight:700;text-align:right;border-bottom:1px solid #eee">${booking.date}</td></tr>
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase">Amount</td><td style="padding:10px 0;color:#27ae60;font-weight:700;font-size:18px;text-align:right">₹${booking.amount}</td></tr>
            </table>
          </div>
          <div style="text-align:center">
            <a href="${getClientUrl()}/vendor/dashboard" style="display:inline-block;background:linear-gradient(135deg,#c41e6b,#e91e8c);color:white;padding:16px 40px;border-radius:50px;text-decoration:none;font-weight:700;font-size:16px">📋 Review Booking</a>
          </div>
        </div>
        <div style="background:#fafafa;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0">
          <p style="color:#bbb;font-size:12px;margin:0">© 2024 ShaadiSaathi • Vendor Partner Network</p>
        </div>
      </div>`,
  }),

  // 5. Admin Booking Alert (to Admin)
  adminBookingAlert: (adminName, clientName, vendorName, booking) => ({
    subject: `🚨 New Marketplace Booking — #${booking.bookingId} | ShaadiSaathi Admin`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <div style="background:#1a1a2e;padding:48px 40px;text-align:center">
          <h1 style="color:white;margin:0;font-size:28px;font-weight:700">🛡️ ShaadiSaathi Admin</h1>
          <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;font-size:14px">Operations Dashboard Alert</p>
        </div>
        <div style="padding:48px 40px">
          <h2 style="color:#1a1a2e;margin:0 0 8px;font-size:22px">New Booking Alert</h2>
          <p style="color:#555;font-size:15px;margin:0 0 32px">Hello ${adminName}, a new transaction has been registered on the marketplace.</p>
          <div style="background:#f8f9fa;border-radius:12px;padding:28px;margin:0 0 32px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;border-bottom:1px solid #eee;width:40%">Customer</td><td style="padding:10px 0;color:#1a1a2e;font-weight:700;text-align:right;border-bottom:1px solid #eee">${clientName}</td></tr>
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;border-bottom:1px solid #eee">Vendor</td><td style="padding:10px 0;color:#1a1a2e;font-weight:700;text-align:right;border-bottom:1px solid #eee">${vendorName}</td></tr>
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;border-bottom:1px solid #eee">Service</td><td style="padding:10px 0;color:#1a1a2e;font-weight:700;text-align:right;border-bottom:1px solid #eee">${booking.serviceName}</td></tr>
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;border-bottom:1px solid #eee">Booking ID</td><td style="padding:10px 0;color:#1a1a2e;font-weight:700;text-align:right;border-bottom:1px solid #eee">#${booking.bookingId}</td></tr>
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;border-bottom:1px solid #eee">Event Date</td><td style="padding:10px 0;color:#1a1a2e;font-weight:700;text-align:right;border-bottom:1px solid #eee">${booking.date}</td></tr>
              <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase">Revenue</td><td style="padding:10px 0;color:#27ae60;font-weight:700;font-size:18px;text-align:right">₹${booking.amount}</td></tr>
            </table>
          </div>
          <div style="text-align:center">
            <a href="${getClientUrl()}/admin/bookings" style="display:inline-block;background:#1a1a2e;color:white;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px">View in Admin Dashboard</a>
          </div>
        </div>
        <div style="background:#fafafa;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0">
          <p style="color:#bbb;font-size:12px;margin:0">© 2024 ShaadiSaathi • Auto-generated admin alert</p>
        </div>
      </div>`,
  }),

  // 6. Booking Status Update (to User)
  bookingStatusUpdate: (name, booking) => {
    const statusConfig = {
      confirmed: { color: '#27ae60', label: 'Confirmed ✓', bg: '#d4edda' },
      completed: { color: '#2980b9', label: 'Completed 🎉', bg: '#d1ecf1' },
      rejected: { color: '#e74c3c', label: 'Rejected', bg: '#f8d7da' },
      cancelled: { color: '#e74c3c', label: 'Cancelled', bg: '#f8d7da' },
    };
    const cfg = statusConfig[booking.status] || { color: '#c41e6b', label: booking.status, bg: '#fce7f3' };
    return {
      subject: `📋 Booking Update: ${booking.status.toUpperCase()} — #${booking.bookingId}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
          <div style="background:linear-gradient(135deg,#c41e6b,#e91e8c);padding:48px 40px;text-align:center">
            <h1 style="color:white;margin:0;font-size:32px;font-weight:700">💒 ShaadiSaathi</h1>
          </div>
          <div style="padding:48px 40px">
            <h2 style="color:#1a1a2e;margin:0 0 8px;font-size:24px">Hi ${name},</h2>
            <p style="color:#555;font-size:16px;margin:0 0 32px">The status of your booking for <strong>${booking.serviceName}</strong> has been updated.</p>
            <div style="text-align:center;margin:0 0 32px">
              <span style="background:${cfg.bg};color:${cfg.color};padding:10px 28px;border-radius:30px;font-weight:700;font-size:16px">${cfg.label}</span>
            </div>
            <div style="background:#f8f9fa;border-radius:12px;padding:28px;margin:0 0 32px">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;border-bottom:1px solid #eee;width:40%">Booking ID</td><td style="padding:10px 0;color:#1a1a2e;font-weight:700;text-align:right;border-bottom:1px solid #eee">#${booking.bookingId}</td></tr>
                <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;border-bottom:1px solid #eee">Event Date</td><td style="padding:10px 0;color:#1a1a2e;font-weight:700;text-align:right;border-bottom:1px solid #eee">${booking.date}</td></tr>
                <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase;border-bottom:1px solid #eee">Amount</td><td style="padding:10px 0;color:#c41e6b;font-weight:700;text-align:right;border-bottom:1px solid #eee">₹${booking.amount}</td></tr>
                <tr><td style="padding:10px 0;color:#888;font-size:13px;text-transform:uppercase">Vendor</td><td style="padding:10px 0;color:#1a1a2e;font-weight:700;text-align:right">${booking.vendorName || 'ShaadiSaathi Partner'}</td></tr>
              </table>
            </div>
            <div style="text-align:center">
              <a href="${getClientUrl()}/bookings" style="display:inline-block;background:#1a1a2e;color:white;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px">View Booking Details</a>
            </div>
          </div>
          <div style="background:#fafafa;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0">
            <p style="color:#bbb;font-size:12px;margin:0">© 2024 ShaadiSaathi. All rights reserved.</p>
          </div>
        </div>`,
    };
  },

  // 7. Vendor Profile Approval/Rejection (to Vendor)
  vendorApproval: (vendorName, status) => ({
    subject: status === 'approved'
      ? '🎉 Your Vendor Application is Approved — ShaadiSaathi'
      : '⚠️ Vendor Application Update — ShaadiSaathi',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#c41e6b,#e91e8c);padding:48px 40px;text-align:center">
          <h1 style="color:white;margin:0;font-size:32px;font-weight:700">💒 ShaadiSaathi</h1>
        </div>
        <div style="padding:48px 40px">
          <h2 style="color:${status === 'approved' ? '#27ae60' : '#e74c3c'};margin:0 0 16px;font-size:26px">
            ${status === 'approved' ? '🎉 Congratulations! You\'re Approved!' : '⚠️ Application Update'}
          </h2>
          <p style="color:#555;font-size:16px;margin:0 0 24px">Hi ${vendorName},</p>
          ${status === 'approved'
        ? `<p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 32px">Your vendor application has been <strong>approved</strong>! You can now start listing your services on ShaadiSaathi and receive booking requests from customers.</p>
               <div style="text-align:center">
                 <a href="${getClientUrl()}/vendor/dashboard" style="display:inline-block;background:linear-gradient(135deg,#c41e6b,#e91e8c);color:white;padding:16px 40px;border-radius:50px;text-decoration:none;font-weight:700;font-size:16px">🚀 Go to My Dashboard</a>
               </div>`
        : `<p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 16px">We regret to inform you that your vendor application requires additional review. Please contact our support team for more information.</p>
               <p style="color:#555;font-size:16px;line-height:1.7;margin:0 0 32px">You may reapply after resolving any outstanding issues.</p>
               <div style="text-align:center">
                 <a href="mailto:support@shaadisaathi.com" style="display:inline-block;background:#555;color:white;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px">Contact Support</a>
               </div>`
      }
        </div>
        <div style="background:#fafafa;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0">
          <p style="color:#bbb;font-size:12px;margin:0">© 2024 ShaadiSaathi</p>
        </div>
      </div>`,
  }),
};

// Run SMTP verification on startup
verifySmtp();

module.exports = { sendEmail, emailTemplates };
