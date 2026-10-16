const mongoose = require('mongoose');

const roomDesignSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Tên không gian thiết kế là bắt buộc.'],
      trim: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: false,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    file3DUrl: {
      type: String,
      default: '',
    },
    previewImage: {
      type: String,
      default: '',
    },
    layoutData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    suggestedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    isTemplate: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'RoomDesigns',
  }
);

roomDesignSchema.index({ roomId: 1, isTemplate: 1 });
roomDesignSchema.index({ customerId: 1 });

module.exports = mongoose.model('RoomDesign', roomDesignSchema, 'RoomDesigns');
