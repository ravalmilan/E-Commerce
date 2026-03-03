const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  reviewImages: [{ type: String }], // Base64 encoded images
  createdAt: { type: Date, default: Date.now },
});

const sizeSchema = new mongoose.Schema({
  size: { type: String, required: true }, // e.g., "S", "M", "L", "XL", "10", "11", etc.
  available: { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema({
  name: String,
  image: Buffer,
  images: [Buffer],
  description: String,
  price: Number,
  category: {
    type: String,
    default: "Self"
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  discount: {
    type: Number,
    default: 0
  },

  sizes: [sizeSchema], // 👈 size products

  isOutOfStock: {      // 👈 ADD THIS (simple products)
    type: Boolean,
    default: false
  },

  createdAt: { type: Date, default: Date.now },
  reviews: [reviewSchema],
});


module.exports= mongoose.model("product",productSchema);