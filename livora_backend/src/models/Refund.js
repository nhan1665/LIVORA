const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'ID đơn hàng là bắt buộc.'],
    },
    orderCode: {
      type: String,
      required: [true, 'Mã đơn hàng là bắt buộc.'],
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    customerName: {
      type: String,
      default: '',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Số tiền hoàn là bắt buộc.'],
      min: [0, 'Số tiền hoàn phải lớn hơn hoặc bằng 0.'],
    },
    reason: {
      type: String,
      required: [true, 'Lý do hoàn tiền là bắt buộc.'],
      trim: true,
    },
    refundType: {
      type: String,
      enum: ['full', 'partial'],
      default: 'full',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'pending',
    },
    rejectReason: {
      type: String,
      default: '',
    },
    processedBy: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'Refunds',
  }
);

refundSchema.index({ orderId: 1 });
refundSchema.index({ status: 1 });

module.exports = mongoose.model('Refund', refundSchema, 'Refunds');
