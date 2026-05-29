/**
 * ShaadiSaathi — SMTP Live Diagnostic Script
 *
 * Run from terminal:
 *   cd /Users/nagendrakumarsharma/Desktop/Ravi/server
 *   node smtpTest.js
 *
 * This sends a REAL test email to your Gmail inbox (or spam folder).
 * Check BOTH Inbox AND Spam/Junk after running.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true });
const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS
  ? process.env.EMAIL_PASS.replace(/\s+/g, '')
  : '';

console.log('\n╔══════════════════════════════════════════╗');
console.log('║    SHAADISAATHI SMTP DIAGNOSTIC v2       ║');
console.log('╚══════════════════════════════════════════╝\n');
console.log(`  EMAIL_USER  : ${EMAIL_USER  || '❌ NOT SET'}`);
console.log(`  EMAIL_PASS  : ${EMAIL_PASS  ? `✅ ${EMAIL_PASS.length} chars` : '❌ NOT SET'}`);
console.log(`  NODE_ENV    : ${process.env.NODE_ENV || 'NOT SET'}`);
console.log(`  CLIENT_URL  : ${process.env.CLIENT_URL || 'NOT SET'}`);
console.log('');

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('❌  FATAL: EMAIL_USER or EMAIL_PASS is missing in .env');
  process.exit(1);
}

if (EMAIL_PASS.length !== 16) {
  console.warn(`⚠️  WARNING: App Password should be exactly 16 chars, yours is ${EMAIL_PASS.length}`);
  console.warn('   Regenerate at: https://myaccount.google.com/apppasswords\n');
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

(async () => {
  // ── Step 1: Verify connection ──────────────────────────────────────────────
  console.log('🔍  Step 1: Testing SMTP connection to smtp.gmail.com:465 ...');
  try {
    await transporter.verify();
    console.log('✅  SMTP connection verified — Gmail accepted the credentials!\n');
  } catch (err) {
    console.error('❌  SMTP connection FAILED!');
    console.error(`    Error code    : ${err.code || 'N/A'}`);
    console.error(`    Error message : ${err.message}`);

    if (err.message.includes('535') || err.message.includes('Username and Password')) {
      console.error('\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('  ROOT CAUSE: Gmail rejected the App Password');
      console.error('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.error('  HOW TO FIX (follow exactly):');
      console.error('  1. Open: https://myaccount.google.com/security');
      console.error(`  2. Sign in as: ${EMAIL_USER}`);
      console.error('  3. Turn ON "2-Step Verification" (required for App Passwords)');
      console.error('  4. Open: https://myaccount.google.com/apppasswords');
      console.error('  5. Click "Select app" → choose "Mail"');
      console.error('  6. Click "Select device" → choose "Other (Custom name)" → type "ShaadiSaathi"');
      console.error('  7. Click GENERATE — copy the 16-character code (ignore the spaces)');
      console.error(`  8. In server/.env, set: EMAIL_PASS=<paste 16 chars WITHOUT spaces>`);
      console.error('  9. Save .env and re-run: node smtpTest.js');
    }
    process.exit(1);
  }

  // ── Step 2: Send test email ────────────────────────────────────────────────
  console.log(`📨  Step 2: Sending test email to ${EMAIL_USER} ...`);
  try {
    const info = await transporter.sendMail({
      from: `"ShaadiSaathi Test" <${EMAIL_USER}>`,
      to: EMAIL_USER,
      subject: `✅ ShaadiSaathi SMTP Test — ${new Date().toLocaleTimeString('en-IN')}`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
          <div style="background:linear-gradient(135deg,#c41e6b,#e91e8c);padding:40px;text-align:center">
            <h1 style="color:white;margin:0;font-size:28px">💒 ShaadiSaathi</h1>
            <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:14px">SMTP Diagnostic Test</p>
          </div>
          <div style="padding:40px">
            <h2 style="color:#27ae60;margin:0 0 12px">✅ Gmail SMTP is Working!</h2>
            <p style="color:#555">Your Nodemailer + Google App Password setup is correct. All ShaadiSaathi email flows will now work.</p>
            <table style="width:100%;margin-top:24px;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#999;font-size:13px">Time</td>       <td style="color:#333;font-weight:700">${new Date().toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding:8px 0;color:#999;font-size:13px">Environment</td><td style="color:#333;font-weight:700">${process.env.NODE_ENV}</td></tr>
              <tr><td style="padding:8px 0;color:#999;font-size:13px">Gmail</td>      <td style="color:#333;font-weight:700">${EMAIL_USER}</td></tr>
            </table>
            <p style="color:#e74c3c;font-size:13px;margin-top:24px;background:#fff5f5;padding:12px;border-radius:8px;border-left:4px solid #e74c3c">
              <strong>⚠️ Check Spam/Junk too!</strong> First-time emails from a new Gmail App Password often land in Spam. Mark as "Not Spam" to fix for future emails.
            </p>
          </div>
          <div style="background:#fafafa;padding:20px;text-align:center;color:#ccc;font-size:12px">© 2024 ShaadiSaathi</div>
        </div>`,
    });

    console.log('\n🎉  SUCCESS! Email dispatched by Gmail.');
    console.log(`    Message ID  : ${info.messageId}`);
    console.log(`    Recipient   : ${EMAIL_USER}`);
    console.log('\n  ── NEXT STEPS ──────────────────────────────────────────');
    console.log('  1. Open Gmail: https://mail.google.com');
    console.log(`  2. Look in INBOX for subject: "ShaadiSaathi SMTP Test"`);
    console.log('  3. If NOT in inbox → check SPAM / JUNK folder');
    console.log('  4. If found in Spam → click "Not Spam" button');
    console.log('       This trains Gmail to trust future ShaadiSaathi emails');
    console.log('  ────────────────────────────────────────────────────────\n');
  } catch (err) {
    console.error('❌  Email send FAILED:', err.message);
    process.exit(1);
  }
})();
