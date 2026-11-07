
const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  // Validate the recipient before sending
  if (!to || typeof to !== "string" || !to.trim()) {
    throw new Error(
      `Email recipient is missing or invalid. Received: ${String(to)}`
    );
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error(
      "Email configuration is missing. Check EMAIL_USER and EMAIL_PASSWORD in .env."
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: `"Pizza Delivery" <${process.env.EMAIL_USER}>`,
    to: to.trim(),
    subject,
    html
  };

  console.log("Sending verification email to:", mailOptions.to);

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
