require('dotenv').config();
const { sendEmail } = require('./services/emailService');

async function testBrevo() {
  console.log('Testing Brevo Integration...');
  
  if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY is missing from .env');
    process.exit(1);
  }

  const toEmail = process.env.EMAIL_FROM || 'support@shaadisaathi.com';

  try {
    const info = await sendEmail({
      to: toEmail,
      subject: 'Brevo API Integration Test - ShaadiSaathi',
      html: `
        <div style="font-family:sans-serif;padding:20px;border:1px solid #ddd;border-radius:8px;">
          <h2 style="color:#22c55e;">Brevo Test Successful! ✅</h2>
          <p>If you are reading this email, the Brevo Transactional API is working perfectly.</p>
          <p><b>Time:</b> ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log('✅ Success! Email sent successfully.');
    console.log('Message ID:', info.messageId);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send email via Brevo:');
    console.error(error.message);
    process.exit(1);
  }
}

testBrevo();
