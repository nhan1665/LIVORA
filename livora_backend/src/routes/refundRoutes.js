const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const {
  getRefunds,
  createRefund,
  updateRefundStatus,
  getRefundPolicy,
  updateRefundPolicy
} = require('../controllers/refundController');

// Policy endpoints: anyone can read the purchase policy, only admins can replace it.
router.get('/policy', getRefundPolicy);
router.post('/policy', requireAdmin, updateRefundPolicy);

// Customers submit refund requests (verified by order code + phone); admins list and process them.
router.get('/', requireAdmin, getRefunds);
router.post('/', createRefund);
router.patch('/:id/status', requireAdmin, updateRefundStatus);

module.exports = router;
