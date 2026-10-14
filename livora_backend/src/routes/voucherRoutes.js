const express = require('express');
const router = express.Router();
const {
  getVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  toggleVoucher,
} = require('../controllers/voucherController');

// GET    /api/vouchers          — List vouchers (with filter/search/pagination)
// POST   /api/vouchers          — Create a new voucher
// GET    /api/vouchers/:id      — Get voucher by ID
// PUT    /api/vouchers/:id      — Update voucher
// PATCH  /api/vouchers/:id/toggle — Toggle voucher active status

router.get('/', getVouchers);
router.post('/', createVoucher);
router.get('/:id', getVoucherById);
router.put('/:id', updateVoucher);
router.patch('/:id/toggle', toggleVoucher);

module.exports = router;
