const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'n4narendrakr@gmail.com',
    pass: 'dnheoavebqjohhrc'
  }
});

transporter.verify((error) => {
  if (error) {
    console.error('SMTP test failed:', error);
  } else {
    console.log('SMTP test succeeded! Connection verified.');
  }
  process.exit(0);
});
