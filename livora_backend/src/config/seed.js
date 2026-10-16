const bcrypt = require('bcryptjs');
const Category = require('../models/Category');
const Room = require('../models/Room');
const Product = require('../models/Product');
const Shipping = require('../models/Shipping');
const Voucher = require('../models/Voucher');
const Staff = require('../models/Staff');
const Customer = require('../models/Customer');

const seedInitialData = async () => {
  try {
    console.log('🔍 Kiểm tra và khởi tạo dữ liệu ban đầu cho các collections...');

    // 1. Rooms
    let roomMap = {};
    if ((await Room.countDocuments()) === 0) {
      const roomsData = [
        { code: 'RM-LIVING', name: 'Phòng khách', slug: 'living-room', description: 'Không gian sinh hoạt chung ấm cúng và sang trọng.', thumbnail: '/images/rooms/living-room.png', displayOrder: 1, isActive: true },
        { code: 'RM-BEDROOM', name: 'Phòng ngủ', slug: 'bedroom', description: 'Nơi thư giãn và tái tạo năng lượng hoàn hảo.', thumbnail: '/images/rooms/bedroom.png', displayOrder: 2, isActive: true },
        { code: 'RM-KITCHEN', name: 'Phòng bếp', slug: 'kitchen', description: 'Trái tim của ngôi nhà với không gian nấu nướng tiện nghi.', thumbnail: '/images/rooms/kitchen.png', displayOrder: 3, isActive: true },
        { code: 'RM-DINING', name: 'Phòng ăn', slug: 'dining-room', description: 'Gắn kết gia đình qua những bữa cơm ấm áp.', thumbnail: '/images/rooms/dining-room.png', displayOrder: 4, isActive: true },
        { code: 'RM-BATHROOM', name: 'Phòng tắm', slug: 'bathroom', description: 'Trải nghiệm spa thư thái ngay tại nhà.', thumbnail: '/images/rooms/bathroom.png', displayOrder: 5, isActive: true },
      ];
      const created = await Room.insertMany(roomsData);
      created.forEach(r => { roomMap[r.slug] = r._id; });
      console.log(`✅ [Rooms] Đã tạo ${created.length} phòng.`);
    } else {
      const existingRooms = await Room.find().lean();
      existingRooms.forEach(r => { roomMap[r.slug] = r._id; });
    }

    // 2. Categories
    let catMap = {};
    if ((await Category.countDocuments()) === 0) {
      const categoriesData = [
        { code: 'CAT-SOFA', name: 'Sofa & Armchair', slug: 'sofas', displayOrder: 1, isActive: true },
        { code: 'CAT-TABLE', name: 'Bàn trà & Bàn cà phê', slug: 'coffee-tables', displayOrder: 2, isActive: true },
        { code: 'CAT-CHAIR', name: 'Ghế thư giãn & Ghế ăn', slug: 'chairs', displayOrder: 3, isActive: true },
        { code: 'CAT-BED', name: 'Giường ngủ', slug: 'beds', displayOrder: 4, isActive: true },
        { code: 'CAT-MATTRESS', name: 'Nệm', slug: 'mattresses', displayOrder: 5, isActive: true },
        { code: 'CAT-WARDROBE', name: 'Tủ quần áo & Lưu trữ', slug: 'wardrobes', displayOrder: 6, isActive: true },
        { code: 'CAT-BEDDING', name: 'Bộ chăn ga', slug: 'bedding', displayOrder: 7, isActive: true },
        { code: 'CAT-LIGHT', name: 'Đèn & Chiếu sáng', slug: 'lighting', displayOrder: 8, isActive: true },
        { code: 'CAT-RUG', name: 'Thảm trải sàn', slug: 'rugs', displayOrder: 9, isActive: true },
        { code: 'CAT-CABINET', name: 'Tủ bếp & Kệ', slug: 'cabinets', displayOrder: 10, isActive: true },
        { code: 'CAT-DINING', name: 'Bàn ăn', slug: 'dining-tables', displayOrder: 11, isActive: true },
        { code: 'CAT-MIRROR', name: 'Gương & Phụ kiện', slug: 'mirrors', displayOrder: 12, isActive: true },
        { code: 'CAT-TOWEL', name: 'Khăn tắm & Phụ kiện', slug: 'towels', displayOrder: 13, isActive: true },
      ];
      const created = await Category.insertMany(categoriesData);
      created.forEach(c => { catMap[c.slug] = c._id; });
      console.log(`✅ [Categories] Đã tạo ${created.length} danh mục.`);
    } else {
      const existingCats = await Category.find().lean();
      existingCats.forEach(c => { catMap[c.slug] = c._id; });
    }

    // 3. Products
    if ((await Product.countDocuments()) === 0) {
      const now = new Date();
      const productsData = [
        // Sofas
        {
          sku: 'SOFA-NORDIC-01',
          name: 'Sofa Vải Nỉ Bắc Âu Minimalist',
          slug: 'sofa-vai-ni-bac-au-minimalist',
          categoryId: catMap['sofas'],
          roomIds: [roomMap['living-room']],
          price: 12500000,
          salePrice: 10990000,
          stockQuantity: 15,
          stockStatus: 'in_stock',
          thumbnail: '/images/products/sofa-01.png',
          images: ['/images/products/sofa-01.png'],
          description: 'Sofa phong cách Bắc Âu với khung gỗ sồi tự nhiên và đệm bọt biển đàn hồi cao.',
          dimensions: { length: 210, width: 90, height: 85, weight: 45 },
          materials: ['Khung gỗ sồi', 'Vải nỉ cao cấp'],
          colors: ['Xám tro', 'Be nhạt'],
          status: 'active',
          averageRating: 5.0,
          totalReviews: 0,
          isFeatured: false,
          model3DUrl: null,
          createdAt: now,
        },
        {
          sku: 'SOFA-LEATHER-02',
          name: 'Sofa Da Bò Ý Carina Luxury',
          slug: 'sofa-da-bo-y-carina-luxury',
          categoryId: catMap['sofas'],
          roomIds: [roomMap['living-room']],
          price: 28900000,
          salePrice: 25500000,
          stockQuantity: 8,
          stockStatus: 'in_stock',
          thumbnail: '/images/products/sofa-02.png',
          images: ['/images/products/sofa-02.png'],
          description: 'Sofa da bò Ý cao cấp, đường may tỉ mỉ mang lại sự đẳng cấp vượt thời gian.',
          dimensions: { length: 240, width: 95, height: 88, weight: 60 },
          materials: ['Da bò nhập khẩu Ý', 'Khung kim loại mạ'],
          colors: ['Nâu cognac', 'Đen huyền bí'],
          status: 'active',
          averageRating: 5.0,
          totalReviews: 0,
          isFeatured: false,
          model3DUrl: null,
          createdAt: now,
        },
        // Bàn trà
        {
          sku: 'TABLE-MARBLE-03',
          name: 'Bàn Trà Mặt Đá Cẩm Thạch Carrara',
          slug: 'ban-tra-mat-da-cam-thach-carrara',
          categoryId: catMap['coffee-tables'],
          roomIds: [roomMap['living-room']],
          price: 6800000,
          salePrice: 5900000,
          stockQuantity: 20,
          stockStatus: 'in_stock',
          thumbnail: '/images/products/table-01.png',
          images: ['/images/products/table-01.png'],
          description: 'Bàn trà tròn mặt đá cẩm thạch trắng Carrara kết hợp chân kim loại sơn tĩnh điện vàng mạ.',
          dimensions: { length: 80, width: 80, height: 45, weight: 22 },
          materials: ['Đá cẩm thạch', 'Inox mạ PVD'],
          colors: ['Trắng vân mây'],
          status: 'active',
          averageRating: 5.0,
          totalReviews: 0,
          isFeatured: false,
          model3DUrl: null,
          createdAt: now,
        },
        // Ghế
        {
          sku: 'CHAIR-LOUNGE-04',
          name: 'Ghế Bành Thư Giãn Ergonomic',
          slug: 'ghe-banh-thu-gian-ergonomic',
          categoryId: catMap['chairs'],
          roomIds: [roomMap['living-room'], roomMap['bedroom']],
          price: 4900000,
          salePrice: null,
          stockQuantity: 12,
          stockStatus: 'in_stock',
          thumbnail: '/images/products/chair-01.png',
          images: ['/images/products/chair-01.png'],
          description: 'Ghế bành công thái học thư thái ôm lưng, bọc da microfiber êm ái chống trầy.',
          dimensions: { length: 85, width: 75, height: 95, weight: 18 },
          materials: ['Da microfiber', 'Kim loại đúc'],
          colors: ['Cam đất', 'Xanh navy'],
          status: 'active',
          averageRating: 5.0,
          totalReviews: 0,
          isFeatured: false,
          model3DUrl: null,
          createdAt: now,
        },
        // Giường
        {
          sku: 'BED-OAK-05',
          name: 'Giường Ngủ Gỗ Sồi Japandi',
          slug: 'giuong-ngu-go-soi-japandi',
          categoryId: catMap['beds'],
          roomIds: [roomMap['bedroom']],
          price: 15800000,
          salePrice: 14200000,
          stockQuantity: 10,
          stockStatus: 'in_stock',
          thumbnail: '/images/products/bed-01.png',
          images: ['/images/products/bed-01.png'],
          description: 'Giường gỗ sồi tự nhiên tinh tế, thiết kế vạt phản nâng đỡ cột sống hoàn hảo.',
          dimensions: { length: 200, width: 180, height: 95, weight: 65 },
          materials: ['Gỗ sồi nhập khẩu'],
          colors: ['Gỗ tự nhiên'],
          status: 'active',
          averageRating: 5.0,
          totalReviews: 0,
          isFeatured: false,
          model3DUrl: null,
          createdAt: now,
        },
        // Nệm
        {
          sku: 'MAT-LATEX-06',
          name: 'Nệm Cao Su Thiên Nhiên Livora Pure',
          slug: 'nem-cao-su-thien-nhien-livora-pure',
          categoryId: catMap['mattresses'],
          roomIds: [roomMap['bedroom']],
          price: 18500000,
          salePrice: 16900000,
          stockQuantity: 14,
          stockStatus: 'in_stock',
          thumbnail: '/images/products/mattress-01.png',
          images: ['/images/products/mattress-01.png'],
          description: '100% cao su thiên nhiên kháng khuẩn, thông hơi đa chiều đem lại giấc ngủ sâu.',
          dimensions: { length: 200, width: 180, height: 15, weight: 35 },
          materials: ['Cao su thiên nhiên nguyên chất'],
          colors: ['Trắng kem'],
          status: 'active',
          averageRating: 5.0,
          totalReviews: 0,
          isFeatured: false,
          model3DUrl: null,
          createdAt: now,
        },
        // Tủ quần áo
        {
          sku: 'WARD-SLIDE-07',
          name: 'Tủ Quần Áo Cửa Lùa Kính Khói Hiện Đại',
          slug: 'tu-quan-ao-cua-lua-kinh-khoi-hien-dai',
          categoryId: catMap['wardrobes'],
          roomIds: [roomMap['bedroom']],
          price: 21000000,
          salePrice: null,
          stockQuantity: 6,
          stockStatus: 'in_stock',
          thumbnail: '/images/products/wardrobe-01.png',
          images: ['/images/products/wardrobe-01.png'],
          description: 'Tủ quần áo cánh kính cường lực màu khói tích hợp đèn LED cảm ứng thông minh.',
          dimensions: { length: 220, width: 60, height: 240, weight: 110 },
          materials: ['Gỗ MDF An Cường', 'Kính cường lực'],
          colors: ['Xám đậm'],
          status: 'active',
          averageRating: 5.0,
          totalReviews: 0,
          isFeatured: false,
          model3DUrl: null,
          createdAt: now,
        },
        // Bàn ăn
        {
          sku: 'DINING-WALNUT-08',
          name: 'Bàn Ăn 6 Ghế Gỗ Óc Chó Sang Trọng',
          slug: 'ban-an-6-ghe-go-oc-cho-sang-trong',
          categoryId: catMap['dining-tables'],
          roomIds: [roomMap['dining-room'], roomMap['kitchen']],
          price: 24500000,
          salePrice: 21900000,
          stockQuantity: 5,
          stockStatus: 'in_stock',
          thumbnail: '/images/products/dining-01.png',
          images: ['/images/products/dining-01.png'],
          description: 'Bàn ăn cao cấp 6 ghế gỗ óc chó nguyên khối tôn vinh đẳng cấp không gian ẩm thực.',
          dimensions: { length: 180, width: 90, height: 75, weight: 80 },
          materials: ['Gỗ óc chó Bắc Mỹ'],
          colors: ['Nâu óc chó'],
          status: 'active',
          averageRating: 5.0,
          totalReviews: 0,
          isFeatured: false,
          model3DUrl: null,
          createdAt: now,
        },
        // Đèn
        {
          sku: 'LIGHT-PENDANT-09',
          name: 'Đèn Thả Trần Thủy Tinh Nghệ Thuật',
          slug: 'den-tha-tran-thuy-tinh-nghe-thuat',
          categoryId: catMap['lighting'],
          roomIds: [roomMap['living-room'], roomMap['dining-room']],
          price: 3200000,
          salePrice: 2850000,
          stockQuantity: 25,
          stockStatus: 'in_stock',
          thumbnail: '/images/products/light-01.png',
          images: ['/images/products/light-01.png'],
          description: 'Đèn thả chao thủy tinh thổi thủ công với ánh sáng vàng ấm lan tỏa nhẹ nhàng.',
          dimensions: { length: 30, width: 30, height: 50, weight: 3 },
          materials: ['Thủy tinh borosilicate', 'Đồng thau'],
          colors: ['Hổ phách'],
          status: 'active',
          averageRating: 5.0,
          totalReviews: 0,
          isFeatured: false,
          model3DUrl: null,
          createdAt: now,
        },
        // Gương
        {
          sku: 'MIRROR-LED-10',
          name: 'Gương Soi Toàn Thân Viền Kim Loại Có Đèn LED',
          slug: 'guong-soi-toan-than-vien-kim-loai-co-den-led',
          categoryId: catMap['mirrors'],
          roomIds: [roomMap['bedroom'], roomMap['bathroom']],
          price: 2800000,
          salePrice: null,
          stockQuantity: 18,
          stockStatus: 'in_stock',
          thumbnail: '/images/products/mirror-01.png',
          images: ['/images/products/mirror-01.png'],
          description: 'Gương soi cảm ứng 3 chế độ sáng, kính chống vỡ tráng bạc sắc nét.',
          dimensions: { length: 60, width: 4, height: 165, weight: 12 },
          materials: ['Kính tráng bạc Bỉ', 'Nhôm anodized'],
          colors: ['Vàng champange', 'Đen mờ'],
          status: 'active',
          averageRating: 5.0,
          totalReviews: 0,
          isFeatured: false,
          model3DUrl: null,
          createdAt: now,
        },
      ];
      await Product.insertMany(productsData);
      console.log(`✅ [Products] Đã tạo ${productsData.length} sản phẩm.`);
    }

    // 4. Shipping
    if ((await Shipping.countDocuments()) === 0) {
      const shippingData = [
        { shippingMethod: 'standard', province: 'TP. Hồ Chí Minh', fee: 0, estimatedDeliveryTime: '1 - 2 ngày', isActive: true, freeShipEnabled: true, freeShipThreshold: 0 },
        { shippingMethod: 'express', province: 'TP. Hồ Chí Minh', fee: 50000, estimatedDeliveryTime: 'Trong ngày (4 giờ)', isActive: true, freeShipEnabled: false },
        { shippingMethod: 'standard', province: 'Hà Nội', fee: 150000, estimatedDeliveryTime: '2 - 3 ngày', isActive: true, freeShipEnabled: true, freeShipThreshold: 5000000 },
        { shippingMethod: 'standard', province: 'Đà Nẵng', fee: 120000, estimatedDeliveryTime: '2 - 3 ngày', isActive: true, freeShipEnabled: true, freeShipThreshold: 5000000 },
        { shippingMethod: 'standard', province: 'Toàn quốc', fee: 200000, estimatedDeliveryTime: '3 - 5 ngày', isActive: true, freeShipEnabled: true, freeShipThreshold: 10000000 },
      ];
      await Shipping.insertMany(shippingData);
      console.log(`✅ [Shipping] Đã tạo ${shippingData.length} cấu hình vận chuyển.`);
    }

    // 5. Staff
    if ((await Staff.countDocuments()) === 0) {
      const salt = await bcrypt.genSalt(10);
      const staffPasswordHash = await bcrypt.hash('livora@2026', salt);
      await Staff.create({
        username: 'NV2709',
        code: 'NV2709',
        fullName: 'Trần Đỗ Nhật Nhân (Super Admin)',
        email: 'nhan.tdn@livora.com',
        phone: '0901234567',
        passwordHash: staffPasswordHash,
        role: 'super_admin',
        permissions: ['all'],
        status: 'active',
      });
      console.log('✅ [Staffs] Đã tạo tài khoản quản trị viên: NV2709 / livora@2026');
    }

    // 6. Customer
    if ((await Customer.countDocuments()) === 0) {
      const salt = await bcrypt.genSalt(10);
      const customerPasswordHash = await bcrypt.hash('password123', salt);
      await Customer.create({
        code: 'KH-0001',
        fullName: 'Nguyễn Văn An',
        email: 'admin@livora.com',
        phone: '0901234567',
        passwordHash: customerPasswordHash,
        customerType: 'registered',
        status: 'active',
        addresses: [
          {
            isDefault: true,
            label: 'Nhà riêng',
            fullName: 'Nguyễn Văn An',
            phone: '0901234567',
            addressLine: '669 Đỗ Mười, P. Tân Phong',
            district: 'Quận 7',
            province: 'TP. Hồ Chí Minh',
          },
        ],
      });
      console.log('✅ [Customers] Đã tạo tài khoản khách hàng mẫu: admin@livora.com / password123');
    }

    // 7. Vouchers
    if ((await Voucher.countDocuments()) === 0) {
      const now = new Date();
      const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      await Voucher.create([
        {
          code: 'LIVORA10',
          title: 'Giảm 10% Cho Đơn Hàng Đầu Tiên',
          discountType: 'percentage',
          discountValue: 10,
          maxDiscountAmount: 1000000,
          minOrderValue: 2000000,
          quantity: 500,
          usedCount: 0,
          startDate: now,
          endDate: nextYear,
          isActive: true,
        },
        {
          code: 'GIAM20',
          title: 'Ưu Đãi Đặc Biệt Giảm 200.000 VNĐ',
          discountType: 'fixed_amount',
          discountValue: 200000,
          maxDiscountAmount: 200000,
          minOrderValue: 1500000,
          quantity: 300,
          usedCount: 0,
          startDate: now,
          endDate: nextYear,
          isActive: true,
        },
      ]);
      console.log('✅ [Vouchers] Đã tạo vouchers mẫu (LIVORA10, GIAM20).');
    }

    // 8. Inspirations
    const Inspiration = require('../models/Inspiration');
    if ((await Inspiration.countDocuments()) === 0) {
      const now = new Date();
      const sofaProd = await Product.findOne({ sku: 'SOFA-NORDIC-01' }).lean();
      const tableProd = await Product.findOne({ sku: 'TABLE-MARBLE-03' }).lean();
      const bedProd = await Product.findOne({ sku: 'BED-OAK-05' }).lean();
      const diningProd = await Product.findOne({ sku: 'DINING-WALNUT-08' }).lean();

      const inspirationsData = [
        {
          code: 'INS-NORDIC-01',
          title: 'Phòng Khách Scandinavian Tối Giản & Tràn Ngập Ánh Sáng',
          slug: 'phong-khach-scandinavian-toi-gian',
          roomId: roomMap['living-room'],
          style: 'Bắc Âu (Scandinavian)',
          thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
          content: 'Không gian mở kết hợp chất liệu gỗ sồi tự nhiên và đệm nỉ màu xám tro trang nhã, đón trọn ánh sáng ban mai tươi mới.',
          taggedProducts: sofaProd ? [
            { productId: sofaProd._id, xPercent: 45, yPercent: 60 },
            ...(tableProd ? [{ productId: tableProd._id, xPercent: 65, yPercent: 75 }] : []),
          ] : [],
          viewsCount: 1520,
          status: 'published',
          isActive: true,
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          code: 'INS-JAPANDI-02',
          title: 'Phòng Ngủ Japandi Tĩnh Lặng & Tái Tạo Năng Lượng',
          slug: 'phong-ngu-japandi-tinh-lang',
          roomId: roomMap['bedroom'],
          style: 'Japandi Zen',
          thumbnail: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
          content: 'Giao thoa giữa tinh thần tối giản Nhật Bản và sự ấm cúng Bắc Âu, mang lại cảm giác an yên tuyệt đối sau ngày dài.',
          taggedProducts: bedProd ? [
            { productId: bedProd._id, xPercent: 50, yPercent: 55 },
          ] : [],
          viewsCount: 1180,
          status: 'published',
          isActive: true,
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          code: 'INS-LUXURY-03',
          title: 'Phòng Ăn Luxury Gỗ Óc Chó Sang Trọng & Ấm Cúng',
          slug: 'phong-an-luxury-go-oc-cho',
          roomId: roomMap['dining-room'],
          style: 'Modern Luxury',
          thumbnail: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
          content: 'Bàn ăn 6 ghế gỗ óc chó Bắc Mỹ nguyên khối kết hợp ánh đèn vàng dịu, tôn vinh những khoảnh khắc sum vầy trọn vẹn của gia đình.',
          taggedProducts: diningProd ? [
            { productId: diningProd._id, xPercent: 55, yPercent: 65 },
          ] : [],
          viewsCount: 1890,
          status: 'published',
          isActive: true,
          createdAt: now,
        },
      ];
      await Inspiration.insertMany(inspirationsData);
      console.log(`✅ [Inspirations] Đã tạo ${inspirationsData.length} cảm hứng thiết kế mẫu.`);
    }

    console.log('🎉 Toàn bộ dữ liệu cơ sở đã sẵn sàng trong MongoDB Atlas!');
    return true;
  } catch (error) {
    console.error('Lỗi khi seed data:', error.message || error);
    return false;
  }
};

module.exports = seedInitialData;

