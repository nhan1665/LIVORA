const mongoose = require('mongoose');

const policySchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileData: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: String,
      default: 'Admin',
    },
  },
  {
    timestamps: true,
    collection: 'Policies',
  }
);

module.exports = mongoose.model('Policy', policySchema);
