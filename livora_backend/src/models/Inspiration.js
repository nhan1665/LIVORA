const mongoose = require('mongoose');

const taggedProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    xPercent: {
      type: Number,
      required: true,
      default: 50,
      min: 0,
      max: 100,
    },
    yPercent: {
      type: Number,
      required: true,
      default: 50,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const inspirationSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề cảm hứng là bắt buộc.'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug là bắt buộc.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    style: {
      type: String,
      default: 'Hiện đại',
      trim: true,
    },
    thumbnail: {
      type: String,
      required: [true, 'Ảnh đại diện cảm hứng là bắt buộc.'],
    },
    content: {
      type: String,
      default: '',
    },
    taggedProducts: [taggedProductSchema],
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['published', 'hidden'],
      default: 'published',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {

    timestamps: true,
    collection: 'Inspirations',
  }
);

inspirationSchema.index({ roomId: 1, status: 1 });

module.exports = mongoose.model('Inspiration', inspirationSchema, 'Inspirations');

