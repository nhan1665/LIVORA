const express = require('express');
const router = express.Router();
router.use(require('../middleware/requireAdmin'));
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  toggleCustomer,
} = require('../controllers/customerController');

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.patch('/:id/toggle', toggleCustomer);

module.exports = router;
