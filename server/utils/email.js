const nodemailer = require('nodemailer');

const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.EMAIL_PORT || '587', 10);
const secure = port === 465;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify SMTP connection on startup (Silent unless failure, since config/email already logs)
transporter.verify()
  .then(() => {}) // handled by config/email.js
  .catch((err) => {
    // Only log if it's not already being logged by config/email.js
    // Actually, config/email.js will log it, so let's keep this minimal
  });

const sendEmail = async (options) => {
  const mailOptions = {
    from: `ShaadiSaathi <${process.env.EMAIL_FROM || 'hello@shaadisaathi.com'}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
    text: options.text
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error(`Failed to send email to ${options.email}: ${error.message}`);
  }
};

const getWelcomeEmailHTML = (email) => {
  const unsubscribeUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/unsubscribe?email=${encodeURIComponent(email)}`;
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FAFAFA; border-radius: 12px; border: 1px solid #EAEAEA;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #C2185B; margin-bottom: 0;">ShaadiSaathi 💍</h1>
        <p style="color: #D4AF37; font-weight: bold; font-style: italic; letter-spacing: 2px;">Your Wedding, Perfected</p>
      </div>
      
      <div style="background-color: #FFFFFF; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <h2 style="color: #333333; margin-top: 0; font-size: 24px;">Welcome to ShaadiSaathi!</h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
          Thank you for subscribing to our newsletter! We are thrilled to be part of your wedding journey.
        </p>
        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
          Expect to receive:
          <ul style="color: #666666; font-size: 16px; line-height: 1.6;">
            <li>Exclusive wedding planning tips</li>
            <li>Premium vendor offers and discounts</li>
            <li>Latest trends in Indian weddings</li>
            <li>Inspiration for your Baraat, Decor, and Photography</li>
          </ul>
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/services" style="background-color: #C2185B; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: bold; display: inline-block;">Explore Vendors</a>
        </div>
        
        <p style="color: #999999; font-size: 14px; text-align: center; margin-bottom: 0;">
          Planning made simple. Let's make it grand.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #999999; font-size: 12px;">
          You are receiving this email because you opted in via our website.<br>
          <a href="${unsubscribeUrl}" style="color: #999999; text-decoration: underline;">Unsubscribe from this list</a>
        </p>
      </div>
    </div>
  `;
};

const getCampaignEmailHTML = (email, subject, content, bannerUrl) => {
  const unsubscribeUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/unsubscribe?email=${encodeURIComponent(email)}`;
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FAFAFA; border-radius: 12px; border: 1px solid #EAEAEA;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #C2185B; margin-bottom: 0;">ShaadiSaathi 💍</h1>
      </div>
      
      <div style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        ${bannerUrl ? `<img src="${bannerUrl}" alt="Campaign Banner" style="width: 100%; height: auto; display: block;" />` : ''}
        
        <div style="padding: 40px;">
          <h2 style="color: #333333; margin-top: 0; font-size: 24px;">${subject}</h2>
          
          <div style="color: #555555; font-size: 16px; line-height: 1.6;">
            ${content}
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background-color: #D4AF37; color: #111111; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: bold; display: inline-block;">Visit ShaadiSaathi</a>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #999999; font-size: 12px;">
          You are receiving this email because you opted in via our website.<br>
          <a href="${unsubscribeUrl}" style="color: #999999; text-decoration: underline;">Unsubscribe from this list</a>
        </p>
      </div>
    </div>
  `;
};

const getPackageUserEmailHTML = (name, packageName) => {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FAFAFA; border-radius: 12px; border: 1px solid #EAEAEA;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #C2185B; margin-bottom: 0;">ShaadiSaathi 💍</h1>
      </div>
      <div style="background-color: #FFFFFF; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <h2 style="color: #333333; margin-top: 0;">Hi ${name},</h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
          Thank you for inquiring about our <strong>${packageName}</strong>! We've successfully received your details.
        </p>
        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
          Our wedding coordination team is currently reviewing your requirements and will reach out to you shortly to discuss availability, customizations, and next steps.
        </p>
        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
          If you need immediate assistance, feel free to reply to this email or contact us via WhatsApp.
        </p>
      </div>
    </div>
  `;
};

const getPackageAdminEmailHTML = (inquiry, pkg) => {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FAFAFA;">
      <h2 style="color: #C2185B;">🚨 New Package Inquiry Received</h2>
      <div style="background-color: #FFFFFF; padding: 20px; border-radius: 8px;">
        <p><strong>Package:</strong> ${pkg.name}</p>
        <p><strong>Name:</strong> ${inquiry.name}</p>
        <p><strong>Phone:</strong> ${inquiry.phone}</p>
        <p><strong>Email:</strong> ${inquiry.email || 'N/A'}</p>
        <p><strong>City:</strong> ${inquiry.city}</p>
        <p><strong>Wedding Date:</strong> ${new Date(inquiry.weddingDate).toLocaleDateString()}</p>
        <p><strong>Guests:</strong> ${inquiry.guestsCount || 'N/A'}</p>
        <p><strong>Requirements:</strong> ${inquiry.specialRequirements || 'None'}</p>
      </div>
    </div>
  `;
};

const verifySMTP = async () => {
  return transporter.verify();
};

module.exports = {
  sendEmail,
  getWelcomeEmailHTML,
  getCampaignEmailHTML,
  getPackageUserEmailHTML,
  getPackageAdminEmailHTML,
  verifySMTP
};
