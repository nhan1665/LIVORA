const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã nhân viên là bắt buộc.'],
      unique: true,
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
      default: '',
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
      default: 'Admin',
    },
  },
  {
    timestamps: true,
    collection: 'Employees',
  }
);

module.exports = mongoose.model('Employee', employeeSchema, 'Employees');
