const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'Mã SKU là bắt buộc.'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Tên sản phẩm là bắt buộc.'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug là bắt buộc.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
    },
    categorySlug: {
      type: String,
      trim: true,
      default: '',
    },
    roomIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
      },
    ],
    roomSlugs: [
      {
        type: String,
        trim: true,
      },
    ],
    price: {
      type: Number,
      required: [true, 'Giá bán là bắt buộc.'],
      min: [0, 'Giá bán phải lớn hơn hoặc bằng 0.'],
    },
    salePrice: {
      type: Number,
      default: null,
      min: [0, 'Giá khuyến mãi phải lớn hơn hoặc bằng 0.'],
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Tồn kho không được âm.'],
    },
    thumbnail: {
      type: String,
      required: [true, 'Ảnh đại diện sản phẩm là bắt buộc.'],
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: '',
    },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      weight: { type: Number, default: 0 },
    },
    materials: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    averageRating: {
      type: Number,
      default: 5.0,
      min: 1.0,
      max: 5.0,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'out_of_stock'],
      default: 'in_stock',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'Đang kinh doanh', 'ngưng kinh doanh'],
      default: 'active',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    badge: {
      type: String,
      default: '',
    },
    model3DUrl: {
      type: String,
      default: null,
    },
    file3DUrl: {
      type: String,
      default: '',
    },
    soldQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Số lượt bán không được âm.'],
    },
  },
  {
    timestamps: true,
    collection: 'Products',
  }
);

productSchema.index({ categoryId: 1, isActive: 1 });
productSchema.index({ categorySlug: 1, roomSlugs: 1 });
productSchema.index({ price: 1 });
productSchema.index({ status: 1, stockStatus: 1 });
productSchema.index({ soldQuantity: -1 });

module.exports = mongoose.model('Product', productSchema, 'Products');

