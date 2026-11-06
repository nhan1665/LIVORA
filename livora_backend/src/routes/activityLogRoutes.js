const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/activityLogController');

router.get('/', getActivityLogs);

module.exports = router;

