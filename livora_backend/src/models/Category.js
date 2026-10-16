const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Tên loại sản phẩm là bắt buộc.'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug là bắt buộc.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'Categories',
  }
);

categorySchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('Category', categorySchema, 'Categories');

