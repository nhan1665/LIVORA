const mongoose = require('mongoose');
const Room = require('../models/Room');
const Category = require('../models/Category');
const Product = require('../models/Product');
const RoomDesign = require('../models/RoomDesign');

/**
 * Script khởi tạo dữ liệu giả lập (mock data):
 * - 5 phòng trong CSDL (Phòng khách, Phòng ngủ, Phòng bếp, Phòng ăn, Phòng tắm)
 * - Mỗi phòng 2 không gian thiết kế => Tổng cộng 10 không gian (RoomDesigns)
 * - Mỗi phòng 10 sản phẩm => Tổng cộng 50 sản phẩm (Products)
 */
async function seedMockSpacesAndProducts(force = false) {
  try {
    const existingProductCount = await Product.countDocuments({ isActive: true });
    const existingSpaceCount = await RoomDesign.countDocuments({ isTemplate: true });
    if (!force && existingProductCount >= 50 && existingSpaceCount >= 10) {
      console.log(`✅ [Seed] Dữ liệu đã sẵn sàng (${existingProductCount} sản phẩm, ${existingSpaceCount} không gian). Bỏ qua tạo lặp lại.`);
      return { success: true, message: 'Dữ liệu đã đầy đủ.' };
    }

    console.log('🌱 Bắt đầu kiểm tra và tạo dữ liệu giả lập (10 không gian, 50 sản phẩm)...');

    // 1. Đảm bảo 5 phòng chuẩn
    let rooms = await Room.find().lean();
    const defaultRooms = [
      { code: 'RM-LIVING', name: 'Phòng khách', slug: 'living-room', description: 'Không gian sinh hoạt chung ấm cúng và sang trọng.', thumbnail: '/images/rooms/living-room.png', displayOrder: 1, isActive: true },
      { code: 'RM-BEDROOM', name: 'Phòng ngủ', slug: 'bedroom', description: 'Nơi thư giãn và tái tạo năng lượng hoàn hảo.', thumbnail: '/images/rooms/bedroom.png', displayOrder: 2, isActive: true },
      { code: 'RM-KITCHEN', name: 'Phòng bếp', slug: 'kitchen', description: 'Trái tim của ngôi nhà với không gian nấu nướng tiện nghi.', thumbnail: '/images/rooms/kitchen.png', displayOrder: 3, isActive: true },
      { code: 'RM-DINING', name: 'Phòng ăn', slug: 'dining-room', description: 'Gắn kết gia đình qua những bữa cơm ấm áp.', thumbnail: '/images/rooms/dining-room.png', displayOrder: 4, isActive: true },
      { code: 'RM-BATHROOM', name: 'Phòng tắm', slug: 'bathroom', description: 'Trải nghiệm spa thư thái ngay tại nhà.', thumbnail: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80', displayOrder: 5, isActive: true },
    ];
    for (const r of defaultRooms) {
      await Room.findOneAndUpdate({ slug: r.slug }, { $set: r }, { upsert: true, new: true });
    }
    rooms = await Room.find().lean();

    const livingRoom = rooms.find(r => r.slug === 'living-room' || (r.name && r.name.toLowerCase().includes('khách'))) || rooms[0];
    const bedRoom = rooms.find(r => r.slug === 'bedroom' || (r.name && r.name.toLowerCase().includes('ngủ'))) || rooms[1] || rooms[0];
    const kitchenRoom = rooms.find(r => r.slug === 'kitchen' || (r.name && r.name.toLowerCase().includes('bếp'))) || rooms[2] || rooms[0];
    const diningRoom = rooms.find(r => r.slug === 'dining-room' || (r.name && r.name.toLowerCase().includes('ăn'))) || rooms[3] || rooms[0];
    const bathRoom = rooms.find(r => r.slug === 'bathroom' || (r.name && r.name.toLowerCase().includes('tắm'))) || rooms[4] || rooms[0];

    // 2. Đảm bảo danh mục (Categories)
    let categories = await Category.find().lean();
    const catMap = {};
    categories.forEach(c => { catMap[c.slug] = c._id; });

    const ensureCategory = async (slug, name, code) => {
      let cat = await Category.findOne({ slug });
      if (!cat) {
        cat = await Category.create({ code, name, slug, displayOrder: Object.keys(catMap).length + 1, isActive: true });
      } else if (!cat.code) {
        cat = await Category.findByIdAndUpdate(cat._id, { $set: { code, name } }, { new: true });
      }
      catMap[slug] = cat._id;
      return catMap[slug];
    };

    await ensureCategory('sofas', 'Sofa & Armchair', 'CAT-SOFA');
    await ensureCategory('coffee-tables', 'Bàn trà & Bàn cà phê', 'CAT-TABLE');
    await ensureCategory('chairs', 'Ghế thư giãn & Ghế ăn', 'CAT-CHAIR');
    await ensureCategory('beds', 'Giường ngủ', 'CAT-BED');
    await ensureCategory('mattresses', 'Nệm', 'CAT-MATTRESS');
    await ensureCategory('wardrobes', 'Tủ quần áo & Lưu trữ', 'CAT-WARDROBE');
    await ensureCategory('bedding', 'Bộ chăn ga', 'CAT-BEDDING');
    await ensureCategory('lighting', 'Đèn & Chiếu sáng', 'CAT-LIGHT');
    await ensureCategory('rugs', 'Thảm trải sàn', 'CAT-RUG');
    await ensureCategory('cabinets', 'Tủ bếp & Kệ', 'CAT-CABINET');
    await ensureCategory('dining-tables', 'Bàn ăn', 'CAT-DINING');
    await ensureCategory('mirrors', 'Gương & Phụ kiện', 'CAT-MIRROR');
    await ensureCategory('towels', 'Khăn tắm & Phụ kiện', 'CAT-TOWEL');

    // 3. Khởi tạo 50 sản phẩm (10 sản phẩm mỗi phòng) - hình ảnh chuẩn xác, sắc nét và liên quan 100%
    const productSpecs = [
      // ====== PHÒNG KHÁCH (10 sản phẩm) ======
      {
        sku: 'LIV-SOFA-001',
        name: 'Sofa Vải Nỉ Bắc Âu Minimalist',
        slug: 'sofa-vai-ni-bac-au-minimalist',
        cat: 'sofas',
        room: livingRoom,
        price: 12500000,
        salePrice: 10990000,
        thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'],
        description: 'Sofa phong cách Bắc Âu với khung gỗ sồi tự nhiên và đệm bọt biển đàn hồi cao, chống xẹp lún.',
        dimensions: { length: 210, width: 90, height: 85, weight: 45 },
        materials: ['Khung gỗ sồi', 'Vải nỉ cao cấp'],
        colors: ['Xám tro', 'Be nhạt'],
        isFeatured: true,
        badge: 'Bán chạy',
      },
      {
        sku: 'LIV-SOFA-002',
        name: 'Sofa Da Bò Ý Carina Luxury',
        slug: 'sofa-da-bo-y-carina-luxury',
        cat: 'sofas',
        room: livingRoom,
        price: 28900000,
        salePrice: 25500000,
        thumbnail: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80'],
        description: 'Sofa da bò Ý cao cấp, đường may thủ công tỉ mỉ mang lại đẳng cấp vượt thời gian cho phòng khách.',
        dimensions: { length: 240, width: 95, height: 88, weight: 60 },
        materials: ['Da bò nhập khẩu Ý', 'Khung thép mạ PVD'],
        colors: ['Nâu Cognac', 'Đen huyền bí'],
        isFeatured: true,
        badge: 'Cao cấp',
      },
      {
        sku: 'LIV-COF-003',
        name: 'Bàn Trà Tròn Mặt Đá Cẩm Thạch Orbit',
        slug: 'ban-tra-tron-mat-da-cam-thach-orbit',
        cat: 'coffee-tables',
        room: livingRoom,
        price: 5600000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1533090161767-e6ffed986b88?auto=format&fit=crop&w=800&q=80'],
        description: 'Bàn trà đôi mặt đá Marble vân mây tự nhiên, chống ố chống trầy, chân kim loại sơn tĩnh điện sang trọng.',
        dimensions: { length: 80, width: 80, height: 45, weight: 22 },
        materials: ['Đá Marble', 'Khung kim loại'],
        colors: ['Trắng vân mây', 'Đen tia chớp'],
        isFeatured: false,
        badge: 'Mới',
      },
      {
        sku: 'LIV-COF-004',
        name: 'Bàn Trà Gỗ Sồi Tự Nhiên Scandi Wave',
        slug: 'ban-tra-go-soi-tu-nhien-scandi-wave',
        cat: 'coffee-tables',
        room: livingRoom,
        price: 4200000,
        salePrice: 3780000,
        thumbnail: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80'],
        description: 'Bàn trà hình oval uốn cong nhẹ nhàng phong cách Bắc Âu, chất liệu gỗ sồi FAS hoàn thiện mờ.',
        dimensions: { length: 110, width: 55, height: 42, weight: 14 },
        materials: ['Gỗ sồi tự nhiên'],
        colors: ['Gỗ mộc', 'Gỗ nâu óc chó'],
        isFeatured: false,
      },
      {
        sku: 'LIV-ARM-005',
        name: 'Ghế Armchair Thư Giãn Oslo Velvet',
        slug: 'ghe-armchair-thu-gian-oslo-velvet',
        cat: 'chairs',
        room: livingRoom,
        price: 6800000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'],
        description: 'Ghế đơn bọc vải nhung mềm mại với tựa lưng ôm sát công thái học, chân gỗ tiện tròn thanh lịch.',
        dimensions: { length: 82, width: 78, height: 86, weight: 18 },
        materials: ['Vải nhung tuyết', 'Gỗ tần bì'],
        colors: ['Vàng mù tạt', 'Xanh ngọc lục bảo'],
        isFeatured: true,
      },
      {
        sku: 'LIV-ARM-006',
        name: 'Ghế Thư Giãn Lounge Nordic Minimal',
        slug: 'ghe-thu-gian-lounge-nordic-minimal',
        cat: 'chairs',
        room: livingRoom,
        price: 5200000,
        salePrice: 4500000,
        thumbnail: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80'],
        description: 'Ghế thư giãn kiểu dáng Scandi tối giản cực êm ái, thích hợp đọc sách và nghe nhạc thư giãn cuối tuần.',
        dimensions: { length: 90, width: 75, height: 88, weight: 16 },
        materials: ['Vải dệt tự nhiên', 'Khung gỗ sồi'],
        colors: ['Trắng kem', 'Xám nhạt'],
        isFeatured: false,
      },
      {
        sku: 'LIV-RUG-007',
        name: 'Thảm Trải Sàn Len Dệt Thủ Công Nordic',
        slug: 'tham-trai-san-len-det-thu-cong-nordic',
        cat: 'rugs',
        room: livingRoom,
        price: 3800000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80'],
        description: 'Thảm trải sàn họa tiết hình học trừu tượng, dệt từ sợi len New Zealand êm chân, không rụng lông.',
        dimensions: { length: 230, width: 160, height: 1.5, weight: 8 },
        materials: ['Len New Zealand', 'Sợi bông tự nhiên'],
        colors: ['Họa tiết xám be', 'Đơn sắc tối giản'],
        isFeatured: false,
      },
      {
        sku: 'LIV-LGT-008',
        name: 'Đèn Cây Đứng Phòng Khách Arco Brass',
        slug: 'den-cay-dung-phong-khach-arco-brass',
        cat: 'lighting',
        room: livingRoom,
        price: 2900000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'],
        description: 'Đèn cây cần vươn uốn cong thanh thoát, chao đèn đồng thau xước bóng mờ cổ điển.',
        dimensions: { length: 90, width: 35, height: 185, weight: 9 },
        materials: ['Đồng thau', 'Đế đá cẩm thạch'],
        colors: ['Vàng đồng', 'Đen mờ'],
        isFeatured: false,
      },
      {
        sku: 'LIV-TVC-009',
        name: 'Kệ Tivi Gỗ Óc Chó Treo Tường Horizon',
        slug: 'ke-tivi-go-oc-cho-treo-tuong-horizon',
        cat: 'cabinets',
        room: livingRoom,
        price: 8900000,
        salePrice: 7900000,
        thumbnail: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80'],
        description: 'Kệ tivi dáng treo bay hiện đại, 3 ngăn kéo ray giảm chấn thông minh giấu dây điện gọn gàng.',
        dimensions: { length: 200, width: 38, height: 32, weight: 28 },
        materials: ['Gỗ óc chó Bắc Mỹ'],
        colors: ['Nâu hạt dẻ'],
        isFeatured: false,
      },
      {
        sku: 'LIV-MIR-010',
        name: 'Gương Soi Nghệ Thuật Khung Kim Loại Eclipse',
        slug: 'guong-soi-nghe-thuat-khung-kim-loai-eclipse',
        cat: 'mirrors',
        room: livingRoom,
        price: 3200000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'],
        description: 'Gương tròn lồi viền kim loại kép tạo hiệu ứng không gian sâu và phản chiếu ánh sáng tuyệt vời.',
        dimensions: { length: 80, width: 4, height: 80, weight: 6 },
        materials: ['Kính tráng bạc Bỉ', 'Hợp kim nhôm mạ'],
        colors: ['Vàng kim', 'Đen titan'],
        isFeatured: false,
      },

      // ====== PHÒNG NGỦ (10 sản phẩm) ======
      {
        sku: 'BED-WOOD-001',
        name: 'Giường Ngủ Gỗ Sồi Tự Nhiên Zen Silence 1m8',
        slug: 'giuong-ngu-go-soi-tu-nhien-zen-silence-1m8',
        cat: 'beds',
        room: bedRoom,
        price: 16800000,
        salePrice: 14900000,
        thumbnail: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80'],
        description: 'Giường ngủ phong cách Nhật Bản tối giản, nan giường gỗ thông thoáng khí, đầu giường bo góc mềm mại.',
        dimensions: { length: 215, width: 190, height: 95, weight: 75 },
        materials: ['Gỗ sồi Nga FAS', 'Sơn thực vật an toàn'],
        colors: ['Gỗ sồi sáng', 'Gỗ óc chó'],
        isFeatured: true,
        badge: 'Ưu đãi',
      },
      {
        sku: 'BED-UPH-002',
        name: 'Giường Bọc Nệm Nỉ Cao Cấp Cloud Luxury 2m',
        slug: 'giuong-boc-nem-ni-cao-cap-cloud-luxury-2m',
        cat: 'beds',
        room: bedRoom,
        price: 21500000,
        salePrice: 19200000,
        thumbnail: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?auto=format&fit=crop&w=800&q=80'],
        description: 'Đầu giường bọc đệm êm ái tựa như mây, khung giường bọc vải dệt kháng khuẩn cao cấp chống bám bụi.',
        dimensions: { length: 220, width: 210, height: 110, weight: 85 },
        materials: ['Khung thép & gỗ thông', 'Vải nỉ Bỉ'],
        colors: ['Xám ngọc trai', 'Xanh khói'],
        isFeatured: true,
      },
      {
        sku: 'BED-MAT-003',
        name: 'Nệm Lò Xo Túi Độc Lập Orthopedic Hybrid',
        slug: 'nem-lo-xo-tui-doc-lap-orthopedic-hybrid',
        cat: 'mattresses',
        room: bedRoom,
        price: 11200000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'],
        description: 'Hệ thống lò xo túi nâng đỡ 7 vùng cột sống, bề mặt gel memory foam làm mát độc quyền.',
        dimensions: { length: 200, width: 180, height: 26, weight: 38 },
        materials: ['Thép tôi luyện nhiệt', 'Memory foam gel'],
        colors: ['Trắng phối viền xám'],
        isFeatured: false,
      },
      {
        sku: 'BED-MAT-004',
        name: 'Nệm Cao Su Thiên Nhiên Pure Latex 15cm',
        slug: 'nem-cao-su-thien-nhien-pure-latex-15cm',
        cat: 'mattresses',
        room: bedRoom,
        price: 15600000,
        salePrice: 13800000,
        thumbnail: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=800&q=80'],
        description: '100% mủ cao su thiên nhiên không hóa chất, độ đàn hồi tự nhiên tối ưu giúp chống đau lưng kinh niên.',
        dimensions: { length: 200, width: 180, height: 15, weight: 42 },
        materials: ['100% Cao su thiên nhiên'],
        colors: ['Vàng nhạt tự nhiên'],
        isFeatured: false,
      },
      {
        sku: 'BED-WAR-005',
        name: 'Tủ Quần Áo Cánh Lùa Kịch Trần Modula 4 Cánh',
        slug: 'tu-quan-ao-canh-lua-kich-tran-modula-4-canh',
        cat: 'wardrobes',
        room: bedRoom,
        price: 22000000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=800&q=80'],
        description: 'Hệ tủ module tùy biến ngăn chứa, ray trượt êm ái chống ồn, tích hợp đèn Led chiếu sáng cảm ứng.',
        dimensions: { length: 220, width: 60, height: 240, weight: 110 },
        materials: ['Gỗ công nghiệp lõi xanh HDF', 'Kính mờ'],
        colors: ['Trắng nhám', 'Gỗ sồi sáng'],
        isFeatured: false,
      },
      {
        sku: 'BED-TAB-006',
        name: 'Tủ Đầu Giường 2 Ngăn Kéo Gỗ Tần Bì',
        slug: 'tu-dau-giuong-2-ngan-keo-go-tan-bi',
        cat: 'cabinets',
        room: bedRoom,
        price: 2400000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80'],
        description: 'Thiết kế góc tròn bảo vệ trẻ nhỏ, ngăn kéo ray âm Hafele trượt nhẹ không phát tiếng kêu.',
        dimensions: { length: 48, width: 40, height: 50, weight: 11 },
        materials: ['Gỗ tần bì tự nhiên'],
        colors: ['Màu gỗ tự nhiên', 'Màu nâu óc chó'],
        isFeatured: false,
      },
      {
        sku: 'BED-LIN-007',
        name: 'Bộ Drap Giường Lụa Tencel 80S Cao Cấp',
        slug: 'bo-drap-giuong-lua-tencel-80s-cao-cap',
        cat: 'bedding',
        room: bedRoom,
        price: 3500000,
        salePrice: 2950000,
        thumbnail: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'],
        description: 'Chất liệu sợi bạch đàn sinh học thoáng mát vượt trội, mềm mượt như lụa tự nhiên, kháng khuẩn da nhạy cảm.',
        dimensions: { length: 200, width: 180, height: 30, weight: 3 },
        materials: ['Lụa Tencel 80S'],
        colors: ['Xanh sage', 'Xám bạc', 'Hồng tro'],
        isFeatured: false,
      },
      {
        sku: 'BED-LAM-008',
        name: 'Đèn Ngủ Đầu Giường Ánh Sáng Ấm Dimmable',
        slug: 'den-ngu-dau-giuong-anh-sang-am-dimmable',
        cat: 'lighting',
        room: bedRoom,
        price: 1450000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80'],
        description: 'Điều chỉnh độ sáng 3 cấp độ chạm cảm ứng, nhiệt độ màu 3000K giúp mắt dễ đi vào giấc ngủ sâu.',
        dimensions: { length: 20, width: 20, height: 38, weight: 2.2 },
        materials: ['Gốm sứ tráng men', 'Chao vải lanh'],
        colors: ['Trắng ngà', 'Gốm nung mộc'],
        isFeatured: false,
      },
      {
        sku: 'BED-DRE-009',
        name: 'Bàn Trang Điểm Kèm Gương Led Thông Minh',
        slug: 'ban-trang-diem-kem-guong-led-thong-minh',
        cat: 'cabinets',
        room: bedRoom,
        price: 6900000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80'],
        description: 'Mặt bàn sang trọng chống trầy, ngăn kéo ray giảm chấn, phong cách thanh lịch cho phòng ngủ.',
        dimensions: { length: 100, width: 45, height: 130, weight: 26 },
        materials: ['Gỗ MDF chống ẩm', 'Kính cường lực'],
        colors: ['Trắng phối chân vàng'],
        isFeatured: false,
      },
      {
        sku: 'BED-BEN-010',
        name: 'Ghế Đôn Cuối Giường Bọc Nhung Sang Trọng',
        slug: 'ghe-don-cuoi-giuong-boc-nhung-sang-trong',
        cat: 'chairs',
        room: bedRoom,
        price: 3100000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1580481077195-c96769493c68?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1580481077195-c96769493c68?auto=format&fit=crop&w=800&q=80'],
        description: 'Đôn dài đặt cuối giường tiện lợi để thay đồ, đệm may chần quả trám phong cách cổ điển thanh lịch.',
        dimensions: { length: 130, width: 45, height: 46, weight: 14 },
        materials: ['Vải nhung cao cấp', 'Khung gỗ sồi'],
        colors: ['Xám tro', 'Xanh navy'],
        isFeatured: false,
      },

      // ====== PHÒNG BẾP (10 sản phẩm) ======
      {
        sku: 'KIT-ISL-001',
        name: 'Đảo Bếp Di Động Mặt Đá Ceramic Chef Master',
        slug: 'dao-bep-di-dong-mat-da-ceramic-chef-master',
        cat: 'cabinets',
        room: kitchenRoom,
        price: 14500000,
        salePrice: 12800000,
        thumbnail: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'],
        description: 'Đảo bếp đa năng tích hợp ngăn kéo đựng dao thớt, giá để rượu và bánh xe có khóa hãm chịu tải 200kg.',
        dimensions: { length: 140, width: 75, height: 90, weight: 65 },
        materials: ['Mặt đá Ceramic chống ố', 'Gỗ tần bì'],
        colors: ['Trắng Carrara', 'Xám bê tông'],
        isFeatured: true,
        badge: 'Hot',
      },
      {
        sku: 'KIT-CAB-002',
        name: 'Hệ Kệ Tủ Bếp Dưới Chống Ẩm Melamine Pro',
        slug: 'he-ke-tu-bep-duoi-chong-am-melamine-pro',
        cat: 'cabinets',
        room: kitchenRoom,
        price: 18900000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=800&q=80'],
        description: 'Vật liệu cốt xanh chống nước tuyệt đối, ray trượt Blum giảm chấn bền bỉ trên 100.000 lần đóng mở.',
        dimensions: { length: 240, width: 60, height: 82, weight: 90 },
        materials: ['HDF chống ẩm An Cường', 'Bản lề Blum'],
        colors: ['Xanh Olive', 'Xám mờ Slate'],
        isFeatured: false,
      },
      {
        sku: 'KIT-CHR-003',
        name: 'Ghế Quầy Bar Bọc Da Chân Sắt Sơn Tĩnh Điện',
        slug: 'ghe-quay-bar-boc-da-chan-sat-son-tinh-dien',
        cat: 'chairs',
        room: kitchenRoom,
        price: 1950000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80'],
        description: 'Ghế bar chiều cao 75cm chuẩn đảo bếp, đệm mút định hình bọc da PU chống thấm nước dễ lau dầu mỡ.',
        dimensions: { length: 44, width: 44, height: 98, weight: 7 },
        materials: ['Da PU cao cấp', 'Thép ống sơn đen'],
        colors: ['Nâu da bò', 'Đen nhám'],
        isFeatured: false,
      },
      {
        sku: 'KIT-CHR-004',
        name: 'Ghế Bar Gỗ Sồi Tự Nhiên Nordic Stool',
        slug: 'ghe-bar-go-soi-tu-nhien-nordic-stool',
        cat: 'chairs',
        room: kitchenRoom,
        price: 1650000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=800&q=80'],
        description: 'Mặt ghế uốn cong nhẹ ôm mông, gác chân kim loại bọc đồng chống trầy xước đế gỗ.',
        dimensions: { length: 42, width: 42, height: 72, weight: 6 },
        materials: ['Gỗ sồi tự nhiên'],
        colors: ['Gỗ tự nhiên sáng'],
        isFeatured: false,
      },
      {
        sku: 'KIT-SHE-005',
        name: 'Kệ Gia Vị & Dao Thớt Inox 304 Kháng Khuẩn',
        slug: 'ke-gia-vi-va-dao-thot-inox-304-khang-khuan',
        cat: 'cabinets',
        room: kitchenRoom,
        price: 1250000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1584269600519-112d071b35e6?auto=format&fit=crop&w=800&q=80'],
        description: 'Chất liệu inox SUS 304 không rỉ sét trọn đời, khay hứng nước tháo rời tiện lợi giữ bếp luôn khô thoáng.',
        dimensions: { length: 45, width: 22, height: 42, weight: 3.5 },
        materials: ['Inox 304 cao cấp'],
        colors: ['Inox bóng xước'],
        isFeatured: false,
      },
      {
        sku: 'KIT-CAR-006',
        name: 'Xe Đẩy Bếp Đa Năng 3 Tầng Bánh Xe Xoay',
        slug: 'xe-day-bep-da-nang-3-tang-banh-xe-xoay',
        cat: 'cabinets',
        room: kitchenRoom,
        price: 2100000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1590725140246-2015fa689408?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1590725140246-2015fa689408?auto=format&fit=crop&w=800&q=80'],
        description: 'Tối ưu không gian bếp nhỏ, chứa rau củ, đồ khô và nồi chiên không dầu dễ dàng di chuyển mọi nơi.',
        dimensions: { length: 50, width: 35, height: 85, weight: 6 },
        materials: ['Khung thép carbon', 'Mặt gỗ tre'],
        colors: ['Trắng tinh khiết', 'Đen than'],
        isFeatured: false,
      },
      {
        sku: 'KIT-LGT-007',
        name: 'Bộ Đèn Thả Bàn Đảo Bếp Minimalist Trio',
        slug: 'bo-den-tha-ban-dao-bep-minimalist-trio',
        cat: 'lighting',
        room: kitchenRoom,
        price: 2800000,
        salePrice: 2450000,
        thumbnail: 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?auto=format&fit=crop&w=800&q=80'],
        description: 'Bộ 3 đèn thả chao nhôm hình nón hiện đại, chỉ số hoàn màu CRI > 90 giúp món ăn trông tươi ngon hấp dẫn.',
        dimensions: { length: 95, width: 20, height: 120, weight: 4 },
        materials: ['Nhôm đúc', 'Dây bọc dù'],
        colors: ['Đen nhám viền gỗ', 'Trắng viền đồng'],
        isFeatured: false,
      },
      {
        sku: 'KIT-RAC-008',
        name: 'Giá Treo Ly Rượu Vang & Rượu Treo Trần',
        slug: 'gia-treo-ly-ruou-vang-va-ruou-treo-tran',
        cat: 'cabinets',
        room: kitchenRoom,
        price: 3600000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'],
        description: 'Treo trên trần đảo bếp tạo phong cách quầy bar bistro phương Tây, treo được 18 ly vang và 8 chai rượu.',
        dimensions: { length: 100, width: 35, height: 60, weight: 9 },
        materials: ['Thép vuông sơn tĩnh điện'],
        colors: ['Đen mờ'],
        isFeatured: false,
      },
      {
        sku: 'KIT-RUG-009',
        name: 'Thảm Bếp Chống Trượt Chống Dầu Mỡ Poly Eco',
        slug: 'tham-bep-chong-truot-chong-dau-mo-poly-eco',
        cat: 'rugs',
        room: kitchenRoom,
        price: 850000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80'],
        description: 'Đế cao su bám chặt sàn nhà bếp, bề mặt kháng dầu mỡ, chỉ cần lau bằng khăn ướt là sạch bóng.',
        dimensions: { length: 120, width: 45, height: 0.8, weight: 1.8 },
        materials: ['Da PU thân thiện môi trường', 'Đế cao su non'],
        colors: ['Xám xi măng', 'Họa tiết gốm Morocco'],
        isFeatured: false,
      },
      {
        sku: 'KIT-ORG-010',
        name: 'Thùng Rác Thông Minh Cảm Ứng Khử Mùi 20L',
        slug: 'thung-rac-thong-minh-cam-ung-khu-mui-20l',
        cat: 'cabinets',
        room: kitchenRoom,
        price: 1550000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80'],
        description: 'Tự động mở nắp trong 0.3s khi quét tay, tích hợp túi khử mùi than hoạt tính ngăn mùi hôi nhà bếp.',
        dimensions: { length: 30, width: 25, height: 45, weight: 3 },
        materials: ['Thép không gỉ chống bám vân tay'],
        colors: ['Bạc ánh kim', 'Trắng ngọc'],
        isFeatured: false,
      },

      // ====== PHÒNG ĂN (10 sản phẩm) ======
      {
        sku: 'DIN-TAB-001',
        name: 'Bàn Ăn Gỗ Óc Chó Mở Rộng 6-8 Chỗ Grand',
        slug: 'ban-an-go-oc-cho-mo-rong-6-8-cho-grand',
        cat: 'dining-tables',
        room: diningRoom,
        price: 17500000,
        salePrice: 15500000,
        thumbnail: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80'],
        description: 'Bàn ăn thông minh kéo dài từ 1m6 lên 2m2 chỉ với 1 thao tác nhẹ nhàng, vân gỗ óc chó tự nhiên tuyệt mỹ.',
        dimensions: { length: 160, width: 90, height: 75, weight: 62 },
        materials: ['Gỗ óc chó Bắc Mỹ tự nhiên'],
        colors: ['Nâu chocolate tự nhiên'],
        isFeatured: true,
        badge: 'Bán chạy',
      },
      {
        sku: 'DIN-TAB-002',
        name: 'Bàn Ăn Mặt Đá Phiến Ceramic Chống Trầy Xước',
        slug: 'ban-an-mat-da-phien-ceramic-chong-tray-xuoc',
        cat: 'dining-tables',
        room: diningRoom,
        price: 13900000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=800&q=80'],
        description: 'Mặt đá phiến nung kết chịu nhiệt độ cao 1200 độ C, kháng dao kéo cào xước, chân bàn thiết kế chữ V vững chãi.',
        dimensions: { length: 180, width: 85, height: 75, weight: 58 },
        materials: ['Đá phiến Sintered Stone', 'Chân thép carbon'],
        colors: ['Trắng Ý Pandora', 'Xám tro Armani'],
        isFeatured: false,
      },
      {
        sku: 'DIN-CHR-003',
        name: 'Ghế Ăn Bọc Vải Nỉ Chân Gỗ Sồi Curve',
        slug: 'ghe-an-boc-vai-ni-chan-go-soi-curve',
        cat: 'chairs',
        room: diningRoom,
        price: 1850000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80'],
        description: 'Lưng tựa cong ôm sát sống lưng ngồi lâu không mỏi, vải nỉ dệt thô thoáng khí bốn mùa.',
        dimensions: { length: 52, width: 48, height: 82, weight: 6.5 },
        materials: ['Vải bố nỉ cao cấp', 'Gỗ sồi tự nhiên'],
        colors: ['Be sáng', 'Xám nhạt', 'Cam đất'],
        isFeatured: false,
      },
      {
        sku: 'DIN-CHR-004',
        name: 'Ghế Ăn Da Microfiber Chân Kim Loại Mạ Vàng',
        slug: 'ghe-an-da-microfiber-chan-kim-loai-ma-vang',
        cat: 'chairs',
        room: diningRoom,
        price: 2250000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'],
        description: 'Da microfiber siêu bền mềm như da thật, chân kim loại mạ vàng PVD sang trọng chuẩn phong cách Ý.',
        dimensions: { length: 50, width: 48, height: 85, weight: 7 },
        materials: ['Da Microfiber', 'Thép mạ titan PVD'],
        colors: ['Cam Hermès', 'Xanh cổ vịt', 'Ghi sáng'],
        isFeatured: false,
      },
      {
        sku: 'DIN-BEN-005',
        name: 'Ghế Băng Dài Phòng Ăn 1m4 Gỗ Tự Nhiên',
        slug: 'ghe-bang-dai-phong-an-1m4-go-tu-nhien',
        cat: 'chairs',
        room: diningRoom,
        price: 3900000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80'],
        description: 'Tối ưu chỗ ngồi cho gia đình có trẻ nhỏ, có thể đẩy gọn gàng dưới gầm bàn ăn khi không sử dụng.',
        dimensions: { length: 140, width: 38, height: 45, weight: 15 },
        materials: ['Gỗ sồi nguyên tấm'],
        colors: ['Màu gỗ tự nhiên', 'Nâu cánh gián'],
        isFeatured: false,
      },
      {
        sku: 'DIN-SID-006',
        name: 'Tủ Sideboard Đựng Chén Đĩa Khung Kính Cường Lực',
        slug: 'tu-sideboard-dung-chen-dia-khung-kinh-cuong-luc',
        cat: 'cabinets',
        room: diningRoom,
        price: 11800000,
        salePrice: 10200000,
        thumbnail: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80'],
        description: 'Tủ buffet trưng bày ly tách gốm sứ sang trọng, cửa kính sọc gợn sóng Fluted Glass thời thượng.',
        dimensions: { length: 160, width: 42, height: 85, weight: 48 },
        materials: ['Gỗ tần bì', 'Kính Fluted'],
        colors: ['Đen mờ', 'Gỗ mộc'],
        isFeatured: false,
      },
      {
        sku: 'DIN-LGT-007',
        name: 'Đèn Chùm Thả Bàn Ăn Pha Lê Nghệ Thuật Ring',
        slug: 'den-chum-tha-ban-an-pha-le-nghe-thuat-ring',
        cat: 'lighting',
        room: diningRoom,
        price: 4600000,
        salePrice: 3990000,
        thumbnail: 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=800&q=80'],
        description: 'Vòng tròn pha lê K9 khúc xạ ánh sáng lấp lánh, biến bữa cơm tối gia đình thành không gian nhà hàng sang trọng.',
        dimensions: { length: 80, width: 80, height: 120, weight: 7 },
        materials: ['Pha lê K9', 'Khung inox mạ vàng'],
        colors: ['Vàng hoàng gia'],
        isFeatured: false,
      },
      {
        sku: 'DIN-RUG-008',
        name: 'Thảm Phòng Ăn Chống Bám Bẩn Easy-Clean',
        slug: 'tham-phong-an-chong-bam-ban-easy-clean',
        cat: 'rugs',
        room: diningRoom,
        price: 3200000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80'],
        description: 'Công nghệ sợi Nano kháng nước trượt giọt, nước sốt đổ ra có thể dùng khăn giấy thấm sạch ngay lập tức.',
        dimensions: { length: 240, width: 180, height: 1, weight: 6 },
        materials: ['Sợi tổng hợp Nano'],
        colors: ['Họa tiết xám khói'],
        isFeatured: false,
      },
      {
        sku: 'DIN-CAB-009',
        name: 'Tủ Rượu Cánh Kính Đèn Led Cảm Ứng Luxury',
        slug: 'tu-ruou-canh-kinh-den-led-cam-ung-luxury',
        cat: 'cabinets',
        room: diningRoom,
        price: 16500000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80'],
        description: 'Tủ rượu kịch trần cánh nhôm kính xám khói, tích hợp giá treo ly và khay nằm giữ ẩm nút bần rượu vang.',
        dimensions: { length: 100, width: 40, height: 210, weight: 70 },
        materials: ['Gỗ MDF An Cường', 'Kính cường lực màu trà'],
        colors: ['Gỗ đen vân mờ'],
        isFeatured: false,
      },
      {
        sku: 'DIN-TOW-010',
        name: 'Khăn Trải Bàn Linen Dệt Tự Nhiên Chống Thấm',
        slug: 'khan-trai-ban-linen-det-tu-nhien-chong-tham',
        cat: 'towels',
        room: diningRoom,
        price: 650000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1616627547584-bf28cee262db?auto=format&fit=crop&w=800&q=80'],
        description: 'Vải lanh tự nhiên thô mộc phong cách Pháp, viền rua nhẹ nhàng tinh tế giữ bàn ăn luôn sạch sẽ.',
        dimensions: { length: 220, width: 140, height: 0.2, weight: 0.8 },
        materials: ['100% Linen hữu cơ'],
        colors: ['Màu be mộc', 'Xám lông chuột'],
        isFeatured: false,
      },

      // ====== PHÒNG TẮM (10 sản phẩm) ======
      {
        sku: 'BAT-VAN-001',
        name: 'Tủ Lavabo Treo Tường Mặt Đá Chống Ẩm V-Clean',
        slug: 'tu-lavabo-treo-tuong-mat-da-chong-am-v-clean',
        cat: 'cabinets',
        room: bathRoom,
        price: 9500000,
        salePrice: 8200000,
        thumbnail: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'],
        description: 'Tủ chậu chất liệu nhựa PVC đúc đặc chống nước 100%, chậu sứ âm bàn tráng men nano chống bám bẩn ố vàng.',
        dimensions: { length: 90, width: 50, height: 48, weight: 32 },
        materials: ['Nhựa PVC nguyên sinh', 'Sứ phủ men tuyết'],
        colors: ['Trắng bóng', 'Vân gỗ Teak'],
        isFeatured: true,
        badge: 'Chống nước 100%',
      },
      {
        sku: 'BAT-MIR-002',
        name: 'Gương Phòng Tắm Tròn Đèn Led Sấy Mờ Cảm Ứng',
        slug: 'guong-phong-tam-tron-den-led-say-mo-cam-ung',
        cat: 'mirrors',
        room: bathRoom,
        price: 2700000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80'],
        description: 'Tích hợp chức năng sấy nhiệt tan sương mờ hơi nước khi tắm nước nóng, đèn led vô cực sang trọng.',
        dimensions: { length: 70, width: 3, height: 70, weight: 5 },
        materials: ['Kính tráng bạc 8 lớp', 'Dải led Samsung'],
        colors: ['Led ánh sáng trắng', 'Led ánh sáng vàng'],
        isFeatured: false,
      },
      {
        sku: 'BAT-MIR-003',
        name: 'Tủ Gương Soi Phòng Tắm 2 Cánh Tiện Dụng',
        slug: 'tu-guong-soi-phong-tam-2-canh-tien-dung',
        cat: 'mirrors',
        room: bathRoom,
        price: 3800000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80'],
        description: 'Kết hợp gương soi và kho lưu trữ mỹ phẩm bàn chải dầu gội kín đáo, giải phóng không gian mặt bàn lavabo.',
        dimensions: { length: 75, width: 14, height: 70, weight: 14 },
        materials: ['Hợp kim nhôm hàng không', 'Gương chống mốc'],
        colors: ['Xám kim loại xước'],
        isFeatured: false,
      },
      {
        sku: 'BAT-LGT-004',
        name: 'Đèn Hắt Tường Chống Ẩm IP65 Warm Glow',
        slug: 'den-hat-tuong-chong-am-ip65-warm-glow',
        cat: 'lighting',
        room: bathRoom,
        price: 1350000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80'],
        description: 'Chuẩn chống nước giọt bắn và hơi ẩm IP65, ánh sáng hắt 2 chiều mềm mại tạo cảm giác thư giãn như spa.',
        dimensions: { length: 30, width: 8, height: 6, weight: 1.2 },
        materials: ['Hợp kim nhôm sơn nano'],
        colors: ['Đen nhám', 'Vàng champagne'],
        isFeatured: false,
      },
      {
        sku: 'BAT-RAC-005',
        name: 'Kệ Để Khăn Tắm Đa Năng Sấy Nhiệt Thông Minh',
        slug: 'ke-de-khan-tam-da-nang-say-nhiet-thong-minh',
        cat: 'towels',
        room: bathRoom,
        price: 3900000,
        salePrice: 3400000,
        thumbnail: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80'],
        description: 'Thanh sấy điện sợi carbon làm khô khăn tắm trong 2 giờ, diệt khuẩn 99% chống ẩm mốc mùi khó chịu.',
        dimensions: { length: 65, width: 12, height: 50, weight: 4.8 },
        materials: ['Thép carbon tản nhiệt'],
        colors: ['Đen huyền', 'Trắng sứ'],
        isFeatured: false,
      },
      {
        sku: 'BAT-TOW-006',
        name: 'Set 4 Khăn Tắm Sợi Tre Kháng Khuẩn Eco Bamboo',
        slug: 'set-4-khan-tam-soi-tre-khang-khuan-eco-bamboo',
        cat: 'towels',
        room: bathRoom,
        price: 790000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1616627547584-bf28cee262db?auto=format&fit=crop&w=800&q=80'],
        description: 'Sợi tre thiên nhiên dệt mật độ cao 600 GSM thấm hút nước gấp 3 lần cotton thường, mềm mại với làn da em bé.',
        dimensions: { length: 140, width: 70, height: 1, weight: 1.2 },
        materials: ['70% Sợi tre bamboo', '30% Cotton Organic'],
        colors: ['Xanh mint', 'Xám nhạt', 'Trắng tuyết'],
        isFeatured: false,
      },
      {
        sku: 'BAT-MAT-007',
        name: 'Thảm Đá Siêu Hút Nước Diatomite Khô Nhanh',
        slug: 'tham-da-sieu-hut-nuoc-diatomite-kho-nhanh',
        cat: 'rugs',
        room: bathRoom,
        price: 450000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80'],
        description: 'Đá khoáng Diatomite tự nhiên thấm khô lòng bàn chân trong 10 giây, tự bay hơi không đọng ẩm, chống trượt an toàn.',
        dimensions: { length: 60, width: 39, height: 0.9, weight: 2.1 },
        materials: ['Đá Diatomite tự nhiên'],
        colors: ['Xám cẩm thạch', 'Hồng nhạt'],
        isFeatured: false,
      },
      {
        sku: 'BAT-CAB-008',
        name: 'Kệ Góc Phòng Tắm Inox Sơn Tĩnh Điện Không Khoan',
        slug: 'ke-goc-phong-tam-inox-son-tinh-dien-khong-khoan',
        cat: 'cabinets',
        room: bathRoom,
        price: 680000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1584269600519-112d071b35e6?auto=format&fit=crop&w=800&q=80'],
        description: 'Dán tường bằng keo siêu cường chịu lực 15kg không cần khoan đục gạch, nan thoát nước chống đọng xà phòng.',
        dimensions: { length: 30, width: 22, height: 8, weight: 1.1 },
        materials: ['Inox 304'],
        colors: ['Đen mờ'],
        isFeatured: false,
      },
      {
        sku: 'BAT-STN-009',
        name: 'Ghế Ngồi Phòng Tắm Gỗ Tràm Chịu Nước Spa',
        slug: 'ghe-ngoi-phong-tam-go-tram-chiu-nuoc-spa',
        cat: 'chairs',
        room: bathRoom,
        price: 1200000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=800&q=80'],
        description: 'Gỗ tràm tự nhiên sấy tẩm dầu chống mối mọt mục rữa trong môi trường nước, chân cao su chống trượt.',
        dimensions: { length: 45, width: 30, height: 42, weight: 3.8 },
        materials: ['Gỗ tràm bông vàng tự nhiên'],
        colors: ['Màu gỗ tự nhiên'],
        isFeatured: false,
      },
      {
        sku: 'BAT-ORG-010',
        name: 'Bộ Nhả Xà Phòng Cảm Ứng Tự Động Cao Cấp',
        slug: 'bo-nha-xa-phong-cam-ung-tu-dong-cao-cap',
        cat: 'mirrors',
        room: bathRoom,
        price: 850000,
        salePrice: null,
        thumbnail: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'],
        description: 'Cảm ứng hồng ngoại tạo bọt mịn trong 0.25 giây, pin sạc Type-C dùng 3 tháng cho 1 lần sạc đầy.',
        dimensions: { length: 12, width: 8, height: 20, weight: 0.6 },
        materials: ['Nhựa ABS nguyên sinh'],
        colors: ['Trắng nhám phối xám'],
        isFeatured: false,
      },
    ];

    const seededProductIdsByRoom = {
      'living-room': [],
      'bedroom': [],
      'kitchen': [],
      'dining-room': [],
      'bathroom': [],
    };

    let createdProductCount = 0;
    let updatedProductCount = 0;

    for (const spec of productSpecs) {
      const room = spec.room;
      const catId = catMap[spec.cat];

      const productData = {
        sku: spec.sku,
        name: spec.name,
        slug: spec.slug,
        categoryId: catId,
        categorySlug: spec.cat,
        roomIds: [room._id],
        roomSlugs: [room.slug],
        price: spec.price,
        salePrice: spec.salePrice || null,
        stockQuantity: Math.floor(Math.random() * 40) + 15,
        stockStatus: 'in_stock',
        thumbnail: spec.thumbnail,
        images: spec.images,
        description: spec.description,
        dimensions: spec.dimensions,
        materials: spec.materials,
        colors: spec.colors,
        averageRating: 0,
        totalReviews: 0,
        status: 'active',
        isActive: true,
        isFeatured: !!spec.isFeatured,
        badge: spec.badge || '',
        soldQuantity: 0,
      };

      const existing = await Product.findOne({ sku: spec.sku });
      let pDoc;
      if (existing) {
        pDoc = await Product.findByIdAndUpdate(existing._id, { $set: productData }, { new: true });
        updatedProductCount++;
      } else {
        pDoc = await Product.create(productData);
        createdProductCount++;
      }

      if (room.slug && seededProductIdsByRoom[room.slug]) {
        seededProductIdsByRoom[room.slug].push(pDoc._id);
      }
    }

    console.log(`✅ [Products] Đã khởi tạo/cập nhật 50 sản phẩm (Tạo mới: ${createdProductCount}, Cập nhật: ${updatedProductCount}).`);

    // 4. Khởi tạo 10 không gian (2 không gian mỗi phòng)
    const spacesSpecs = [
      // ====== PHÒNG KHÁCH (2 không gian) ======
      {
        code: 'KG-LIV-01',
        name: 'Phòng khách Scandinavian Horizon',
        room: livingRoom,
        file3DUrl: 'living_room_penthouse.glb',
        previewImage: livingRoom.thumbnail || '/images/rooms/living-room.png',
        dimensions: { length: 7.5, width: 4.5, height: 2.8 },
        description: 'Không gian mở đón trọn ánh sáng tự nhiên với bảng màu gỗ sồi và xám khói, phong cách Bắc Âu Hiện Đại.',
        products: seededProductIdsByRoom['living-room'].slice(0, 5),
      },
      {
        code: 'KG-LIV-02',
        name: 'Phòng khách Panorama Luxury Modern',
        room: livingRoom,
        file3DUrl: 'living_room_penthouse.glb',
        previewImage: livingRoom.thumbnail || '/images/rooms/living-room.png',
        dimensions: { length: 8.0, width: 5.0, height: 3.0 },
        description: 'Thiết kế phòng khách sang trọng, kết hợp vật liệu da bò Ý, kim loại titan và đá cẩm thạch Calacatta.',
        products: seededProductIdsByRoom['living-room'].slice(5, 10),
      },

      // ====== PHÒNG NGỦ (2 không gian) ======
      {
        code: 'KG-BED-01',
        name: 'Phòng ngủ Master Suite Zen Tĩnh Lặng',
        room: bedRoom,
        file3DUrl: 'master_bedroom_zen.glb',
        previewImage: bedRoom.thumbnail || '/images/rooms/bedroom.png',
        dimensions: { length: 6.0, width: 4.2, height: 2.8 },
        description: 'Không gian tĩnh tại phong cách Wabi-Sabi kết hợp Japandi, tối ưu giấc ngủ và cân bằng cảm xúc.',
        products: seededProductIdsByRoom['bedroom'].slice(0, 5),
      },
      {
        code: 'KG-BED-02',
        name: 'Phòng ngủ Minimalist Warm Oak',
        room: bedRoom,
        file3DUrl: 'master_bedroom_zen.glb',
        previewImage: bedRoom.thumbnail || '/images/rooms/bedroom.png',
        dimensions: { length: 5.5, width: 3.8, height: 2.8 },
        description: 'Phòng ngủ tối giản với chất liệu gỗ sồi ấm cúng, thiết kế tủ âm tường thông minh và ánh sáng dịu êm.',
        products: seededProductIdsByRoom['bedroom'].slice(5, 10),
      },

      // ====== PHÒNG BẾP (2 không gian) ======
      {
        code: 'KG-KIT-01',
        name: 'Phòng bếp Gourmet Island Đương Đại',
        room: kitchenRoom,
        file3DUrl: 'gourmet_kitchen.glb',
        previewImage: kitchenRoom.thumbnail || '/images/rooms/kitchen.png',
        dimensions: { length: 5.5, width: 4.0, height: 2.8 },
        description: 'Thiết kế đảo bếp trung tâm bề mặt đá thạch anh, hệ tủ kịch trần tích hợp phụ kiện thông minh.',
        products: seededProductIdsByRoom['kitchen'].slice(0, 5),
      },
      {
        code: 'KG-KIT-02',
        name: 'Phòng bếp Mộc Mạc Cozy Nordic',
        room: kitchenRoom,
        file3DUrl: 'gourmet_kitchen.glb',
        previewImage: kitchenRoom.thumbnail || '/images/rooms/kitchen.png',
        dimensions: { length: 4.8, width: 3.5, height: 2.8 },
        description: 'Gian bếp ấm cúng kiểu Bắc Âu, phối hợp tủ bếp màu xanh olive và tay nắm đồng cổ điển.',
        products: seededProductIdsByRoom['kitchen'].slice(5, 10),
      },

      // ====== PHÒNG ĂN (2 không gian) ======
      {
        code: 'KG-DIN-01',
        name: 'Phòng ăn Sum Vầy Harmony 8 Chỗ',
        room: diningRoom,
        file3DUrl: 'harmony_dining.glb',
        previewImage: diningRoom.thumbnail || '/images/rooms/dining-room.png',
        dimensions: { length: 6.2, width: 4.0, height: 2.8 },
        description: 'Không gian tiệc gia đình sang trọng với bàn ăn gỗ óc chó nguyên tấm và đèn chùm thả nghệ thuật.',
        products: seededProductIdsByRoom['dining-room'].slice(0, 5),
      },
      {
        code: 'KG-DIN-02',
        name: 'Phòng ăn Tối Giản Scandinavian Vibe',
        room: diningRoom,
        file3DUrl: 'harmony_dining.glb',
        previewImage: diningRoom.thumbnail || '/images/rooms/dining-room.png',
        dimensions: { length: 5.0, width: 3.6, height: 2.8 },
        description: 'Bàn ăn tròn mở rộng kết hợp ghế bọc vải dệt tự nhiên, tối ưu diện tích cho căn hộ cao cấp.',
        products: seededProductIdsByRoom['dining-room'].slice(5, 10),
      },

      // ====== PHÒNG TẮM (2 không gian) ======
      {
        code: 'KG-BAT-01',
        name: 'Phòng tắm Oasis Spa Đá Tự Nhiên',
        room: bathRoom,
        file3DUrl: 'bathroom_spa.glb',
        previewImage: bathRoom.thumbnail || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        dimensions: { length: 4.5, width: 3.2, height: 2.8 },
        description: 'Trải nghiệm resort 5 sao tại gia với bồn tắm ngâm độc lập, đá Terrazzo cao cấp và vách kính cường lực.',
        products: seededProductIdsByRoom['bathroom'].slice(0, 5),
      },
      {
        code: 'KG-BAT-02',
        name: 'Phòng tắm Eco Relax Phong Cách Nhật',
        room: bathRoom,
        file3DUrl: 'bathroom_spa.glb',
        previewImage: bathRoom.thumbnail || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        dimensions: { length: 4.0, width: 2.8, height: 2.8 },
        description: 'Thiết kế phòng tắm khô - ướt tách biệt phong cách Onsen Nhật Bản, điểm nhấn phụ kiện gỗ Hinoki và sen tắm massage.',
        products: seededProductIdsByRoom['bathroom'].slice(5, 10),
      },
    ];

    let createdSpaceCount = 0;
    let updatedSpaceCount = 0;

    for (const s of spacesSpecs) {
      const spaceData = {
        code: s.code,
        name: s.name,
        roomId: s.room._id,
        file3DUrl: s.file3DUrl,
        previewImage: s.previewImage,
        dimensions: s.dimensions,
        description: s.description,
        suggestedProducts: s.products || [],
        isTemplate: true,
        isActive: true,
      };

      const existing = await RoomDesign.findOne({ code: s.code });
      if (existing) {
        await RoomDesign.findByIdAndUpdate(existing._id, { $set: spaceData }, { new: true });
        updatedSpaceCount++;
      } else {
        await RoomDesign.create(spaceData);
        createdSpaceCount++;
      }
    }

    console.log(`✅ [RoomDesigns] Đã khởi tạo/cập nhật 10 không gian (Tạo mới: ${createdSpaceCount}, Cập nhật: ${updatedSpaceCount}).`);

    // 5. Đồng bộ mã khách hàng và tên khách hàng chuẩn xác giữa bảng Customers và RoomDesigns
    const Customer = require('../models/Customer');
    const allCustomers = await Customer.find().sort({ createdAt: 1 });
    const custMap = new Map();
    for (let i = 0; i < allCustomers.length; i++) {
      const c = allCustomers[i];
      let cleanCode = c.code ? c.code.replace(/^#/, '').trim() : '';
      if (!cleanCode || cleanCode === 'KH-USER') {
        cleanCode = `KH-${String(i + 1).padStart(4, '0')}`;
        await Customer.findByIdAndUpdate(c._id, { $set: { code: cleanCode } });
      } else if (c.code !== cleanCode) {
        await Customer.findByIdAndUpdate(c._id, { $set: { code: cleanCode } });
      }
      custMap.set(c._id.toString(), { id: c._id, code: cleanCode, fullName: c.fullName, phone: c.phone });
    }

    // Đồng bộ lại tất cả thiết kế của khách hàng (isTemplate: false)
    const customerDesigns = await RoomDesign.find({ isTemplate: false });
    for (const d of customerDesigns) {
      let matchedCust = null;
      if (d.customerId && custMap.has(d.customerId.toString())) {
        matchedCust = custMap.get(d.customerId.toString());
      } else if (allCustomers.length > 0) {
        matchedCust = custMap.get(allCustomers[0]._id.toString());
      }

      if (matchedCust) {
        await RoomDesign.findByIdAndUpdate(d._id, {
          $set: {
            customerId: d.customerId || matchedCust.id,
            customerCode: matchedCust.code,
            customerName: matchedCust.fullName,
            customerPhone: matchedCust.phone,
          }
        });
      }
    }
    console.log(`✅ [Sync] Đã đồng bộ mã khách hàng (${allCustomers.length} khách) với danh sách thiết kế (${customerDesigns.length} thiết kế).`);

    // 6. Đồng bộ lại soldQuantity chuẩn xác 100% từ Orders (tuyệt đối không fake, chỉ có đơn mới có số lượng bán)
    const Order = require('../models/Order');
    const salesAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          sku: { $first: '$items.sku' },
          totalSold: { $sum: '$items.quantity' },
        },
      },
    ]);
    const salesById = new Map();
    const salesBySku = new Map();
    salesAgg.forEach((s) => {
      if (s._id) salesById.set(s._id.toString(), Number(s.totalSold) || 0);
      if (s.sku) salesBySku.set(s.sku.toUpperCase(), Number(s.totalSold) || 0);
    });

    const allProds = await Product.find({}).select('_id sku soldQuantity').lean();
    let resetCount = 0;
    for (const p of allProds) {
      const realSold = salesById.get(p._id.toString()) || salesBySku.get(p.sku?.toUpperCase()) || 0;
      if (p.soldQuantity !== realSold) {
        await Product.updateOne({ _id: p._id }, { $set: { soldQuantity: realSold } });
        resetCount++;
      }
    }
    console.log(`✅ [Product Sales] Đã reset/đồng bộ số lượng đã bán thực tế từ đơn hàng cho ${resetCount}/${allProds.length} sản phẩm.`);

    // 7. Đồng bộ lại averageRating và totalReviews chuẩn xác 100% từ Reviews (tuyệt đối không fake)
    const Review = require('../models/Review');
    const reviewAgg = await Review.aggregate([
      { $match: { status: 'visible' } },
      {
        $group: {
          _id: '$productId',
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);
    const reviewMap = new Map();
    reviewAgg.forEach((r) => {
      if (r._id) {
        reviewMap.set(r._id.toString(), {
          totalReviews: r.totalReviews || 0,
          averageRating: Math.round((r.avgRating || 0) * 10) / 10,
        });
      }
    });

    const allProdsWithReview = await Product.find({}).select('_id averageRating totalReviews').lean();
    let resetReviewCount = 0;
    for (const p of allProdsWithReview) {
      const realData = reviewMap.get(p._id.toString()) || { totalReviews: 0, averageRating: 0 };
      if (p.totalReviews !== realData.totalReviews || p.averageRating !== realData.averageRating) {
        await Product.updateOne(
          { _id: p._id },
          { $set: { totalReviews: realData.totalReviews, averageRating: realData.averageRating } }
        );
        resetReviewCount++;
      }
    }
    console.log(`✅ [Product Reviews] Đã reset/đồng bộ đánh giá thực tế từ CSDL Reviews cho ${resetReviewCount}/${allProdsWithReview.length} sản phẩm.`);

    return {
      success: true,
      message: 'Khởi tạo thành công 10 không gian và 50 sản phẩm.',
      spacesCount: await RoomDesign.countDocuments({ isTemplate: true }),
      productsCount: await Product.countDocuments({ isActive: true }),
    };
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu mock:', error);
    throw error;
  }
}

module.exports = seedMockSpacesAndProducts;
