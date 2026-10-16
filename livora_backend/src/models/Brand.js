const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    origin: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    logoUrl: { type: String, default: '' },
    status: { type: String, default: 'Đang hiển thị' },
  },
  {
    timestamps: true,
    collection: 'Brands',
  }
);

module.exports = mongoose.model('Brand', brandSchema);
