const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Tên không gian phòng là bắt buộc.'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug là bắt buộc.'],
      unique: true,
      trim: true,
      lowercase: true,
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
    collection: 'Rooms',
  }
);

roomSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('Room', roomSchema, 'Rooms');

