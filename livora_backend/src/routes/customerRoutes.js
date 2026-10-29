const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  toggleCustomer,
} = require('../controllers/customerController');

// Tra cứu khách hàng theo SĐT / từ khóa cho tạo đơn hàng POS (Public search, full listing requires admin)
router.get('/', (req, res, next) => {
  if (req.query.search || req.query.phone) {
    return getCustomers(req, res, next);
  }
  return requireAdmin(req, res, () => getCustomers(req, res, next));
});

router.post('/', createCustomer);
router.get('/:id', requireAdmin, getCustomerById);
router.put('/:id', requireAdmin, updateCustomer);
router.patch('/:id/toggle', requireAdmin, toggleCustomer);

module.exports = router;
