const express = require('express');
const router = express.Router();
const { getRefunds, createRefund, updateRefundStatus } = require('../controllers/refundController');

router.get('/', getRefunds);
router.post('/', createRefund);
router.patch('/:id/status', updateRefundStatus);

module.exports = router;
