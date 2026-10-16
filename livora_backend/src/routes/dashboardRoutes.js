const express = require('express');
const router = express.Router();
const { getRevenueReport } = require('../controllers/dashboardController');

router.get('/revenue', getRevenueReport);

module.exports = router;
