const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    productId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true 
    },

    userId: {  
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },

    quantity: { 
      type: Number,
      default: 1,
      required: true 
    },

    size: { type: String, default: "" },

    status: { 
      type: String,
      default: "Pending"
    },

    addressLine: { type: String, default: "" },
    area: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },

    deliveryAddress: { type: String, default: "" },
    deliveryPhone: { type: String, default: "" },

    deliveryPartnerName: { type: String, default: "" },
    deliveryPartnerPhone: { type: String, default: "" },

    trackingId: { type: String, default: "" },
    estimatedDelivery: { type: Date },
    deliveredDate: { type: Date },

    returnStatus: { 
      type: String,
      enum: ["None", "Requested", "Approved", "Rejected", "Completed"],
      default: "None"
    },

    returnReason: { type: String, default: "" },
    returnRequestDate: { type: Date },
    returnApprovedDate: { type: Date },

    paymentType: { 
      type: String,
      enum: ["Online", "Cash on Delivery"],
      default: "Cash on Delivery"
    },

    paymentMethod: { 
      type: String,
      enum: ["Cash", "UPI", "GPay", "Card", "QR", "PhonePe", "Paytm", "Razorpay"],
      default: "Cash"
    },

    paymentStatus: { 
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending"
    },

    paymentId: { type: String, default: "" },
    paymentVerified: { type: Boolean, default: false },
    paymentVerifiedAt: { type: Date },
    paymentAmount: { type: Number, default: 0 },

    cancelledAt: { type: Date }

  },
  { timestamps: true } // 🔥🔥🔥 THIS LINE IS IMPORTANT
);


module.exports= mongoose.model("order",orderSchema);