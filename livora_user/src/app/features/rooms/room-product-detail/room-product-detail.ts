import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-room-product-detail',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './room-product-detail.html',
  styleUrl: './room-product-detail.css'
})
export class RoomProductDetail implements OnInit, OnDestroy {
  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  currentRoom: string = 'bedroom';
  currentCategory: string = 'beds';
  productId: string | null = null;

  roomNamesMap: Record<string, string> = {
    'bedroom': 'Phòng ngủ',
    'kitchen': 'Phòng bếp',
    'living-room': 'Phòng khách',
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
    'cabinets': 'Tủ',
    'dining-tables': 'Bàn ăn',
    'chairs': 'Ghế',
    'sideboards': 'Tủ búp phê',
    'mirrors': 'Gương',
    'towels': 'Khăn tắm'
  };

  get formattedRoomName(): string {
    return this.roomNamesMap[this.currentRoom] || this.currentRoom;
  }

  get formattedCategoryName(): string {
    return this.categoryNamesMap[this.currentCategory] || this.currentCategory;
  }

  product: any = null;
  mainImage: string = '';
  selectedColor: string = 'Mặc định';
  selectedSize: string = 'Giường đôi tiêu chuẩn';
  isDetailsOpen: boolean = false;

  isReviewModalOpen: boolean = false;
  activeReviewTab: string = 'UK';
  isSortMenuOpen: boolean = false;
  isFilterMenuOpen: boolean = false;
  currentSort: string = 'newest';
  isWriteReviewOpen: boolean = false;

  mockProductDatabase: Record<string, any> = {
    "1": { id: "1", name: "NEIDEN", type: "Khung giường", material: "Gỗ thông tự nhiên", size: "Giường đôi tiêu chuẩn", price: 89, rating: 4.0, reviews: 120, articleNumber: "101.251.59", description: "Thiết kế nhỏ gọn, hoàn hảo cho không gian hẹp hoặc trần nhà thấp.", images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1615874959474-d609969a20ed?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"], colors: [{ name: "Gỗ thông", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80" }] },
    "2": { id: "2", name: "MALM", type: "Khung giường", material: "Gỗ sồi veneer", size: "Cỡ King", price: 179, rating: 4.2, reviews: 310, articleNumber: "102.268.62", description: "Thiết kế tinh gọn, đẹp mắt và hài hòa từ mọi góc nhìn.", images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"], colors: [{ name: "Gỗ sồi", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80" }, { name: "Trắng", image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }] },
    "3": { id: "3", name: "SLATTUM", type: "Khung giường", material: "Bọc nhung cao cấp", size: "Giường đơn tiêu chuẩn", price: 119, rating: 4.5, reviews: 45, articleNumber: "103.285.65", description: "Được bọc bằng lớp vải dệt êm ái mang lại cảm giác ấm cúng.", images: ["https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"], colors: [{ name: "Xám", image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80" }, { name: "Be", image: "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }] },
    "4": { id: "4", name: "MALFORS", type: "Nệm", material: "Mút đàn hồi", size: "Giường đôi tiêu chuẩn", price: 119, rating: 4.0, reviews: 312, articleNumber: "104.302.68", description: "Nệm mút đàn hồi giữ form tốt và mang lại sự nâng đỡ êm ái.", images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80" }, { name: "Đen", image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80" }] },
    "5": { id: "5", name: "VESTMARKA", type: "Nệm", material: "Lò xo túi", size: "Cỡ King", price: 150, rating: 4.2, reviews: 188, articleNumber: "105.319.71", description: "Hệ thống lò xo Bonnell ôm sát đường cong cơ thể, nâng đỡ vững chắc.", images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80" }, { name: "Đen", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80" }] },
    "6": { id: "6", name: "VADSO", type: "Nệm", material: "Bọt hoạt tính", size: "Giường đơn tiêu chuẩn", price: 279, rating: 4.5, reviews: 96, articleNumber: "106.336.74", description: "Lò xo túi độc lập phản hồi nhịp nhàng theo từng chuyển động khi ngủ.", images: ["https://images.unsplash.com/photo-1506720186575-11354d325017?q=80&w=1750&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1506720186575-11354d325017?q=80&w=1750&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80" }] },
    "7": { id: "7", name: "PAX", type: "Tủ quần áo", material: "Ván dăm ép", size: "150x60x201 cm", price: 200, rating: 4.6, reviews: 540, articleNumber: "107.353.77", description: "Khung tủ thông minh có thể tùy chỉnh bố cục theo nhu cầu cá nhân.", images: ["https://images.unsplash.com/photo-1643949914877-b20f30792c1e?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1597047084897-51e81819a499?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1643949914877-b20f30792c1e?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1597047084897-51e81819a499?auto=format&fit=crop&w=600&q=80" }] },
    "8": { id: "8", name: "BRIMNES", type: "Tủ quần áo", material: "Ván sợi MDF", size: "117x190 cm", price: 170, rating: 4.3, reviews: 276, articleNumber: "108.370.80", description: "Tối ưu cho cả quần áo gấp lẫn trang phục dài ngắn các loại.", images: ["https://images.unsplash.com/photo-1558997519-83ea9252edf8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1683181181300-44c0c991a2cf?q=80&w=1742&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1683181181300-44c0c991a2cf?q=80&w=1742&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }] },
    "9": { id: "9", name: "KLEPPSTAD", type: "Tủ quần áo", material: "Gỗ tự nhiên", size: "117x176 cm", price: 130, rating: 4.0, reviews: 198, articleNumber: "109.387.83", description: "Tủ quần áo thiết kế đơn giản, vừa vặn cho các phòng ngủ nhỏ.", images: ["https://plus.unsplash.com/premium_photo-1676320514018-2f5b7c5a701f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://plus.unsplash.com/premium_photo-1676320514018-2f5b7c5a701f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80" }] },
    "10": { id: "10", name: "DVALA", type: "Bộ chăn ga", material: "100% cotton", size: "200x200 cm", price: 20, rating: 4.5, reviews: 870, articleNumber: "110.404.86", description: "Chất liệu cotton mềm mại, dễ giặt ủi và thân thiện với làn da.", images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80" }, { name: "Đen", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80" }] },
    "11": { id: "11", name: "ANGSLILJA", type: "Bộ chăn ga", material: "Cotton pha lyocell", size: "240x220 cm", price: 35, rating: 4.6, reviews: 430, articleNumber: "111.421.89", description: "Vải cotton dệt mật độ cao với bề mặt mịn màng, thoáng mát và óng ả.", images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80" }, { name: "Đen", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80" }] },
    "12": { id: "12", name: "NATTSVARMARE", type: "Bộ chăn ga", material: "Lụa satin", size: "150x200 cm", price: 25, rating: 4.2, reviews: 120, articleNumber: "112.438.92", description: "Tông màu be ấm áp kết hợp cùng chất vải cotton pha mềm mại.", images: ["https://images.unsplash.com/photo-1698746044395-85beb2b04522?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1698746044395-85beb2b04522?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=600&q=80" }] },
    "13": { id: "13", name: "INGABRITTA", type: "Chăn & Mền", material: "100% acrylic", size: "130x170 cm", price: 25, rating: 4.7, reviews: 610, articleNumber: "113.455.95", description: "Chăn dệt xốp mềm tăng thêm sự ấm áp cho ghế sofa hoặc giường ngủ.", images: ["https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=600&q=80" }, { name: "Đen", image: "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=600&q=80" }] },
    "14": { id: "14", name: "POLARVIDE", type: "Chăn & Mền", material: "Vải nỉ lông cừu", size: "150x200 cm", price: 4, rating: 4.3, reviews: 980, articleNumber: "114.472.98", description: "Chăn nỉ giá cả phải chăng, giữ nhiệt tốt và dễ giặt sạch.", images: ["https://images.unsplash.com/photo-1601276174812-63280a55656e?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1543294001-f7cbfe92237e?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1601276174812-63280a55656e?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1543294001-f7cbfe92237e?auto=format&fit=crop&w=600&q=80" }] },
    "15": { id: "15", name: "VARELD", type: "Chăn & Mền", material: "100% cotton", size: "120x180 cm", price: 20, rating: 4.5, reviews: 142, articleNumber: "115.489.01", description: "Chăn phủ cotton dệt nhẹ nhàng, tạo độ rủ mềm mại và thoáng khí.", images: ["https://images.unsplash.com/photo-1601880348117-25c1127a95df?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1512310604669-443f26c35f52?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1601880348117-25c1127a95df?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1512310604669-443f26c35f52?auto=format&fit=crop&w=600&q=80" }] },
    "16": { id: "16", name: "FADO", type: "Đèn", material: "Kính & thép", size: "25 cm", price: 19, rating: 4.6, reviews: 733, articleNumber: "116.506.04", description: "Chao đèn thủy tinh mờ lan tỏa ánh sáng dịu nhẹ khắp căn phòng.", images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80" }, { name: "Đen", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80" }] },
    "17": { id: "17", name: "RANARP", type: "Đèn", material: "Nhôm cao cấp", size: "42 cm", price: 45, rating: 4.5, reviews: 289, articleNumber: "117.523.07", description: "Đèn bàn làm việc có thể điều chỉnh linh hoạt hướng chiếu sáng.", images: ["https://images.unsplash.com/photo-1585128719715-46776b56a0d1?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1534081333815-ae5019106622?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1585128719715-46776b56a0d1?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1534081333815-ae5019106622?auto=format&fit=crop&w=600&q=80" }] },
    "18": { id: "18", name: "SYMFONISK", type: "Đèn", material: "Nhựa polypropylene", size: "Tiêu chuẩn", price: 180, rating: 4.2, reviews: 156, articleNumber: "118.540.10", description: "Sự kết hợp hoàn hảo giữa đèn bàn trang trí và loa phát WiFi thông minh.", images: ["https://images.unsplash.com/photo-1636368208791-17b81ed832d2?q=80&w=858&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1636368208791-17b81ed832d2?q=80&w=858&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80" }] },
    "19": { id: "19", name: "KIVIK", type: "Sofa", material: "Vải polyester", size: "3 chỗ ngồi", price: 549, rating: 4.5, reviews: 120, articleNumber: "119.557.13", description: "Kích thước rộng rãi, tay vịn thấp cùng đệm lò xo túi êm ái.", images: ["https://images.unsplash.com/photo-1512212621149-107ffe572d2f?q=80&w=1760&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Xám", image: "https://images.unsplash.com/photo-1512212621149-107ffe572d2f?q=80&w=1760&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Be", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80" }] },
    "20": { id: "20", name: "SÖDERHAMN", type: "Sofa", material: "Vải pha cotton/poly", size: "2 chỗ ngồi", price: 499, rating: 4.2, reviews: 85, articleNumber: "120.574.16", description: "Kiểu dáng thanh lịch, lòng ghế sâu cùng đệm tựa lưng rời thư giãn.", images: ["https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80" }, { name: "Đen", image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80" }] },
    "21": { id: "21", name: "LANDSKRONA", type: "Sofa", material: "Da nhân tạo cao cấp", size: "Sofa góc chữ L", price: 699, rating: 4.6, reviews: 64, articleNumber: "121.591.19", description: "Thiết kế chần múi sang trọng bằng da cao cấp cùng chân gỗ tự nhiên.", images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80" }, { name: "Đen", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80" }] },
    "22": { id: "22", name: "POÄNG", type: "Ghế bành", material: "Veneer bạch dương & cotton", size: "Tiêu chuẩn", price: 89, rating: 4.6, reviews: 780, articleNumber: "122.608.22", description: "Khung gỗ uốn cong tạo độ đàn hồi dễ chịu khi ngồi đọc sách.", images: ["https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80" }] },
    "23": { id: "23", name: "STRANDMON", type: "Ghế bành", material: "Gỗ sồi & bọc nhung", size: "Tiêu chuẩn", price: 129, rating: 4.7, reviews: 340, articleNumber: "123.625.25", description: "Ghế tựa lưng cao cổ điển nâng đỡ hoàn hảo phần cổ và lưng.", images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1316&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Gỗ sồi", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1316&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Trắng", image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80" }] },
    "24": { id: "24", name: "PELLO", type: "Ghế bành", material: "Khung thép & vải", size: "Tiêu chuẩn", price: 59, rating: 4.1, reviews: 520, articleNumber: "124.642.28", description: "Tựa lưng cao ôm sát thoải mái, kiểu dáng tối giản và nhẹ nhàng.", images: ["https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Xám", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80" }, { name: "Be", image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80" }] },
    "25": { id: "25", name: "LACK", type: "Bàn trà", material: "Ván dăm ép", size: "90x55 cm", price: 19, rating: 4.1, reviews: 450, articleNumber: "125.659.31", description: "Bàn trà vuông vắn, đường nét gọn gàng, siêu nhẹ và dễ di chuyển.", images: ["https://images.unsplash.com/photo-1534201569625-ed4662d8be97?q=80&w=822&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1534201569625-ed4662d8be97?q=80&w=822&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80" }] },
    "26": { id: "26", name: "LISABO", type: "Bàn trà", material: "Gỗ tần bì veneer", size: "110x60 cm", price: 99, rating: 4.4, reviews: 95, articleNumber: "126.676.34", description: "Mặt bàn phủ veneer tần bì tự nhiên, chân bàn làm từ gỗ bạch dương khối vững chắc.", images: ["https://images.unsplash.com/photo-1619911013257-8f1fbc919fc9?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1619911013257-8f1fbc919fc9?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80" }] },
    "27": { id: "27", name: "VITTSJÖ", type: "Bàn trà", material: "Thép & kính", size: "Đường kính 75 cm", price: 49, rating: 4.5, reviews: 280, articleNumber: "127.693.37", description: "Mặt kính cường lực chống ố và dễ dàng lau chùi vệ sinh.", images: ["https://images.unsplash.com/photo-1647967527216-adea2f078e07?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1647967527216-adea2f078e07?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80" }] },
    "28": { id: "28", name: "LACK", type: "Kệ TV", material: "Ván dăm ép", size: "120x40x50 cm", price: 25, rating: 4.2, reviews: 340, articleNumber: "128.710.40", description: "Kệ để TV đơn giản, mặt sau thông thoáng dễ luồn và sắp xếp dây cáp.", images: ["https://images.unsplash.com/photo-1461151304267-38535e780c79?q=80&w=2000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1461151304267-38535e780c79?q=80&w=2000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80" }] },
    "29": { id: "29", name: "BESTÅ", type: "Kệ TV", material: "Thép & lưới kim loại", size: "160x40x60 cm", price: 149, rating: 4.6, reviews: 180, articleNumber: "129.727.43", description: "Hệ kệ lưu trữ hiện đại với các ngăn kéo đóng mở chỉ bằng một lần ấn.", images: ["https://images.unsplash.com/photo-1586024486164-ce9b3d87e09f?q=80&w=1356&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1586024486164-ce9b3d87e09f?q=80&w=1356&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80" }] },
    "30": { id: "30", name: "BYÅS", type: "Kệ TV", material: "Gỗ thông tự nhiên", size: "100x35x45 cm", price: 89, rating: 4.3, reviews: 210, articleNumber: "130.744.46", description: "Kệ TV phủ bóng hiện đại kèm các đợt kệ có thể điều chỉnh độ cao.", images: ["https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Gỗ thông", image: "https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }] },
    "31": { id: "31", name: "TIPHEDE", type: "Thảm", material: "100% polypropylene", size: "133x195 cm", price: 35, rating: 4.4, reviews: 620, articleNumber: "131.761.49", description: "Thảm dệt phẳng cotton nhẹ nhàng, rất dễ giũ sạch bụi bẩn hàng ngày.", images: ["https://images.unsplash.com/photo-1586024486164-ce9b3d87e09f?q=80&w=1356&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1586024486164-ce9b3d87e09f?q=80&w=1356&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80" }] },
    "32": { id: "32", name: "STOENSE", type: "Thảm", material: "100% len", size: "160x230 cm", price: 99, rating: 4.5, reviews: 210, articleNumber: "132.778.52", description: "Sợi thảm dày, êm ái dưới chân và có khả năng tiêu âm hiệu quả.", images: ["https://images.unsplash.com/photo-1606885118474-c8baf907e998?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1606885118474-c8baf907e998?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80" }] },
    "33": { id: "33", name: "LOHALS", type: "Thảm", material: "100% đay tự nhiên", size: "200x300 cm", price: 69, rating: 4.2, reviews: 340, articleNumber: "133.795.55", description: "Thảm làm từ sợi đay tự nhiên, bền chắc và cực kỳ lý tưởng cho phòng ăn.", images: ["https://images.unsplash.com/photo-1580229080435-1c7e2ce835c1?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1580229080435-1c7e2ce835c1?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80" }] },
    "34": { id: "34", name: "EKET", type: "Tủ", material: "Thép & kính", size: "35x35x35 cm", price: 25, rating: 4.3, reviews: 230, articleNumber: "134.812.58", description: "Hộp lưu trữ dạng khối vuông linh hoạt gắn tường hoặc xếp chồng.", images: ["https://images.unsplash.com/photo-1609241506098-80fc37c6325f?q=80&w=654&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1609241506098-80fc37c6325f?q=80&w=654&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80" }] },
    "35": { id: "35", name: "KALLAX", type: "Tủ", material: "Gỗ thông tự nhiên", size: "80x40x120 cm", price: 75, rating: 4.4, reviews: 140, articleNumber: "135.829.61", description: "Kệ chia ô cổ điển, có thể kê đứng hoặc đặt nằm ngang tùy ý.", images: ["https://images.unsplash.com/photo-1701421047855-d7bafd8d6f69?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Gỗ thông", image: "https://images.unsplash.com/photo-1701421047855-d7bafd8d6f69?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }] },
    "36": { id: "36", name: "BAGGEBO", type: "Tủ", material: "Ván dăm ép", size: "60x35x190 cm", price: 35, rating: 4.1, reviews: 310, articleNumber: "136.846.64", description: "Tủ kính sang trọng để trưng bày những món đồ yêu thích của bạn.", images: ["https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80" }, { name: "Đen", image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80" }] },
    "37": { id: "37", name: "EKEDALEN", type: "Bàn ăn", material: "Gỗ thông tự nhiên", size: "4 chỗ (110 cm)", price: 129, rating: 4.4, reviews: 180, articleNumber: "137.863.67", description: "Bàn ăn kéo dài thông minh với khớp mở rộng tiện lợi và bền bỉ.", images: ["https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Gỗ thông", image: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80" }] },
    "38": { id: "38", name: "JOKKMOKK", type: "Bàn ăn", material: "Gỗ tần bì veneer", size: "Mở rộng (120-180 cm)", price: 79, rating: 4.1, reviews: 310, articleNumber: "138.880.70", description: "Bộ bàn ăn gỗ thông truyền thống đi kèm 4 ghế đồng bộ thanh lịch.", images: ["https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80" }, { name: "Đen", image: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80" }] },
    "39": { id: "39", name: "MELLTORP", type: "Bàn ăn", material: "Gỗ sồi tự nhiên", size: "6 chỗ (160 cm)", price: 49, rating: 4.0, reviews: 420, articleNumber: "139.897.73", description: "Bàn ăn phủ melamine bền chắc, chống thấm nước và chống trầy xước.", images: ["https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Gỗ sồi", image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Trắng", image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80" }] },
    "40": { id: "40", name: "ODGER", type: "Ghế ăn", material: "Gỗ composite", size: "Tiêu chuẩn", price: 45, rating: 4.5, reviews: 142, articleNumber: "140.914.76", description: "Thiết kế công thái học với lòng ghế uốn cong tạo cảm giác dễ chịu khi ngồi.", images: ["https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80" }, { name: "Đen", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80" }] },
    "41": { id: "41", name: "TEODORES", type: "Ghế ăn", material: "Nhựa & thép", size: "Tiêu chuẩn", price: 29, rating: 4.2, reviews: 280, articleNumber: "141.931.79", description: "Ghế nhựa trọng lượng nhẹ, có thể xếp chồng lên nhau gọn gàng.", images: ["https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80" }, { name: "Đen", image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80" }] },
    "42": { id: "42", name: "ADDE", type: "Ghế ăn", material: "Gỗ dẻ gai tự nhiên", size: "Tiêu chuẩn", price: 15, rating: 3.9, reviews: 560, articleNumber: "142.948.82", description: "Ghế ăn khung kim loại kết hợp mặt ngồi nhựa tối giản và tiết kiệm.", images: ["https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80" }, { name: "Đen", image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80" }] },
    "43": { id: "43", name: "HAVSTA", type: "Tủ búp phê", material: "Gỗ thông tự nhiên", size: "120x40x80 cm", price: 199, rating: 4.4, reviews: 95, articleNumber: "143.965.85", description: "Tủ lưu trữ gỗ khối cao cấp với cửa lùa mượt mà và các đợt kệ chắc chắn.", images: ["https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Gỗ thông", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80" }] },
    "44": { id: "44", name: "BESTÅ", type: "Tủ búp phê", material: "Mây tre & gỗ thông", size: "140x45x85 cm", price: 249, rating: 4.5, reviews: 78, articleNumber: "144.982.88", description: "Tủ búp phê phong cách hiện đại với cơ chế mở ngăn kéo nhẹ nhàng.", images: ["https://images.unsplash.com/photo-1713810958247-01dbd76b4a61?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Gỗ thông", image: "https://images.unsplash.com/photo-1713810958247-01dbd76b4a61?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }] },
    "45": { id: "45", name: "LOMMARP", type: "Tủ búp phê", material: "Ván dăm ép", size: "160x40x90 cm", price: 299, rating: 4.6, reviews: 45, articleNumber: "145.999.91", description: "Tủ búp phê màu xanh thẫm quý phái với họa tiết pano cổ điển sang trọng.", images: ["https://images.unsplash.com/photo-1618220048045-10a6dbdf83e0?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1618220048045-10a6dbdf83e0?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80" }] },
    "46": { id: "46", name: "HOVET", type: "Gương", material: "Khung nhôm", size: "78x196 cm", price: 149, rating: 4.6, reviews: 180, articleNumber: "146.016.94", description: "Gương đứng cỡ lớn có thể treo tường theo chiều dọc hoặc ngang tùy thích.", images: ["https://images.unsplash.com/photo-1663659504863-43dd69a5fda2?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1663659504863-43dd69a5fda2?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80" }] },
    "47": { id: "47", name: "TOFTBYN", type: "Gương", material: "Khung gỗ tự nhiên", size: "50x150 cm", price: 69, rating: 4.4, reviews: 240, articleNumber: "147.033.97", description: "Gương treo tường cổ điển với phần viền gỗ tự nhiên gia công sắc sảo.", images: ["https://images.unsplash.com/photo-1712214741533-3dd5b8013ca7?q=80&w=1250&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1594498653385-d5172b532c00?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1712214741533-3dd5b8013ca7?q=80&w=1250&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1594498653385-d5172b532c00?auto=format&fit=crop&w=600&q=80" }] },
    "48": { id: "48", name: "NISSEDAL", type: "Gương", material: "Kính cường lực", size: "Tròn 60 cm", price: 49, rating: 4.3, reviews: 310, articleNumber: "148.050.00", description: "Gương tròn tối giản, hoàn hảo để soi nhanh trước khi ra khỏi nhà.", images: ["https://images.unsplash.com/photo-1644916930530-0e4e5afdd20d?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1644916930530-0e4e5afdd20d?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80" }] },
    "49": { id: "49", name: "VÅGSJÖN", type: "Khăn tắm", material: "100% cotton chải kỹ", size: "70x140 cm (khăn tắm)", price: 4, rating: 4.5, reviews: 320, articleNumber: "149.067.03", description: "Khăn tắm thấm hút nước cực tốt, sợi bông dày dặn và bền bỉ.", images: ["https://images.unsplash.com/photo-1574421233376-06f2ccf017f7?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1574421233376-06f2ccf017f7?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=600&q=80" }] },
    "50": { id: "50", name: "DIMFORSEN", type: "Khăn tắm", material: "Vải cotton pha lanh", size: "50x100 cm (khăn tay)", price: 8, rating: 4.4, reviews: 180, articleNumber: "150.084.06", description: "Khăn lau tay dệt hoa văn tổ ong êm ái, mau khô và thoáng khí.", images: ["https://images.unsplash.com/photo-1621468644541-deea173bd43e?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1621468644541-deea173bd43e?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80" }] },
    "51": { id: "51", name: "NÄRSEN", type: "Khăn tắm", material: "Cotton tái chế", size: "30x50 cm (khăn nhỏ)", price: 2, rating: 3.8, reviews: 410, articleNumber: "151.101.09", description: "Khăn lau mặt nhỏ gọn, tiện lợi và dễ mang theo khi đi công tác, du lịch.", images: ["https://images.unsplash.com/photo-1638232928539-6e91c47ddec5?q=80&w=830&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80"], colors: [{ name: "Trắng", image: "https://images.unsplash.com/photo-1638232928539-6e91c47ddec5?q=80&w=830&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }, { name: "Đen", image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80" }] }
  };

  reviewsList = [
    { id: 1, date: '2026-03-03', title: 'Đánh giá sau một năm sử dụng', text: 'Giường thực sự rất tốt. Khung không hề bị cọt kẹt như nhiều người lo lắng. Nhìn chung rất tiện dụng và êm ái.', rating: 4, author: 'Khách hàng ẩn danh', country: 'UK', helpful: 10 },
    { id: 2, date: '2026-02-11', title: 'Đẹp nhưng hơi có tiếng', text: 'Hơi có tiếng cọt kẹt khi cử động mạnh, nhưng đặt trong phòng nhìn rất sang và thẩm mỹ.', rating: 3, author: 'Khách hàng ẩn danh', country: 'UK', helpful: 5, response: 'Chúng tôi rất tiếc vì trải nghiệm này. Bạn vui lòng siết chặt lại các ốc vít định kỳ để giảm thiểu tiếng kêu nhé.' },
    { id: 3, date: '2025-12-05', title: 'Khung giường chắc chắn, hoàn thiện tốt', text: 'Chúng tôi rất thích chiếc giường này. Nó chắc chắn và trông tuyệt đẹp.', rating: 5, author: 'Khách hàng ẩn danh', country: 'Canada', helpful: 12 },
    { id: 4, date: '2025-10-20', title: 'Đã tròn một năm!', text: 'Tôi đã dùng khung giường này được một năm và thực sự không có gì phải phàn nàn. Xuất sắc!', rating: 5, author: 'Khách hàng ẩn danh', country: 'United States', helpful: 8 }
  ];

  roomCategoriesMap: Record<string, string[]> = {
    "bedroom": ["beds", "mattresses", "wardrobes", "bedding", "blankets", "lighting"],
    "living-room": ["sofas", "armchairs", "coffee-tables", "tv-stands", "rugs", "cabinets"],
    "kitchen": ["cabinets", "dining-tables", "chairs"],
    "bathroom": ["mirrors", "towels"],
    "dining-room": ["dining-tables", "chairs", "sideboards"]
  };

  get relatedProducts() {
    if (!this.product) return [];
    
    const list: any[] = [];
    const currentIdStr = this.productId || '';
    
    // 1. First, find all products of the same type
    for (const key of Object.keys(this.mockProductDatabase)) {
      if (key === currentIdStr) continue;
      const p = this.mockProductDatabase[key];
      if (p.type === this.product.type) {
        list.push({
          id: parseInt(p.id),
          name: p.name,
          type: p.type,
          price: p.price,
          badge: p.rating >= 4.5 ? 'Bán chạy' : null,
          image: p.images[0],
          room: this.currentRoom,
          category: this.currentCategory
        });
      }
    }
    
    // 2. If we need more products to make it look full (up to 4), grab from same room
    if (list.length < 4) {
      const categories = this.roomCategoriesMap[this.currentRoom] || [];
      for (const cat of categories) {
        if (list.length >= 4) break;
        
        const catTypes: Record<string, string> = {
          "beds": "Khung giường",
          "mattresses": "Nệm",
          "wardrobes": "Tủ quần áo",
          "bedding": "Bộ chăn ga",
          "blankets": "Chăn & Mền",
          "lighting": "Đèn",
          "sofas": "Sofa",
          "armchairs": "Ghế bành",
          "coffee-tables": "Bàn trà",
          "tv-stands": "Kệ TV",
          "rugs": "Thảm",
          "cabinets": "Tủ",
          "dining-tables": "Bàn ăn",
          "chairs": "Ghế ăn",
          "sideboards": "Tủ búp phê",
          "mirrors": "Gương",
          "towels": "Khăn tắm"
        };
        const targetType = catTypes[cat];
        if (!targetType) continue;
        
        for (const key of Object.keys(this.mockProductDatabase)) {
          if (list.length >= 4) break;
          if (key === currentIdStr) continue;
          if (list.some(item => item.id.toString() === key)) continue;
          
          const p = this.mockProductDatabase[key];
          if (p.type === targetType) {
            list.push({
              id: parseInt(p.id),
              name: p.name,
              type: p.type,
              price: p.price,
              badge: p.rating >= 4.5 ? 'Best seller' : null,
              image: p.images[0],
              room: this.currentRoom,
              category: cat
            });
          }
        }
      }
    }
    
    return list.slice(0, 4);
  }

  constructor(private route: ActivatedRoute, private router: Router, private cartService: CartService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const room = params.get('roomName');
      const category = params.get('categoryName');
      if (room) this.currentRoom = room;
      if (category) this.currentCategory = category;

      this.productId = params.get('productId');

      if (this.productId && this.mockProductDatabase[this.productId]) {
        this.product = this.mockProductDatabase[this.productId];
      } else {
        this.product = this.mockProductDatabase['2']; // Fallback to MALM (id: 2)
        this.productId = '2';
      }

      this.mainImage = this.product.images[0];
      this.selectedColor = this.product.colors[0].name;

      const sizes = this.getProductSizes();
      if (sizes.length > 0) {
        this.selectedSize = sizes[0].name;
      }

      // Smooth scroll to top when switching products
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  getProductSizes(): { name: string; premium: number }[] {
    if (!this.product) return [];
    const category = this.currentCategory?.toLowerCase() || '';

    if (category === 'beds') {
      return [
        { name: 'Giường đôi tiêu chuẩn', premium: 0 },
        { name: 'Cỡ King', premium: 60 },
        { name: '180x200 cm', premium: 120 }
      ];
    }
    if (category === 'mattresses') {
      return [
        { name: 'Giường đôi tiêu chuẩn', premium: 0 },
        { name: 'Cỡ King', premium: 40 },
        { name: '180x200 cm', premium: 80 }
      ];
    }
    if (category === 'bedding') {
      return [
        { name: '150x200 cm', premium: 0 },
        { name: '200x200 cm', premium: 10 },
        { name: '240x220 cm', premium: 20 }
      ];
    }
    if (category === 'blankets') {
      return [
        { name: '130x170 cm', premium: 0 },
        { name: '150x200 cm', premium: 15 },
        { name: '180x220 cm', premium: 30 }
      ];
    }
    if (category === 'towels') {
      return [
        { name: 'Khăn nhỏ (30x50 cm)', premium: 0 },
        { name: 'Khăn tay (50x100 cm)', premium: 6 },
        { name: 'Khăn tắm (70x140 cm)', premium: 12 }
      ];
    }
    if (category === 'rugs') {
      return [
        { name: '133x195 cm', premium: 0 },
        { name: '160x230 cm', premium: 40 },
        { name: '200x300 cm', premium: 90 }
      ];
    }
    if (category === 'sofas') {
      return [
        { name: '2 chỗ ngồi', premium: 0 },
        { name: '3 chỗ ngồi', premium: 100 },
        { name: 'Sofa góc chữ L', premium: 250 }
      ];
    }
    if (category === 'wardrobes' || category === 'cabinets' || category === 'sideboards') {
      return [
        { name: 'Tiêu chuẩn', premium: 0 },
        { name: 'Vừa', premium: 50 },
        { name: 'Lớn', premium: 100 }
      ];
    }
    if (category === 'armchairs') {
      return [
        { name: 'Tiêu chuẩn', premium: 0 },
        { name: 'Kèm đôn để chân', premium: 50 }
      ];
    }
    if (category === 'coffee-tables') {
      return [
        { name: 'Tiêu chuẩn', premium: 0 },
        { name: 'Lớn', premium: 30 }
      ];
    }
    if (category === 'mirrors') {
      return [
        { name: 'Nhỏ', premium: 0 },
        { name: 'Vừa', premium: 25 },
        { name: 'Lớn', premium: 50 }
      ];
    }

    // Default fallback
    return [
      { name: this.product.size || 'Tiêu chuẩn', premium: 0 }
    ];
  }

  get currentPrice(): number {
    if (!this.product) return 0;
    const sizes = this.getProductSizes();
    const selected = sizes.find(s => s.name === this.selectedSize);
    return this.product.price + (selected ? selected.premium : 0);
  }

  // Removes the current product from the "You may also like" list
  get filteredRelatedProducts() {
    return this.relatedProducts.filter(item => item.id.toString() !== this.productId);
  }

  get ratingStars() {
    const stars = [];
    if (!this.product) return [];
    const rating = this.product.rating;
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push('full');
      else if (rating >= i - 0.5) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  }

  changeMainImage(imgUrl: string) { this.mainImage = imgUrl; }
  selectColor(colorName: string) { this.selectedColor = colorName; }
  selectSize(sizeName: string) { this.selectedSize = sizeName; }
  toggleDetails() { this.isDetailsOpen = !this.isDetailsOpen; }
  setReviewTab(tab: string) { this.activeReviewTab = tab; }
  toggleSortMenu() { this.isSortMenuOpen = !this.isSortMenuOpen; this.isFilterMenuOpen = false; }
  toggleFilterMenu() { this.isFilterMenuOpen = !this.isFilterMenuOpen; this.isSortMenuOpen = false; }
  changeSort(sortType: string) { this.currentSort = sortType; this.isSortMenuOpen = false; }
  toggleWriteReview() { this.isWriteReviewOpen = !this.isWriteReviewOpen; }

  toggleReviewModal() {
    this.isReviewModalOpen = !this.isReviewModalOpen;
    document.body.style.overflow = this.isReviewModalOpen ? 'hidden' : 'auto';
  }

  get processedReviews() {
    let filtered = this.reviewsList.filter(r =>
      this.activeReviewTab === 'UK' ? r.country === 'UK' : r.country !== 'UK'
    );
    if (this.currentSort === 'newest') {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (this.currentSort === 'highest') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (this.currentSort === 'lowest') {
      filtered.sort((a, b) => a.rating - b.rating);
    }
    return filtered;
  }

  private createCartItem() {
    const variantId = `${this.product.id}-${this.selectedColor}-${this.selectedSize}`.replace(/\s+/g, '-').toLowerCase();

    return {
      id: variantId,
      name: this.product.name,
      description: `Màu sắc: ${this.selectedColor} | Kích thước: ${this.selectedSize}`,
      price: this.currentPrice,
      image: this.mainImage,
      productId: this.product.id.toString(),
      roomName: this.currentRoom,
      categoryName: this.currentCategory
    };
  }

  // Toast Notification
  showToast: boolean = false;
  toastMessage: string = '';
  toastTimeout: any;

  showToastNotification(message: string) {
    this.toastMessage = message;
    this.showToast = true;

    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  addToCart() {
    const itemToBuy = this.createCartItem();
    this.cartService.addToCart(itemToBuy);
    this.showToastNotification(`Đã thêm ${this.product.name} (Màu: ${this.selectedColor}) vào giỏ hàng!`);
  }

  buyNow() {
    const itemToBuy = this.createCartItem();
    this.cartService.addToCart(itemToBuy);
    this.router.navigate(['/cart']);
  }
}
