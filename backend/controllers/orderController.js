const orderModel = require("../models/order-model");
const userModel = require("../models/user-model");
const productModel = require("../models/product-model");
const PDFDocument = require("pdfkit");

const {
  sendOrderPlacedEmail,
  sendDeliveryAssignedEmail,
  sendOrderDeliveredEmail,
  sendReturnRequestedEmail,
  sendReturnApprovedEmail,
  sendRefundProcessedEmail,
  sendOrderCancelledEmail,
} = require("../utils/orderEmails");

// Return Policy Settings (in-memory, could be moved to DB)
let returnPolicySettings = {
  returnDays: 7, // Default 7 days
};

/**
 * Create new order
 */
const createOrder = async (req, res) => {
  const {
    productId,
    quantity,
    size,
    addressLine,
    area,
    city,
    state,
    pincode,
    deliveryPhone,
    paymentType,
    paymentMethod,
    paymentId,
    paymentAmount,
    paymentStatus,
    paymentVerified,
  } = req.body;

  try {
    const user = await userModel.findById(req.user.userid);
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!addressLine || String(addressLine).trim().length < 5) {
      return res.status(400).json({ message: "Address is required" });
    }
    if (!city || String(city).trim().length < 2) {
      return res.status(400).json({ message: "City is required" });
    }
    if (!state || String(state).trim().length < 2) {
      return res.status(400).json({ message: "State is required" });
    }
    if (!pincode || String(pincode).trim().length < 4) {
      return res.status(400).json({ message: "Pincode is required" });
    }
    if (!deliveryPhone || String(deliveryPhone).trim().length < 6) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const fullAddress = [
      String(addressLine).trim(),
      area ? String(area).trim() : "",
      String(city).trim(),
      String(state).trim(),
      String(pincode).trim(),
    ]
      .filter(Boolean)
      .join(", ");

    const newOrder = await orderModel.create({
      productId,
      quantity,
      size: size || "",
      status: "Pending",
      userId: req.user.userid,
      addressLine: String(addressLine).trim(),
      area: area ? String(area).trim() : "",
      city: String(city).trim(),
      state: String(state).trim(),
      pincode: String(pincode).trim(),
      deliveryAddress: fullAddress,
      deliveryPhone: String(deliveryPhone).trim(),
      paymentType: paymentType || "Cash on Delivery",
      paymentMethod: paymentMethod || "Cash",
      paymentId: paymentId || "",
      paymentAmount: paymentAmount || 0,
      paymentStatus:
        paymentStatus || (paymentType === "Online" ? "Paid" : "Pending"),
      paymentVerified: paymentVerified || false,
    });

    user.orders.push(newOrder._id);
    await user.save();

    // ✅ Email: Order Placed (fail ho to order fail nahi hoga)
    try {
      const populated = await orderModel
        .findById(newOrder._id)
        .populate("userId", "name email")
        .populate("productId", "name price");

      await sendOrderPlacedEmail({
        to: populated.userId.email,
        userName: populated.userId.name,
        orderId: populated._id.toString(),
        productName: populated.productId?.name,
        qty: populated.quantity,
        amount:
          populated.paymentAmount ||
          populated.productId.price * populated.quantity,
        paymentType: populated.paymentType,
      });
    } catch (e) {
      console.log("Order placed email failed (ignored):", e.message);
    }

    res
      .status(200)
      .json({ message: "Order placed successfully", orderId: newOrder._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const order = await orderModel
      .findById(req.params.id)
      .populate("productId")
      .populate("userId");

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.userId._id.toString() !== req.user.userid.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.status !== "Delivered") {
      return res
        .status(400)
        .json({ message: "Invoice available only for delivered orders" });
    }

    const doc = new PDFDocument({ margin: 0 });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`,
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    const total = order.productId.price * order.quantity;

    doc.rect(0, 0, 612, 130).fill("#4F46E5");

    doc.fillColor("white").fontSize(28).text("ShopEase", 50, 45);

    doc.fontSize(12).text("Premium Shopping Platform", 50, 80);

    doc.fontSize(22).text("INVOICE", 450, 55);

    let y = 160;

    doc.fillColor("#111827")
      .fontSize(12)
      .text(`Invoice No: INV-${order._id.toString().slice(-6)}`, 50, y)
      .text(`Order ID: ${order._id}`, 50, y + 18)
      .text(`Order Date: ${new Date(order.createdAt).toDateString()}`, 50, y + 36);

    y += 80;

    doc.roundedRect(50, y, 512, 100, 8).fill("#EEF2FF");

    doc.fillColor("#1E3A8A").fontSize(14).text("Customer Details", 65, y + 12);

    doc.fillColor("#111827")
      .fontSize(11)
      .text(`Name: ${order.userId.name}`, 65, y + 35)
      .text(`Email: ${order.userId.email}`, 65, y + 50)
      .text(`Mobile: ${order.deliveryPhone || "N/A"}`, 65, y + 65)
      .text(`Address: ${order.deliveryAddress || "N/A"}`, 65, y + 80);

    y += 140;

    doc.roundedRect(50, y, 512, 35, 6).fill("#1E40AF");

    doc.fillColor("white")
      .fontSize(11)
      .text("Item", 65, y + 10)
      .text("Qty", 350, y + 10)
      .text("Price", 420, y + 10)
      .text("Total", 500, y + 10);

    y += 45;

    doc.fillColor("#111827")
      .fontSize(11)
      .text(order.productId.name, 65, y)
      .text(order.quantity.toString(), 360, y)
      .text(`₹${order.productId.price}`, 420, y)
      .text(`₹${total}`, 500, y);

    y += 60;

    doc.roundedRect(300, y, 262, 70, 8).fill("#E0E7FF");

    doc.fillColor("#111827").fontSize(12).text("Grand Total", 315, y + 15);

    doc.fillColor("#4F46E5").fontSize(20).text(`₹${total}`, 315, y + 35);

    y += 110;

    doc.roundedRect(50, y, 512, 70, 8).fill("#F3F4F6");

    doc.fillColor("#111827").fontSize(12).text("Payment Information", 65, y + 10);

    doc
      .fontSize(11)
      .text(`Method: ${order.paymentType}`, 65, y + 30)
      .text(`Status: ${order.paymentStatus}`, 65, y + 45);

    doc.rect(0, 760, 612, 40).fill("#4F46E5");

    doc.fillColor("white").fontSize(9).text(
      "ShopEase Pvt Ltd | support@shopease.com | +91 98765 43210 | www.shopease.com",
      0,
      775,
      { align: "center" },
    );

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔥 AUTO CANCEL FUNCTION
const autoCancelOrders = async () => {
  try {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    await orderModel.updateMany(
      {
        status: "Pending",
        deliveryPartnerName: "",
        createdAt: { $lt: fiveDaysAgo },
      },
      {
        $set: {
          status: "Cancelled",
          cancelledAt: new Date(),
        },
      },
    );

    console.log("Auto cancel check executed");
  } catch (err) {
    console.error("Auto cancel error:", err);
  }
};

/**
 * Get user's orders
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ userId: req.user.userid })
      .populate("productId", "name price image description")
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map((order) => {
      const orderObj = order.toObject();
      if (orderObj.productId && orderObj.productId.image) {
        orderObj.productId.image = orderObj.productId.image.toString("base64");
      }
      return orderObj;
    });

    res.status(200).json(formattedOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get all orders (Admin)
 */
const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .populate("productId", "name price")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update order status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;

    // If Delivered
    if (status === "Delivered") {
      order.deliveredDate = new Date();
      order.estimatedDelivery = new Date();

      if (order.paymentType === "Cash on Delivery") {
        order.paymentStatus = "Paid";
        order.paymentVerified = true;
        order.paymentVerifiedAt = new Date();
      }
    }

    await order.save();

    const populated = await orderModel
      .findById(order._id)
      .populate("productId", "name price")
      .populate("userId", "name email");

    // ✅ Email: Delivered
    try {
      if (status === "Delivered") {
        await sendOrderDeliveredEmail({
          to: populated.userId.email,
          userName: populated.userId.name,
          orderId: populated._id.toString(),
          productName: populated.productId?.name,
        });
      }
    } catch (e) {
      console.log("Delivered email failed (ignored):", e.message);
    }

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Assign delivery partner to order
 */
const assignDelivery = async (req, res) => {
  try {
    const { deliveryPartnerName, deliveryPartnerPhone, estimatedDelivery } =
      req.body;

    if (!deliveryPartnerName || String(deliveryPartnerName).trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Delivery partner name is required" });
    }
    if (!deliveryPartnerPhone || String(deliveryPartnerPhone).trim().length < 6) {
      return res
        .status(400)
        .json({ message: "Delivery partner phone is required" });
    }

    const trackingId = `TRK-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;
    const defaultEstimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const estimatedDeliveryDate = estimatedDelivery ? new Date(estimatedDelivery) : null;

    if (estimatedDeliveryDate) {
      if (isNaN(estimatedDeliveryDate.getTime())) {
        return res.status(400).json({ message: "Invalid estimated delivery date" });
      }
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      if (estimatedDeliveryDate < startOfToday) {
        return res.status(400).json({ message: "Estimated delivery date cannot be in the past" });
      }
    }

    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "Accepted" && order.status !== "Assigned") {
      return res
        .status(400)
        .json({ message: "Order must be Accepted before assigning delivery" });
    }

    order.deliveryPartnerName = String(deliveryPartnerName).trim();
    order.deliveryPartnerPhone = String(deliveryPartnerPhone).trim();
    order.trackingId = order.trackingId || trackingId;

    if (!order.estimatedDelivery) {
      order.estimatedDelivery =
        estimatedDeliveryDate && !isNaN(estimatedDeliveryDate.getTime())
          ? estimatedDeliveryDate
          : defaultEstimatedDelivery;
    }

    if (order.status === "Accepted") order.status = "Assigned";

    await order.save();

    const populated = await orderModel
      .findById(order._id)
      .populate("productId", "name price")
      .populate("userId", "name email");

    // ✅ Email: Delivery Assigned
    try {
      await sendDeliveryAssignedEmail({
        to: populated.userId.email,
        userName: populated.userId.name,
        orderId: populated._id.toString(),
        partnerName: populated.deliveryPartnerName,
        partnerPhone: populated.deliveryPartnerPhone,
        trackingId: populated.trackingId,
        estimatedDelivery: populated.estimatedDelivery,
      });
    } catch (e) {
      console.log("Delivery assigned email failed (ignored):", e.message);
    }

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Request return for order
 */
const requestReturn = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || String(reason).trim().length < 10) {
      return res.status(400).json({ message: "Return reason must be at least 10 characters" });
    }

    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.userId.toString() !== req.user.userid.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ message: "Only delivered orders can be returned" });
    }

    if (order.returnStatus !== "None") {
      return res.status(400).json({ message: "Return already requested or processed" });
    }

    if (!order.deliveredDate) {
      return res.status(400).json({ message: "Order delivery date not found" });
    }

    const deliveredDate = new Date(order.deliveredDate);
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceDelivery > returnPolicySettings.returnDays) {
      return res.status(400).json({
        message: `Return period expired. You can only return within ${returnPolicySettings.returnDays} days of delivery.`,
      });
    }

    order.returnStatus = "Requested";
    order.returnReason = String(reason).trim();
    order.returnRequestDate = new Date();
    await order.save();

    const populated = await orderModel
      .findById(order._id)
      .populate("productId", "name price")
      .populate("userId", "name email");

    // ✅ Email: Return Requested
    try {
      await sendReturnRequestedEmail({
        to: populated.userId.email,
        userName: populated.userId.name,
        orderId: populated._id.toString(),
        reason: populated.returnReason,
      });
    } catch (e) {
      console.log("Return requested email failed (ignored):", e.message);
    }

    res.json({ message: "Return request submitted successfully", order: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update return status (Admin)
 */
const updateReturnStatus = async (req, res) => {
  try {
    const { returnStatus } = req.body;

    if (!["Approved", "Rejected", "Completed"].includes(returnStatus)) {
      return res.status(400).json({
        message: "Invalid return status. Must be Approved, Rejected, or Completed",
      });
    }

    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // ✅ APPROVE / REJECT only if Requested
    if (returnStatus === "Approved" || returnStatus === "Rejected") {
      if (order.returnStatus !== "Requested") {
        return res.status(400).json({ message: "Order return is not in requested status" });
      }
    }

    // ✅ COMPLETE only if Approved
    if (returnStatus === "Completed") {
      if (order.returnStatus !== "Approved") {
        return res.status(400).json({ message: "Only approved returns can be marked as completed" });
      }

      // 🔥 AUTO REFUND
      if (order.paymentStatus === "Paid") {
        order.paymentStatus = "Refunded";
        order.paymentVerified = true;
        order.paymentVerifiedAt = new Date();
      }
    }

    order.returnStatus = returnStatus;

    if (returnStatus === "Approved") {
      order.returnApprovedDate = new Date();
    }

    await order.save();

    const populated = await orderModel
      .findById(order._id)
      .populate("productId", "name price")
      .populate("userId", "name email");

    // ✅ Email: Return Approved / Refund
    try {
      if (returnStatus === "Approved") {
        await sendReturnApprovedEmail({
          to: populated.userId.email,
          userName: populated.userId.name,
          orderId: populated._id.toString(),
        });
      }

      if (returnStatus === "Completed" && populated.paymentStatus === "Refunded") {
        await sendRefundProcessedEmail({
          to: populated.userId.email,
          userName: populated.userId.name,
          orderId: populated._id.toString(),
        });
      }
    } catch (e) {
      console.log("Return/refund email failed (ignored):", e.message);
    }

    res.json({
      message: `Return ${returnStatus.toLowerCase()} successfully`,
      order: populated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Verify payment (Admin)
 */
const verifyPayment = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    if (!["Paid", "Failed"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status. Must be Paid or Failed" });
    }

    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = paymentStatus;
    order.paymentVerified = true;
    order.paymentVerifiedAt = new Date();
    await order.save();

    const populated = await orderModel
      .findById(order._id)
      .populate("productId", "name price")
      .populate("userId", "name email");

    // ✅ NOTE: verifyPayment pe cancel email nahi jaayega. (yahi sahi fix)

    res.json({
      message: `Payment ${paymentStatus.toLowerCase()} verified successfully`,
      order: populated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get return policy
 */
const getReturnPolicy = async (req, res) => {
  try {
    res.json(returnPolicySettings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update return policy (Admin)
 */
const updateReturnPolicy = async (req, res) => {
  try {
    const { returnDays } = req.body;
    if (!returnDays || returnDays < 1 || returnDays > 365) {
      return res.status(400).json({ message: "Return days must be between 1 and 365" });
    }
    returnPolicySettings.returnDays = parseInt(returnDays);
    res.json({ message: "Return policy updated successfully", returnPolicy: returnPolicySettings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔥 CANCEL ORDER (USER)
const cancelOrder = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.userId.toString() !== req.user.userid.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Order already cancelled" });
    }

    if (order.deliveryPartnerName) {
      return res.status(400).json({ message: "Order already assigned. Cannot cancel." });
    }

    if (!["Pending", "Accepted"].includes(order.status)) {
      return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
    }

    order.status = "Cancelled";
    order.cancelledAt = new Date();

    if (order.paymentType === "Online" && order.paymentStatus === "Paid") {
      order.paymentStatus = "Refunded";
    }

    await order.save();

    // ✅ Email: Order Cancelled
    try {
      const populated = await orderModel
        .findById(order._id)
        .populate("userId", "name email")
        .populate("productId", "name price");

      await sendOrderCancelledEmail({
        to: populated.userId.email,
        userName: populated.userId.name,
        orderId: populated._id.toString(),
        productName: populated.productId?.name,
      });
    } catch (e) {
      console.log("Cancel email failed (ignored):", e.message);
    }

    res.json({ message: "Order cancelled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Run every 1 hour
setInterval(autoCancelOrders, 60 * 60 * 1000);

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  assignDelivery,
  requestReturn,
  updateReturnStatus,
  verifyPayment,
  getReturnPolicy,
  updateReturnPolicy,
  returnPolicySettings,
  cancelOrder,
  downloadInvoice,
};
