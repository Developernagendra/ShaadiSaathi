require('dotenv').config();

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testMail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'SMTP TEST',
      html: '<h1>SMTP WORKING</h1>',
    });

    console.log('EMAIL SENT:', info.messageId);
  } catch (error) {
    console.error('SMTP FAILED:', error);
  }
}

testMail();
