const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  requestCancelOtp,
} = require('../controllers/orderController');

// Public route: Customers and users can create orders
router.post('/', createOrder);

// Public route: Order lookup by ID or order code
router.get('/:id', getOrderById);

// Order listing: Allows search for tracking, otherwise requires admin authentication
router.get('/', (req, res, next) => {
  if (req.query.search || req.query.phone || req.query.userId) {
    return getOrders(req, res, next);
  }
  return requireAdmin(req, res, () => getOrders(req, res, next));
});

// Admin management routes
router.patch('/:id/status', requireAdmin, updateOrderStatus);

// Request OTP to cancel order (prints to Localhost terminal/console)
router.post('/:id/request-cancel-otp', requestCancelOtp);

// Order cancellation: Allows customer/guest to cancel via OTP tracking or admin
router.patch('/:id/cancel', cancelOrder);

module.exports = router;
