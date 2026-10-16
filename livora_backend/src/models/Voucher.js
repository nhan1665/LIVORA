const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã voucher là bắt buộc.'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]+$/, 'Mã voucher chỉ gồm chữ in hoa, chữ số và dấu gạch ngang.'],
    },
    title: {
      type: String,
      required: [true, 'Tên chương trình ưu đãi là bắt buộc.'],
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount'],
      required: [true, 'Loại giảm giá là bắt buộc.'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Giá trị giảm là bắt buộc.'],
      min: [0.01, 'Giá trị giảm phải lớn hơn 0.'],
    },
    maxDiscountAmount: {
      type: Number,
      default: 0,
    },
    minOrderValue: {
      type: Number,
      required: [true, 'Giá trị đơn hàng tối thiểu là bắt buộc.'],
      min: [1, 'Giá trị đơn hàng tối thiểu phải lớn hơn 0.'],
    },
    quantity: {
      type: Number,
      required: [true, 'Số lượng phát hành là bắt buộc.'],
      min: [1, 'Số lượng phát hành phải lớn hơn 0.'],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    perCustomerLimit: {
      type: Number,
      default: 1,
      min: [1, 'Giới hạn lượt dùng mỗi khách hàng phải lớn hơn 0.'],
    },
    startDate: {
      type: Date,
      required: [true, 'Ngày bắt đầu là bắt buộc.'],
    },
    endDate: {
      type: Date,
      required: [true, 'Ngày kết thúc là bắt buộc.'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'Vouchers', // Exact collection name — prevents Mongoose auto-pluralize
  }
);

// Index for filtering by status + time range
voucherSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Voucher', voucherSchema, 'Vouchers');

