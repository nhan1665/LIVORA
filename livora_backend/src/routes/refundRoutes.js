const express = require('express');
const router = express.Router();
const {
  getRefunds,
  createRefund,
  updateRefundStatus,
  getRefundPolicy,
  updateRefundPolicy
} = require('../controllers/refundController');

// Policy endpoints
router.get('/policy', getRefundPolicy);
router.post('/policy', updateRefundPolicy);

// Refund list & actions
router.get('/', getRefunds);
router.post('/', createRefund);
router.patch('/:id/status', updateRefundStatus);

module.exports = router;
