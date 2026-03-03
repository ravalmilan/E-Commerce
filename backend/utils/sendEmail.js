const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  authMethod: "LOGIN", // 🔥 THIS FIXES PLAIN ERROR
});

module.exports = async function sendEmail({ subject, html, replyTo }) {
  return transporter.sendMail({
    from: `"Contact Form" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject,
    html,
    replyTo,
  });
};
