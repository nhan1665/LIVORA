const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  sku: { type: String, default: '' },
  productName: { type: String, required: true },
  color: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true },
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' },
  actor: { type: String, default: 'Hệ thống' },
});

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: [true, 'Mã đơn hàng là bắt buộc.'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    customerInfo: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: '' },
      address: { type: String, required: true },
    },
    items: [orderItemSchema],
    subtotalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    voucherCode: {
      type: String,
      default: '',
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'VNPAY', 'MOMO', 'BANK_TRANSFER'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'failed'],
      default: 'unpaid',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shippingAddress: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
    cancelReason: {
      type: String,
      default: '',
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
    collection: 'Orders',
  }
);

orderSchema.index({ userId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema, 'Orders');

