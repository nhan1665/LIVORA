const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (_) {}
const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ Lỗi: Biến môi trường MONGODB_URI chưa được định nghĩa trong .env!');
    process.exit(1);
  }

  if (uri.includes('<db_password>')) {
    console.warn('⚠️ CẢNH BÁO: MONGODB_URI trong .env vẫn chứa placeholder "<db_password>".');
    console.warn('👉 Vui lòng mở file livora_backend/.env và thay thế "<db_password>" bằng mật khẩu database thật của bạn.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'LIVORA',
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ Kết nối MongoDB Atlas thành công!`);
    console.log(`📡 Host: ${conn.connection.host}`);
    console.log(`🗄️ Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error('❌ Kết nối MongoDB Atlas thất bại:', error.message);
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('👉 Vui lòng kiểm tra lại username/password trong MONGODB_URI của file .env.');
    }
    return null;
  }
};

module.exports = connectDB;
