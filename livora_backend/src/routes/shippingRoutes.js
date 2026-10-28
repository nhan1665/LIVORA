const express = require('express');
const router = express.Router();
router.use(require('../middleware/requireAdmin'));
const {
  getShippingConfigs,
  createShippingConfig,
  updateShippingConfig,
  toggleShippingConfig,
  deleteShippingConfig,
} = require('../controllers/shippingController');

router.get('/', getShippingConfigs);
router.post('/', createShippingConfig);
router.put('/:id', updateShippingConfig);
router.patch('/:id/toggle', toggleShippingConfig);
router.delete('/:id', deleteShippingConfig);

module.exports = router;
