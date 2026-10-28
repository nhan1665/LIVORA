const express = require('express');
const router = express.Router();
const requireCustomer = require('../middleware/requireCustomer');
const { getMyProfile, updateMyProfile } = require('../controllers/customerProfileController');
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
router.get('/customer/me', requireCustomer, getMyProfile);
router.patch('/customer/me', requireCustomer, updateMyProfile);

module.exports = router;
