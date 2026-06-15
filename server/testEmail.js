const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env"), override: true });

const { sendEmail, emailTemplates } = require("./services/emailService");

console.log("Starting email send test...");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

const testMail = async () => {
  try {
    const template = emailTemplates.verification("Test User", "https://shaadi-saathi.vercel.app/verify-email/test-token-123");
    const result = await sendEmail({
      to: "n4nagendrakr22@gmail.com",
      ...template,
    });
    console.log("🚀 Email Test Passed successfully!", result);
  } catch (error) {
    console.error("❌ Email Test Failed!", error);
  }
};

testMail();
