require('dotenv').config();
const mongoose = require('mongoose');

const testAtlasConnection = async () => {
  console.log('========================================================');
  console.log('🔍 KIỂM TRA KẾT NỐI MONGODB ATLAS - LIVORA DATABASE');
  console.log('========================================================\n');

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ Thất bại: Chưa cấu hình biến MONGODB_URI trong .env!');
    process.exit(1);
  }

  // Safe URI display: mask credentials
  const maskedUri = uri.replace(/(mongodb\+srv:\/\/[^:]+:)([^@]+)(@.+)/, '$1*****$3');
  console.log(`📌 URI đang sử dụng: ${maskedUri}`);

  if (uri.includes('<db_password>')) {
    console.warn('\n⚠️ CẢNH BÁO: MONGODB_URI vẫn đang chứa placeholder "<db_password>".');
    console.warn('👉 Bạn cần mở file "livora_backend/.env", thay "<db_password>" bằng mật khẩu thật từ MongoDB Atlas.');
    console.warn('👉 Sau đó chạy lại: npm run test-db\n');
    process.exit(0);
  }

  try {
    console.log('⏳ Đang kết nối tới cluster MongoDB Atlas...');
    const conn = await mongoose.connect(uri, {
      dbName: 'LIVORA',
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`\n🎉 KẾT NỐI THÀNH CÔNG!`);
    console.log(`📡 Cluster Host: ${conn.connection.host}`);
    console.log(`🗄️ Database: ${conn.connection.name}`);

    // List collections in LIVORA database
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    console.log(`\n📦 Số lượng collections hiện có trong database [${conn.connection.name}]: ${collectionNames.length}`);

    const expectedCollections = [
      'Customers', 'Staffs', 'Categories', 'Rooms', 'Products',
      'Inspirations', 'RoomDesigns', 'Carts', 'Orders', 'Refunds',
      'Reviews', 'Vouchers', 'Contacts', 'Shipping'
    ];

    console.log('\n--- BẢNG ĐỐI CHIẾU 14 COLLECTIONS YÊU CẦU ---');
    for (const name of expectedCollections) {
      const exists = collectionNames.includes(name);
      if (exists) {
        const count = await db.collection(name).countDocuments();
        console.log(`  ✅ [${name}] đã tồn tại (có ${count} documents)`);
      } else {
        console.log(`  ⚪ [${name}] chưa tạo (sẽ được tự động tạo khi backend khởi động)`);
      }
    }

    console.log('\n========================================================');
    console.log('✨ Kiểm tra hoàn tất! Sẵn sàng cho Giai đoạn 3.');
    console.log('========================================================\n');
  } catch (error) {
    console.error('\n❌ KẾT NỐI THẤT BẠI:', error.message);
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('👉 Nguyên nhân: Sai tên đăng nhập hoặc mật khẩu người dùng database.');
    } else if (error.message.includes('querySrv ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.error('👉 Nguyên nhân: Không kết nối được tới máy chủ Atlas. Hãy kiểm tra kết nối mạng hoặc IP Access List trên MongoDB Atlas (cho phép 0.0.0.0/0).');
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testAtlasConnection();
