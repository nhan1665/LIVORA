const mongoose = require('mongoose');

const marqueeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    iconType: {
      type: String,
      default: 'truck',
    },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    order: { type: Number, default: 1 },
    status: { type: String, default: 'Đang hoạt động' },
  },
  {
    timestamps: true,
    collection: 'Marquees',
  }
);

module.exports = mongoose.model('Marquee', marqueeSchema);
