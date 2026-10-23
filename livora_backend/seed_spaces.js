const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const RoomDesign = require('./src/models/RoomDesign');
const Room = require('./src/models/Room');
const Product = require('./src/models/Product');

async function seedSpaces() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find rooms
    const rooms = await Room.find({}).lean();
    console.log(`Found ${rooms.length} rooms in DB`);

    const livingRoom = rooms.find(r => r.code === 'RM-LIVING' || r.name.toLowerCase().includes('khách')) || rooms[0];
    const bedRoom = rooms.find(r => r.code === 'RM-BEDROOM' || r.name.toLowerCase().includes('ngủ')) || rooms[1] || rooms[0];
    const kitchenRoom = rooms.find(r => r.code === 'RM-KITCHEN' || r.name.toLowerCase().includes('bếp')) || rooms[2] || rooms[0];
    const diningRoom = rooms.find(r => r.code === 'RM-DINING' || r.name.toLowerCase().includes('ăn')) || rooms[3] || rooms[0];

    // Get some products
    const sampleProducts = await Product.find({}).limit(5).lean();
    const productIds = sampleProducts.map(p => p._id);

    const templates = [
      {
        code: 'KG-LIV-01',
        name: 'Phòng khách Penthouse Horizon',
        roomId: livingRoom ? livingRoom._id : null,
        file3DUrl: 'living_room_penthouse.glb',
        previewImage: '/images/rooms/living-room.png',
        dimensions: { length: 8, width: 4, height: 2.8 },
        description: 'Không gian mở đón trọn ánh sáng tự nhiên, phong cách Bắc Âu Hiện Đại.',
        suggestedProducts: productIds,
        isTemplate: true,
        isActive: true,
      },
      {
        code: 'KG-BED-01',
        name: 'Phòng ngủ Master Suite Zen',
        roomId: bedRoom ? bedRoom._id : null,
        file3DUrl: 'master_bedroom_zen.glb',
        previewImage: '/images/rooms/bedroom.png',
        dimensions: { length: 6, width: 4, height: 2.8 },
        description: 'Thiết kế tối giản giúp thư thái tinh thần và tái tạo năng lượng hoàn hảo.',
        suggestedProducts: productIds.slice(0, 3),
        isTemplate: true,
        isActive: true,
      },
      {
        code: 'KG-KIT-01',
        name: 'Phòng bếp Gourmet Island',
        roomId: kitchenRoom ? kitchenRoom._id : null,
        file3DUrl: 'gourmet_kitchen.glb',
        previewImage: '/images/rooms/kitchen.png',
        dimensions: { length: 5, width: 3.6, height: 2.8 },
        description: 'Tối ưu công năng lưu trữ, tích hợp đảo bếp sang trọng và thông thoáng.',
        suggestedProducts: productIds.slice(0, 2),
        isTemplate: true,
        isActive: true,
      },
      {
        code: 'KG-DIN-01',
        name: 'Phòng ăn Sum Vầy Harmony',
        roomId: diningRoom ? diningRoom._id : null,
        file3DUrl: 'harmony_dining.glb',
        previewImage: '/images/rooms/dining-room.png',
        dimensions: { length: 6, width: 3.5, height: 2.8 },
        description: 'Không gian kết nối yêu thương với bàn ăn lớn và ánh sáng vàng ấm áp.',
        suggestedProducts: productIds.slice(0, 2),
        isTemplate: true,
        isActive: true,
      },
    ];

    for (const t of templates) {
      const existing = await RoomDesign.findOne({ code: t.code });
      if (existing) {
        await RoomDesign.findByIdAndUpdate(existing._id, t);
        console.log(`Updated space: ${t.code} - ${t.name}`);
      } else {
        await RoomDesign.create(t);
        console.log(`Created space: ${t.code} - ${t.name}`);
      }
    }

    const total = await RoomDesign.countDocuments({ isTemplate: true });
    console.log(`Total space templates in database now: ${total}`);
    await mongoose.disconnect();
    console.log('Done.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedSpaces();
