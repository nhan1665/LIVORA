const express = require('express');
const router = express.Router();
const {
  staffLogin,
  staffForgotPassword,
  staffResetPassword,
  customerRegister,
  customerLogin,
} = require('../controllers/authController');

router.post('/admin/login', staffLogin);
router.post('/admin/forgot-password', staffForgotPassword);
router.post('/admin/reset-password', staffResetPassword);
router.post('/customer/register', customerRegister);
router.post('/customer/login', customerLogin);

module.exports = router;
