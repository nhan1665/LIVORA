const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: { type: String, default: null },
    productName: { type: String, required: true },
    selectedColor: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    customerInfo: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: null },
      address: { type: String, required: true },
      province: { type: String, default: null },
      district: { type: String, default: null },
      ward: { type: String, default: null },
    },
    items: {
      type: [orderItemSchema],
      validate: [v => Array.isArray(v) && v.length > 0, 'Đơn hàng phải có ít nhất 1 sản phẩm.'],
    },
    voucherCode: { type: String, default: null },
    voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
    subtotalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    shippingConfigId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipping', default: null },
    shippingMethod: { type: String, default: null },
    shippingProvince: { type: String, default: null },
    checkoutRequestHash: { type: String, default: null },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cod', 'bank_transfer', 'online'],
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'],
      default: 'pending',
    },
    cancelReason: { type: String, default: null },
    notes: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: 'Orders',
  }
);

orderSchema.index({ customerId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema, 'Orders');
