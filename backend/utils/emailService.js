const nodemailer = require("nodemailer");

// ✅ cache transporter so verify / create again & again na ho
let cachedTransporter = null;

const createTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASSWORD must be set in environment variables",
    );
  }

  const emailUser = process.env.EMAIL_USER.trim();
  const emailPassword = process.env.EMAIL_PASSWORD.trim();

  console.log("Email Config Check:");
  console.log("  EMAIL_USER:", emailUser);
  console.log("  EMAIL_PASSWORD length:", emailPassword.length, "characters");
  console.log("  EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "gmail");

  if (emailPassword.includes(" ")) {
    console.error(
      "WARNING: EMAIL_PASSWORD contains spaces! App Passwords should have no spaces.",
    );
  }

  if (emailPassword.length !== 16) {
    console.warn(
      "WARNING: App Password should be exactly 16 characters. Current length:",
      emailPassword.length,
    );
  }

  const config = {
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: emailUser,           // ✅ use trimmed
      pass: emailPassword,       // ✅ use trimmed
    },
  };

  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
    config.host = process.env.EMAIL_HOST;
    config.port = parseInt(process.env.EMAIL_PORT);
    config.secure = process.env.EMAIL_SECURE === "true";
  }

  cachedTransporter = nodemailer.createTransport(config);
  return cachedTransporter;
};

// ✅ Generic email sender (reusable)
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!to) return { success: false, error: "Recipient email missing" };

    const transporter = createTransporter();

    // ✅ verify only once (optional). If you want super minimal risk keep it.
    // await transporter.verify();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER.trim(),
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);

    let errorMessage = "Failed to send email";
    if (error.code === "EAUTH" || error.responseCode === 535) {
      errorMessage =
        "Gmail authentication failed! Use Gmail App Password (16 chars).";
    } else if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      errorMessage =
        "Failed to connect to email server. Check internet/service settings.";
    } else {
      errorMessage = error.message || errorMessage;
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * ✅ Send OTP email (same behavior, now uses sendEmail)
 */
const sendOTPEmail = async (email, otp, purpose) => {
  const subject =
    purpose === "signup"
      ? "Verify Your Email - OTP Code"
      : "Reset Your Password - OTP Code";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">${subject}</h2>
      <p style="color: #666; font-size: 16px;">
        Your OTP code is: <strong style="font-size: 24px; color: #007bff; letter-spacing: 3px;">${otp}</strong>
      </p>
      <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        If you didn't request this code, please ignore this email.
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject, html: htmlContent });
};

/**
 * ✅ Order / Delivery / Return / Refund mails
 * (simple templates — you can make them prettier later)
 */
const sendOrderPlacedEmail = async ({ to, userName, orderId, total }) => {
  const subject = `Order Placed ✅ (#${orderId.slice(-6).toUpperCase()})`;
  const html = `
    <div style="font-family: Arial; padding: 16px;">
      <h2>Order Placed ✅</h2>
      <p>Hi ${userName || "Customer"}, your order has been placed successfully.</p>
      <p><b>Order ID:</b> ${orderId}</p>
      ${total ? `<p><b>Total:</b> ₹${total}</p>` : ""}
      <p>We will update you when it’s assigned for delivery.</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
};

const sendDeliveryAssignedEmail = async ({
  to,
  userName,
  orderId,
  partnerName,
  partnerPhone,
  estimatedDelivery,
}) => {
  const subject = `Delivery Assigned 🚚 (#${orderId.slice(-6).toUpperCase()})`;
  const html = `
    <div style="font-family: Arial; padding: 16px;">
      <h2>Delivery Assigned 🚚</h2>
      <p>Hi ${userName || "Customer"}, your order delivery has been assigned.</p>
      <p><b>Order ID:</b> ${orderId}</p>
      <p><b>Partner:</b> ${partnerName || "-"}</p>
      <p><b>Phone:</b> ${partnerPhone || "-"}</p>
      <p><b>Estimated Delivery:</b> ${estimatedDelivery || "-"}</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
};

const sendReturnApprovedEmail = async ({ to, userName, orderId }) => {
  const subject = `Return Approved ✅ (#${orderId.slice(-6).toUpperCase()})`;
  const html = `
    <div style="font-family: Arial; padding: 16px;">
      <h2>Return Approved ✅</h2>
      <p>Hi ${userName || "Customer"}, your return request is approved.</p>
      <p><b>Order ID:</b> ${orderId}</p>
      <p>We will share next steps shortly.</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
};

const sendRefundEmail = async ({ to, userName, orderId, amount }) => {
  const subject = `Refund Processed 💰 (#${orderId.slice(-6).toUpperCase()})`;
  const html = `
    <div style="font-family: Arial; padding: 16px;">
      <h2>Refund Processed 💰</h2>
      <p>Hi ${userName || "Customer"}, your refund has been processed.</p>
      <p><b>Order ID:</b> ${orderId}</p>
      ${amount ? `<p><b>Refund Amount:</b> ₹${amount}</p>` : ""}
      <p>If you don’t see it yet, please wait 2-5 business days (bank depends).</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
};

module.exports = {
  sendOTPEmail,
  sendEmail,
  sendOrderPlacedEmail,
  sendDeliveryAssignedEmail,
  sendReturnApprovedEmail,
  sendRefundEmail,
};
