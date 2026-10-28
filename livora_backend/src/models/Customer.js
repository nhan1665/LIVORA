const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    addressId: { type: String, default: () => 'addr-' + Date.now() },
    recipientName: { type: String, default: '' },
    recipientPhone: { type: String, default: '' },
    street: { type: String, default: '' },
    ward: { type: String, default: '' },
    district: { type: String, default: '' },
    province: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
    label: { type: String, default: 'Nhà riêng' },
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    addressLine: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc.'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    passwordHash: {
      type: String,
      default: '$2a$10$w09ZJq4y7T4i7O8WpWzV0eK8Q3W9f2kXgY6A5B4C3D2E1F0G1H2I3',
    },
    customerType: {
      type: String,
      enum: ['registered', 'guest'],
      default: 'registered',
    },
    status: {
      type: String,
      enum: ['active', 'locked', 'inactive'],
      default: 'active',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    birthDate: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['Nam', 'Nữ', 'Khác', 'male', 'female', 'other', ''],
      default: '',
    },
    addresses: [addressSchema],
    accumulatedSpent: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'Customers',
  }
);

customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ code: 1 });

module.exports = mongoose.model('Customer', customerSchema, 'Customers');
