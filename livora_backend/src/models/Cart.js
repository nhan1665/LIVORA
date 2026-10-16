const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  sku: { type: String, default: '' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  thumbnail: { type: String, default: '' },
  color: { type: String, default: '' },
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    sessionId: {
      type: String,
      default: '',
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
    collection: 'Carts',
  }
);

cartSchema.index({ userId: 1 });
cartSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Cart', cartSchema, 'Carts');
