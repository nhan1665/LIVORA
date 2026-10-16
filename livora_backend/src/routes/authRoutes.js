const express = require('express');
const router = express.Router();
const { staffLogin, customerRegister, customerLogin } = require('../controllers/authController');

router.post('/admin/login', staffLogin);
router.post('/customer/register', customerRegister);
router.post('/customer/login', customerLogin);

module.exports = router;
