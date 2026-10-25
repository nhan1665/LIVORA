const router = require('express').Router();
const { getShippingRegions, getShippingOptions, getQuote, createCheckoutOrder } = require('../controllers/checkoutController');

router.get('/regions', getShippingRegions);
router.post('/shipping-options', getShippingOptions);
router.post('/quote', getQuote);
router.post('/orders', createCheckoutOrder);

module.exports = router;
