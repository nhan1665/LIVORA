const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    order: { type: Number, default: 1 },
    status: { type: String, default: 'Đang hiển thị' },
  },
  {
    timestamps: true,
    collection: 'Banners',
  }
);

module.exports = mongoose.model('Banner', bannerSchema);
