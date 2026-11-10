const express = require('express');
const router = express.Router();
const {
  getRevenueReport,
  getProductPerformanceReport,
  getSpacePerformanceReport,
  getCustomerAnalyticsReport,
} = require('../controllers/dashboardController');

router.get('/revenue', getRevenueReport);
router.get('/products', getProductPerformanceReport);
router.get('/spaces', getSpacePerformanceReport);
router.get('/customers', getCustomerAnalyticsReport);

module.exports = router;
