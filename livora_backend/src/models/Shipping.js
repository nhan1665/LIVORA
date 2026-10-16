const mongoose = require('mongoose');

const shippingSchema = new mongoose.Schema(
  {
    shippingMethod: {
      type: String,
      enum: ['standard', 'express'],
      required: [true, 'Phương thức vận chuyển là bắt buộc.'],
    },
    province: {
      type: String,
      required: [true, 'Tỉnh / Thành phố áp dụng là bắt buộc.'],
      trim: true,
    },
    fee: {
      type: Number,
      required: [true, 'Cước phí vận chuyển là bắt buộc.'],
      min: [0, 'Cước phí không được âm.'],
    },
    estimatedDeliveryTime: {
      type: String,
      required: [true, 'Thời gian giao hàng dự kiến là bắt buộc.'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    hub: {
      type: String,
      default: '',
    },
    feeNote: {
      type: String,
      default: '',
    },
    freeShipEnabled: {
      type: Boolean,
      default: false,
    },
    freeShipThreshold: {
      type: Number,
      default: 0,
    },
    timeSlot: {
      type: String,
      default: 'Giờ hành chính (8h00 - 18h00)',
    },
    whiteGloveIncluded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'Shipping',
  }
);

shippingSchema.index({ shippingMethod: 1, province: 1 });
shippingSchema.index({ isActive: 1 });

module.exports = mongoose.model('Shipping', shippingSchema, 'Shipping');
