const sendEmail = require("../utils/sendEmail");

module.exports.submitContact = async (req, res) => {
  try {
    console.log("BODY DATA:", req.body); // 👈 ye add karo
    const { name, email, phone, subject, message } = req.body;

    const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2>📩 New Contact Form Submission</h2>
    <hr/>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || "Not Provided"}</p>
    <p><strong>Subject:</strong> ${subject || "Not Provided"}</p>
    <p><strong>Message:</strong></p>
    <p style="background:#f4f4f4;padding:10px;border-radius:5px;">
      ${message}
    </p>
  </div>
`;


    await sendEmail({
      subject: subject || "New Contact Form Message",
      html,
      replyTo: email,
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (err) {
    console.error("EMAIL ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Email sending failed",
    });
  }
};
    