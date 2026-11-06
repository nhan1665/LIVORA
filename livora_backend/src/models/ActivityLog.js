const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityCode: {
      type: String,
      default: '',
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: String,
      default: 'Hệ thống',
      trim: true,
    },
    role: {
      type: String,
      enum: ['system', 'admin', 'staff', 'customer'],
      default: 'system',
    },
    details: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'ActivityLogs',
  }
);

activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activityLogSchema.index({ entityCode: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema, 'ActivityLogs');

