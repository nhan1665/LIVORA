const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: [true, 'Họ và tên người liên hệ là bắt buộc.'],
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc.'],
      trim: true,
    },
    subject: {
      type: String,
      default: 'Tư vấn sản phẩm & dịch vụ',
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Nội dung yêu cầu là bắt buộc.'],
      trim: true,
    },
    customerContext: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['new', 'processing', 'resolved'],
      default: 'new',
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'Contacts',
  }
);

contactSchema.index({ status: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema, 'Contacts');
