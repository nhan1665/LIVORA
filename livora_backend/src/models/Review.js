const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'ID sản phẩm là bắt buộc.'],
    },
    productName: {
      type: String,
      default: '',
    },
    productSku: {
      type: String,
      default: '',
    },
    productThumbnail: {
      type: String,
      default: '',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    customerName: {
      type: String,
      required: [true, 'Tên khách hàng là bắt buộc.'],
      trim: true,
    },
    customerPhone: {
      type: String,
      default: '',
    },
    customerContext: {
      type: String,
      default: '',
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Đánh giá số sao là bắt buộc.'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Nội dung nhận xét là bắt buộc.'],
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['visible', 'hidden'],
      default: 'visible',
    },
    hiddenReason: {
      type: String,
      default: '',
    },
    moderatedBy: {
      type: String,
      default: '',
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'Reviews',
  }
);

reviewSchema.index({ productId: 1, status: 1 });
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ status: 1 });

module.exports = mongoose.model('Review', reviewSchema, 'Reviews');
