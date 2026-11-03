const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');

router.get('/', policyController.getPolicy);
router.post('/', policyController.updatePolicy);

module.exports = router;

