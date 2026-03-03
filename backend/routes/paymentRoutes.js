const express = require("express");
const router = express.Router();

const { createOrder, verifyPayment } = require("../controllers/paymentController");

// ✅ Send Razorpay Key to Frontend
router.get("/api/payment/get-key", (req, res) => {
  res.json({ success: true, key: process.env.RAZORPAY_KEY_ID });
});

// ✅ Create Order
router.post("/api/payment/create-order", createOrder);

// ✅ Verify Payment
router.post("/api/payment/verify", verifyPayment);

module.exports = router;
