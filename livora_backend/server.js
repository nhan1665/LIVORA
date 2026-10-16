require('dotenv').config();
const express = require('express');
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

app.use('/api/auth', authRoutes);
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

// Inspect Atlas Collection Validators
app.get('/api/inspect-schema', async (req, res) => {


  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const validators = {};
    for (const c of collections) {
      if (c.options && c.options.validator) {
        validators[c.name] = c.options.validator;
      }
    }
    res.json({ success: true, validators });
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
    const Staff = require('./src/models/Staff');
    const Voucher = require('./src/models/Voucher');
    const Shipping = require('./src/models/Shipping');
    const Inspiration = require('./src/models/Inspiration');

    const seedSuccess = await seedInitialData();

    const counts = {
      categories: await Category.countDocuments(),
      rooms: await Room.countDocuments(),
      products: await Product.countDocuments(),
      customers: await Customer.countDocuments(),
      staffs: await Staff.countDocuments(),
      vouchers: await Voucher.countDocuments(),
      shipping: await Shipping.countDocuments(),
      inspirations: await Inspiration.countDocuments(),
    };

    res.json({ success: true, seedSuccess, message: 'Dữ liệu mẫu đã được seed.', counts, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
});


const mongoose = require('mongoose');

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

// Start Server & Connect Database
const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    const conn = await connectDB();
    if (conn) {
      try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const validators = {};
        for (const c of collections) {
          if (c.options && c.options.validator) {
            validators[c.name] = c.options.validator;
          }
        }
        fs.writeFileSync('./atlas_validators.json', JSON.stringify(validators, null, 2));
      } catch (e) {
        console.warn('Không thể đọc collection validator:', e.message);
      }

      try {
        await seedInitialData();
      } catch (err) {
        console.warn('⚠️ Bỏ qua seed data tự động do validator:', err.message);
      }
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 LIVORA Backend Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('Lỗi khi khởi động server:', err);
  }
};

startServer().catch(err => {
  console.error('Unhandled server error:', err);
});

