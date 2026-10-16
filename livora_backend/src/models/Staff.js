const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    username: {
      type: String,
      required: [true, 'Tên đăng nhập là bắt buộc.'],
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Họ và tên nhân viên là bắt buộc.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email nhân viên là bắt buộc.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc.'],
    },
    role: {
      type: String,
      enum: ['super_admin', 'content_staff', 'ops_staff', 'cskh', 'accountant'],
      default: 'ops_staff',
    },
    permissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
    avatar: {
      type: String,
      default: '',
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'Staffs',
  }
);

module.exports = mongoose.model('Staff', staffSchema, 'Staffs');

