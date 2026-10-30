const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (_) {}
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const configureCors = require('./src/config/cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(configureCors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ===== API Routes =====
const authRoutes = require('./src/routes/authRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const roomRoutes = require('./src/routes/roomRoutes');
const productRoutes = require('./src/routes/productRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const inspirationRoutes = require('./src/routes/inspirationRoutes');
const spaceRoutes = require('./src/routes/spaceRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const shippingRoutes = require('./src/routes/shippingRoutes');
const refundRoutes = require('./src/routes/refundRoutes');
const voucherRoutes = require('./src/routes/voucherRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const homepageRoutes = require('./src/routes/homepageRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');
const checkoutRoutes = require('./src/routes/checkoutRoutes');
const requireAdmin = require('./src/middleware/requireAdmin');

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inspirations', inspirationRoutes);
app.use('/api/room-designs', spaceRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/checkout', checkoutRoutes);

// Historical database maintenance endpoints are unavailable during normal operation.
app.use(['/api/drop-staffs', '/api/inspect-schema', '/api/seed'], (req, res, next) => {
  if (process.env.ENABLE_UNSAFE_DB_TOOLS !== 'true') return res.sendStatus(404);
  return requireAdmin(req, res, next);
});

// Endpoint xóa collection Staffs/staffs dư thừa
app.all('/api/drop-staffs', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name);
    let dropResult = null;
    let dropErr = null;
    try {
      dropResult = await db.dropCollection('Staffs');
    } catch (e) {
      dropErr = e.message;
    }
    return res.json({
      success: true,
      dbName: db.databaseName,
      allCollections: names,
      dropResult,
      dropErr
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Inspect Atlas Collection Names and Validators
app.get('/api/inspect-schema', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const result = [];
    for (const c of collections) {
      const count = await db.collection(c.name).countDocuments();
      const sample = await db.collection(c.name).findOne({});
      result.push({
        name: c.name,
        count,
        sample,
        validator: c.options?.validator || null,
      });
    }
    res.json({ success: true, count: result.length, collections: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Seed Data Endpoint with detailed diagnostics
app.get('/api/seed', async (req, res) => {
  try {
    const Category = require('./src/models/Category');
    const Room = require('./src/models/Room');
    const Product = require('./src/models/Product');
    const Customer = require('./src/models/Customer');
    const Employee = require('./src/models/Employee');
    const Voucher = require('./src/models/Voucher');
    const Shipping = require('./src/models/Shipping');
    const Inspiration = require('./src/models/Inspiration');

    const seedSuccess = await seedInitialData();

    const counts = {
      categories: await Category.countDocuments(),
      rooms: await Room.countDocuments(),
      products: await Product.countDocuments(),
      customers: await Customer.countDocuments(),
      employees: await Employee.countDocuments(),
      vouchers: await Voucher.countDocuments(),
      shipping: await Shipping.countDocuments(),
      inspirations: await Inspiration.countDocuments(),
    };

    res.json({ success: true, seedSuccess, message: 'Dữ liệu mẫu đã được seed.', counts, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
});

// Health Check API with MongoDB connection status
app.get('/api/health', (req, res) => {
  const readyStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = readyStates[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    status: 'OK',
    message: 'LIVORA E-commerce Backend API is running.',
    mongodb: {
      status: state,
      readyState: mongoose.connection.readyState,
      database: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Default 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn API [${req.method} ${req.originalUrl}] không tồn tại.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const fs = require('fs');
const seedInitialData = require('./src/config/seed');

const startServer = async () => {
  const conn = await connectDB();
  if (!conn) throw new Error('MongoDB connection is required before starting the API.');
  // Auto-seed tắt mặc định để bảo toàn database test của người dùng
  if (process.env.AUTO_SEED === 'true') {
    try {
      await seedInitialData();
    } catch (seedErr) {
      console.warn('Lỗi khi seed initial data:', seedErr.message);
    }
  }
  app.listen(PORT, () => {
    console.log(`LIVORA Backend API listening on http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Unhandled server error:', err);
});

// Trigger reload: 2026-10-19 21:46

