const mongoose = require('mongoose');

const footerSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    name: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
    value: { type: String, default: '', trim: true },
    status: { type: String, default: 'Hiển thị' },
    iconType: {
      type: String,
      default: 'facebook',
    },
    fileName: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    fileSize: { type: String, default: '' },
    fileData: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'Footers',
  }
);

module.exports = mongoose.model('Footer', footerSchema);
