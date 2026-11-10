const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã vai trò là bắt buộc.'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Tên vai trò là bắt buộc.'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    badgeClass: {
      type: String,
      default: 'badge-admin',
    },
    allowedMenus: {
      type: [String],
      default: [],
    },
    allowedRoutes: {
      type: [String],
      default: [],
    },
    useCases: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'Roles',
  }
);

module.exports = mongoose.model('Role', roleSchema, 'Roles');

