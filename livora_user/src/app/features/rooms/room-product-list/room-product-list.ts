import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-room-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './room-product-list.html',
  styleUrl: './room-product-list.css'
})
export class RoomProductList implements OnInit {
  activeFilter: string | null = null;
  currentCategory: string = 'beds';
  currentRoom: string = 'bedroom';
  products: any[] = [];
  isBestSellerOnly: boolean = false;
  sortOption: string = '';

  constructor(private route: ActivatedRoute) {}
  roomNamesMap: Record<string, string> = {
    'bedroom': 'Phòng ngủ',
    'living-room': 'Phòng khách',
    'kitchen': 'Phòng bếp',
    'dining-room': 'Phòng ăn',
    'bathroom': 'Phòng tắm'
  };

  categoryNamesMap: Record<string, string> = {
    'beds': 'Giường',
    'mattresses': 'Nệm',
    'wardrobes': 'Tủ quần áo',
    'bedding': 'Bộ chăn ga',
    'blankets': 'Chăn & Mền',
    'lighting': 'Đèn',
    'sofas': 'Sofa',
    'armchairs': 'Ghế bành',
    'coffee-tables': 'Bàn trà',
    'tv-stands': 'Kệ TV',
    'rugs': 'Thảm',
    'cabinets': 'Tủ lưu trữ',
    'dining-tables': 'Bàn ăn',
    'chairs': 'Ghế ăn',
    'sideboards': 'Tủ búp phê',
    'mirrors': 'Gương',
    'towels': 'Khăn tắm'
  };

  get displayedProducts() {
    let result = [...this.products];

    if (this.isBestSellerOnly) {
      result = result.filter(p => p.badge === 'Best seller' || p.badge === 'Bán chạy');
    }

    if (this.sortOption === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (this.sortOption === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }

  get bestSellerCount(): number {
    return this.products.filter(p => p.badge === 'Best seller' || p.badge === 'Bán chạy').length;
  }

  get formattedRoomName(): string {
    return this.roomNamesMap[this.currentRoom] || this.currentRoom.replace('-', ' ');
  }

  get formattedCategoryName(): string {
    return this.categoryNamesMap[this.currentCategory] || this.currentCategory;
  }

  categoryDescriptions: Record<string, string> = {
    'beds': `Chúng tôi luôn chú trọng mang lại một giấc ngủ ngon, với hàng trăm mẫu giường chất lượng. LIVORA cung cấp các mẫu khung giường tinh tế với mức giá hợp lý, phù hợp với mọi ngân sách và phong cách. Hãy khám phá và nâng cấp không gian phòng ngủ của bạn ngay hôm nay.`,
    'mattresses': `Một ngày tuyệt vời bắt đầu từ giấc ngủ ngon. Khám phá các dòng nệm êm ái nâng đỡ cơ thể trọn vẹn và mang lại sự thư thái tối đa cho bạn.`,
    'wardrobes': `Giữ cho căn phòng luôn ngăn nắp với các mẫu tủ quần áo đa năng. Từ cửa trượt hiện đại đến giải pháp lưu trữ thông minh, đáp ứng hoàn hảo nhu cầu của bạn.`,
    'bedding': `Bộ chăn ga cao cấp từ chất liệu thoáng mát, mềm mại, giúp bạn chìm vào giấc ngủ êm đềm mỗi đêm.`,
    'blankets': `Những chiếc chăn mỏng ấm áp và mềm mịn, tăng thêm sự ấm cúng cho chiếc giường hoặc ghế sofa của bạn.`,
    'lighting': `Hệ thống đèn chiếu sáng tinh tế với ánh sáng dịu nhẹ, tạo bầu không khí ấm áp và thư giãn cho không gian sống.`,
    'sofas': `Tạo điểm nhấn ấm cúng và thoải mái cho phòng khách với các mẫu sofa cao cấp từ phong cách Bắc Âu tối giản đến hiện đại.`,
    'armchairs': `Ghế bành thư giãn thiết kế công thái học ôm trọn lưng, mang đến cảm giác thoải mái nhất sau ngày dài làm việc.`,
    'coffee-tables': `Bàn trà sang trọng, gọn gàng và bền đẹp, hoàn thiện nét thẩm mỹ tinh tế cho phòng khách của bạn.`,
    'tv-stands': `Kệ TV tiện ích với thiết kế thông minh, quản lý dây cáp gọn gàng và tạo không gian giải trí ngăn nắp.`,
    'rugs': `Thảm trải sàn cao cấp với chất liệu tự nhiên, tạo cảm giác êm chân và cách âm hiệu quả cho căn phòng.`,
    'cabinets': `Các mẫu tủ lưu trữ và kệ đa năng giúp sắp xếp đồ đạc gọn gàng, tăng vẻ đẹp hiện đại cho ngôi nhà.`,
    'dining-tables': `Nơi gắn kết các thành viên gia đình qua bữa cơm ấm cúng với những mẫu bàn ăn bền đẹp, chắc chắn.`,
    'chairs': `Ghế ăn thoải mái, kiểu dáng trang nhã và dễ dàng phối hợp với nhiều phong cách bàn ăn khác nhau.`,
    'sideboards': `Tủ búp phê thanh lịch, vừa là nơi lưu trữ đồ tiện dụng vừa là món đồ trang trí đẳng cấp.`,
    'mirrors': `Gương trang trí phản chiếu ánh sáng tự nhiên, giúp không gian trở nên rộng rãi và thoáng đãng hơn.`,
    'towels': `Khăn tắm dệt từ sợi cotton tự nhiên mềm mại, thấm hút vượt trội mang lại trải nghiệm như tại spa.`
  };

  get currentDescription(): string {
    return this.categoryDescriptions[this.currentCategory] || `Khám phá các sản phẩm ${this.formattedCategoryName.toLowerCase()} chất lượng cao của LIVORA, mang lại sự tiện nghi và vẻ đẹp tinh tế cho không gian sống của bạn.`;
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const room = params.get('roomName');
      const category = params.get('categoryName');

      if (room) this.currentRoom = room;

      if (category) {
        this.currentCategory = category;
        this.products = this.mockDatabase[category] || [];
      }
    });
  }

  toggleFilter(filterName: string) {
    this.activeFilter = this.activeFilter === filterName ? null : filterName;
  }

  roomCategoriesMap: Record<string, any[]> = {
    'bedroom': [
      { id: 'beds', name: 'Giường', image: '/images/categories/bedroom/beds.png' },
      { id: 'mattresses', name: 'Nệm', image: '/images/categories/bedroom/mattresses.png' },
      { id: 'wardrobes', name: 'Tủ quần áo', image: '/images/categories/bedroom/wardrobes.png' },
      { id: 'bedding', name: 'Bộ chăn ga', image: '/images/categories/bedroom/bedding.png' },
      { id: 'blankets', name: 'Chăn & Mền', image: '/images/categories/bedroom/blankets.png' },
      { id: 'lighting', name: 'Đèn', image: '/images/categories/bedroom/lighting.png' }
    ],
    'living-room': [
      { id: 'sofas', name: 'Sofa', image: '/images/categories/living-room/sofas.png' },
      { id: 'armchairs', name: 'Ghế bành', image: '/images/categories/living-room/armchairs.png' },
      { id: 'coffee-tables', name: 'Bàn trà', image: '/images/categories/living-room/coffee-tables.png' },
      { id: 'tv-stands', name: 'Kệ TV', image: '/images/categories/living-room/tv-stands.png' },
      { id: 'rugs', name: 'Thảm', image: '/images/categories/living-room/rugs.png' },
      { id: 'lighting', name: 'Đèn', image: '/images/categories/living-room/lighting.png' }
    ],
    'kitchen': [
      { id: 'cabinets', name: 'Tủ bếp', image: '/images/categories/kitchen/cabinets.png' },
      { id: 'dining-tables', name: 'Bàn ăn', image: '/images/categories/kitchen/dining-tables.png' },
      { id: 'chairs', name: 'Ghế', image: '/images/categories/kitchen/chairs.png' },
      { id: 'lighting', name: 'Đèn', image: '/images/categories/kitchen/lighting.png' }
    ],
    'dining-room': [
      { id: 'dining-tables', name: 'Bàn ăn', image: '/images/categories/kitchen/dining-tables.png' },
      { id: 'chairs', name: 'Ghế', image: '/images/categories/kitchen/chairs.png' },
      { id: 'sideboards', name: 'Tủ búp phê', image: '/images/categories/dining-room/sideboards.png' },
      { id: 'lighting', name: 'Đèn', image: '/images/categories/kitchen/lighting.png' }
    ],
    'bathroom': [
      { id: 'mirrors', name: 'Gương', image: '/images/categories/bathroom/mirrors.png' },
      { id: 'cabinets', name: 'Tủ phòng tắm', image: '/images/categories/bathroom/cabinets.png' },
      { id: 'towels', name: 'Khăn tắm', image: '/images/categories/bathroom/towels.png' },
      { id: 'lighting', name: 'Đèn', image: '/images/categories/bathroom/lighting.png' }
    ]
  };

  get subCategories() {
    return this.roomCategoriesMap[this.currentRoom] || this.roomCategoriesMap['bedroom'];
  }

  mockDatabase: Record<string, any[]> = {
    "beds": [
      { id: 1, name: "NEIDEN", description: "Thiết kế nhỏ gọn, hoàn hảo cho không gian hẹp hoặc trần nhà thấp.", price: 89, rating: 4.0, reviews: 120, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80" },
      { id: 2, name: "MALM", description: "Thiết kế thanh lịch, hoàn mỹ từ mọi góc nhìn trong phòng.", price: 179, rating: 4.2, reviews: 310, badge: null, image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80" },
      { id: 3, name: "SLATTUM", description: "Khung giường bọc vải dệt êm ái mang lại cảm giác ấm cúng.", price: 119, rating: 4.5, reviews: 45, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80" }
    ],
    "mattresses": [
      { id: 4, name: "MALFORS", description: "Nệm mút đàn hồi giữ nguyên phom dáng và tạo sự thoải mái tối ưu.", price: 119, rating: 4.0, reviews: 312, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80" },
      { id: 5, name: "VESTMARKA", description: "Lò xo Bonnell thích ứng linh hoạt theo cơ thể và nâng đỡ vững chắc.", price: 150, rating: 4.2, reviews: 188, badge: null, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80" },
      { id: 6, name: "VADSO", description: "Lò xo túi độc lập êm ái, chuyển động nhẹ nhàng theo cơ thể bạn.", price: 279, rating: 4.5, reviews: 96, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1506720186575-11354d325017?q=80&w=1750&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "wardrobes": [
      { id: 7, name: "PAX", description: "Khung tủ quần áo linh hoạt, dễ dàng tùy biến theo nhu cầu.", price: 200, rating: 4.6, reviews: 540, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1643949914877-b20f30792c1e?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 8, name: "BRIMNES", description: "Phù hợp để treo quần áo và sắp xếp đồ dùng gọn gàng.", price: 170, rating: 4.3, reviews: 276, badge: null, image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 9, name: "KLEPPSTAD", description: "Tủ quần áo thông minh và đơn giản, vừa vặn cho phòng ngủ nhỏ.", price: 130, rating: 4.0, reviews: 198, badge: "Bán chạy", image: "https://plus.unsplash.com/premium_photo-1676320514018-2f5b7c5a701f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "bedding": [
      { id: 10, name: "DVALA", description: "Cotton mềm mại, thoáng mát, dễ chịu cho làn da.", price: 20, rating: 4.5, reviews: 870, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80" },
      { id: 11, name: "ANGSLILJA", description: "Vải dệt mật độ cao với bề mặt mịn màng và mát mẻ.", price: 35, rating: 4.6, reviews: 430, badge: null, image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80" },
      { id: 12, name: "NATTSVARMARE", description: "Tông màu be ấm áp kết hợp chất liệu cotton pha êm dịu.", price: 25, rating: 4.2, reviews: 120, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1698746044395-85beb2b04522?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "blankets": [
      { id: 13, name: "INGABRITTA", description: "Chăn mỏng mềm mịn tạo thêm sự ấm áp cho ghế sofa của bạn.", price: 25, rating: 4.7, reviews: 610, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=600&q=80" },
      { id: 14, name: "POLARVIDE", description: "Chăn lông cừu ấm áp, giá cả phải chăng và dễ giặt giũ.", price: 4, rating: 4.3, reviews: 980, badge: null, image: "https://images.unsplash.com/photo-1601276174812-63280a55656e?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 15, name: "VARELD", description: "Chăn cotton nhẹ với độ rủ tự nhiên và kết cấu êm ái.", price: 20, rating: 4.5, reviews: 142, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1601880348117-25c1127a95df?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "lighting": [
      { id: 16, name: "FADO", description: "Chụp đèn thủy tinh mờ tỏa ánh sáng dịu nhẹ khắp căn phòng.", price: 19, rating: 4.6, reviews: 733, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80" },
      { id: 17, name: "RANARP", description: "Đèn làm việc điều chỉnh hướng linh hoạt, chiếu sáng chính xác.", price: 45, rating: 4.5, reviews: 289, badge: null, image: "https://images.unsplash.com/photo-1585128719715-46776b56a0d1?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 18, name: "SYMFONISK", description: "Đèn bàn tích hợp loa WiFi hiện đại 2 trong 1 tiện lợi.", price: 180, rating: 4.2, reviews: 156, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1636368208791-17b81ed832d2?q=80&w=858&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "sofas": [
      { id: 19, name: "KIVIK", description: "Kích thước rộng rãi, tay vịn thấp và đệm lò xo túi êm ái.", price: 549, rating: 4.5, reviews: 120, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1512212621149-107ffe572d2f?q=80&w=1760&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 20, name: "SÖDERHAMN", description: "Thiết kế sâu và thấp thanh lịch với gối tựa lưng êm ái.", price: 499, rating: 4.2, reviews: 85, badge: null, image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80" },
      { id: 21, name: "LANDSKRONA", description: "Sofa chần bông sang trọng bằng chất liệu da cao cấp và chân gỗ.", price: 699, rating: 4.6, reviews: 64, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80" }
    ],
    "armchairs": [
      { id: 22, name: "POÄNG", description: "Khung gỗ bạch dương uốn cong chịu lực tốt và tạo độ nẩy thoải mái.", price: 89, rating: 4.6, reviews: 780, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 23, name: "STRANDMON", description: "Ghế tựa lưng cao cổ điển giúp nâng đỡ cổ và vai gáy hoàn hảo.", price: 129, rating: 4.7, reviews: 340, badge: null, image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1316&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 24, name: "PELLO", description: "Tựa lưng cao nâng đỡ tốt, phong cách đơn giản và thanh lịch.", price: 59, rating: 4.1, reviews: 520, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80" }
    ],
    "coffee-tables": [
      { id: 25, name: "LACK", description: "Bàn nhỏ gọn, đường nét tinh tế, dễ di chuyển và sắp đặt.", price: 19, rating: 4.1, reviews: 450, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1534201569625-ed4662d8be97?q=80&w=822&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 26, name: "LISABO", description: "Bàn chắc chắn với mặt gỗ tần bì và chân gỗ bạch dương tự nhiên.", price: 99, rating: 4.4, reviews: 95, badge: null, image: "https://images.unsplash.com/photo-1619911013257-8f1fbc919fc9?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 27, name: "VITTSJÖ", description: "Mặt kính cường lực chống ố và dễ dàng lau chùi.", price: 49, rating: 4.5, reviews: 280, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1647967527216-adea2f078e07?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "tv-stands": [
      { id: 28, name: "LACK", description: "Kệ TV cơ bản và tiện ích với mặt lưng thoáng để luồn dây cáp.", price: 25, rating: 4.2, reviews: 340, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1461151304267-38535e780c79?q=80&w=2000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 29, name: "BESTÅ", description: "Hệ tủ lưu trữ hiện đại với ngăn kéo nhấn mở tiện lợi.", price: 149, rating: 4.6, reviews: 180, badge: null, image: "https://images.unsplash.com/photo-1586024486164-ce9b3d87e09f?q=80&w=1356&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 30, name: "BYÅS", description: "Kệ TV màu trắng phủ bóng cao cấp với kệ có thể điều chỉnh.", price: 89, rating: 4.3, reviews: 210, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "rugs": [
      { id: 31, name: "TIPHEDE", description: "Thảm dệt phẳng cotton nhẹ, dễ dàng giũ sạch bụi bẩn.", price: 35, rating: 4.4, reviews: 620, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1586024486164-ce9b3d87e09f?q=80&w=1356&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 32, name: "STOENSE", description: "Thảm lông dày mềm mại giúp giảm tiếng ồn và tạo sự ấm cúng.", price: 99, rating: 4.5, reviews: 210, badge: null, image: "https://images.unsplash.com/photo-1606885118474-c8baf907e998?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 33, name: "LOHALS", description: "Thảm sợi đay tự nhiên, bền bỉ và thích hợp cho khu vực ăn uống.", price: 69, rating: 4.2, reviews: 340, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1580229080435-1c7e2ce835c1?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "cabinets": [
      { id: 34, name: "EKET", description: "Tủ ô vuông lắp ghép linh hoạt, có thể gắn tường hoặc xếp chồng.", price: 25, rating: 4.3, reviews: 230, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1609241506098-80fc37c6325f?q=80&w=654&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 35, name: "KALLAX", description: "Kệ sách ô vuông kinh điển, có thể đặt đứng hoặc nằm ngang.", price: 75, rating: 4.4, reviews: 140, badge: null, image: "https://images.unsplash.com/photo-1701421047855-d7bafd8d6f69?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 36, name: "BAGGEBO", description: "Tủ kính tinh gọn dùng trưng bày các món đồ yêu thích của bạn.", price: 35, rating: 4.1, reviews: 310, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80" }
    ],
    "dining-tables": [
      { id: 37, name: "EKEDALEN", description: "Bàn ăn thông minh có thể kéo dài diện tích mặt bàn khi cần.", price: 129, rating: 4.4, reviews: 180, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80" },
      { id: 38, name: "JOKKMOKK", description: "Bộ bàn ăn gỗ thông truyền thống kèm 4 ghế đồng bộ.", price: 79, rating: 4.1, reviews: 310, badge: null, image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80" },
      { id: 39, name: "MELLTORP", description: "Bàn phủ melamine bền bỉ, chống thấm nước và chống trầy xước.", price: 49, rating: 4.0, reviews: 420, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "chairs": [
      { id: 40, name: "ODGER", description: "Thiết kế công thái học với lòng ghế bo tròn thoải mái.", price: 45, rating: 4.5, reviews: 142, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80" },
      { id: 41, name: "TEODORES", description: "Ghế nhựa nhẹ, có thể xếp chồng gọn gàng và dễ lau chùi.", price: 29, rating: 4.2, reviews: 280, badge: null, image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80" },
      { id: 42, name: "ADDE", description: "Ghế kim loại kèm mặt ngồi nhựa đơn giản, giá cả phải chăng.", price: 15, rating: 3.9, reviews: 560, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80" }
    ],
    "sideboards": [
      { id: 43, name: "HAVSTA", description: "Tủ búp phê gỗ thông nguyên khối với cửa trượt và kệ phân tầng.", price: 199, rating: 4.4, reviews: 95, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80" },
      { id: 44, name: "BESTÅ", description: "Tủ búp phê hiện đại với các ngăn kéo nhấn mở êm ái.", price: 249, rating: 4.5, reviews: 78, badge: null, image: "https://images.unsplash.com/photo-1713810958247-01dbd76b4a61?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 45, name: "LOMMARP", description: "Tủ búp phê màu xanh sẫm trang nhã với đường phào chỉ cổ điển.", price: 299, rating: 4.6, reviews: 45, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1618220048045-10a6dbdf83e0?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "mirrors": [
      { id: 46, name: "HOVET", description: "Gương soi toàn thân cỡ lớn, có thể treo ngang hoặc đứng.", price: 149, rating: 4.6, reviews: 180, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1663659504863-43dd69a5fda2?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 47, name: "TOFTBYN", description: "Gương cổ điển với khung gỗ tự nhiên chạm khắc tinh xảo.", price: 69, rating: 4.4, reviews: 240, badge: null, image: "https://images.unsplash.com/photo-1712214741533-3dd5b8013ca7?q=80&w=1250&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 48, name: "NISSEDAL", description: "Gương tròn treo tường tối giản, tiện lợi cho góc trang điểm.", price: 49, rating: 4.3, reviews: 310, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1644916930530-0e4e5afdd20d?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "towels": [
      { id: 49, name: "VÅGSJÖN", description: "Khăn tắm dày dặn, thấm hút cực tốt và bền đẹp.", price: 4, rating: 4.5, reviews: 320, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1574421233376-06f2ccf017f7?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 50, name: "DIMFORSEN", description: "Khăn lau tay dệt tổ ong mềm mại, nhanh khô ráo.", price: 8, rating: 4.4, reviews: 180, badge: null, image: "https://images.unsplash.com/photo-1621468644541-deea173bd43e?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 51, name: "NÄRSEN", description: "Khăn tay tiện lợi, nhỏ gọn và dễ mang theo khi di chuyển.", price: 2, rating: 3.8, reviews: 410, badge: "Bán chạy", image: "https://images.unsplash.com/photo-1638232928539-6e91c47ddec5?q=80&w=830&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ]
  };
}
