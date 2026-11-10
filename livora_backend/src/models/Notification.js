const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề thông báo là bắt buộc.'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Nội dung thông báo là bắt buộc.'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['refund', 'contact', 'order', 'review', 'system', 'content'],
      default: 'system',
    },
    targetRoles: {
      type: [String],
      default: ['SUPER_ADMIN'],
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    entityId: {
      type: String,
      default: null,
    },
    entityCode: {
      type: String,
      default: '',
      trim: true,
    },
    readBy: {
      type: [String], // Array of employee IDs or usernames who marked as read
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'Notifications',
  }
);

// Index for fast query by targetRoles and creation time
notificationSchema.index({ targetRoles: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema, 'Notifications');

