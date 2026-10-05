import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

interface RoomDesign {
  name: string;
  area: string;
  image: string;
  tag: string;
}

interface PlannerProduct {
  id: string;
  name: string;
  desc: string;
  price: number;
  image: string;
  category: string;
}

type ViewMode = 'dollhouse' | 'top' | 'side';

@Component({
  selector: 'app-module-4',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './module-4.html',
  styleUrl: './module-4.css',
})
export class Module4 {
  private readonly router = inject(Router);
  public readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);

  rooms: RoomDesign[] = [
    { name: 'Phòng khách', area: '32 m\u00B2', image: 'images/rooms/living-room.png', tag: 'Rộng rãi & ấm cúng' },
    { name: 'Phòng ngủ', area: '23 m\u00B2', image: 'images/rooms/bedroom.png', tag: 'Yên tĩnh & thư giãn' },
    { name: 'Phòng bếp', area: '18 m\u00B2', image: 'images/rooms/kitchen.png', tag: 'Sáng sủa & tiện nghi' },
    { name: 'Phòng ăn', area: '21 m\u00B2', image: 'images/rooms/dining-room.png', tag: 'Ấm áp & sum vầy' },
  ];

  // Select Size Modal state
  showSelectSizeModal = false;
  pendingRoomSelection: RoomDesign | null = null;
  selectedPreset: 'small' | 'medium' | 'large' | 'custom' = 'medium';
  selectLength = 6;
  selectWidth = 4;

  // Create Space Modal state
  showCreateSpaceModal = false;
  newSpaceName = '';
  newSpaceTag = '';
  newSpaceLength = 5;
  newSpaceWidth = 4;

  categories = ['Tất cả danh mục', 'Giường', 'Tủ quần áo', 'Ngăn kéo'];

  products: PlannerProduct[] = [
    { id: 'idanas', name: 'IDAN\u00C5S', desc: 'Tủ 6 ngăn kéo, trắng, 84x135 cm', price: 299, image: 'images/products/bedroom/beds/MALM.png', category: 'Ngăn kéo' },
    { id: 'vihals', name: 'VIHALS', desc: 'Tủ 6 ngăn kéo, trắng, 89x48x122 cm', price: 179, image: 'images/products/bedroom/beds/VIHALS.png', category: 'Ngăn kéo' },
    { id: 'gullaberg', name: 'GULLABERG', desc: 'Tủ 6 ngăn kéo, trắng, 89x48x122 cm', price: 225, image: 'images/products/bedroom/beds/GULLABERG.png', category: 'Ngăn kéo' },
    { id: 'slattum', name: 'SLATTUM', desc: 'Khung giường bọc nệm, 160x200 cm', price: 349, image: 'images/products/bedroom/beds/SLATTUM.png', category: 'Giường' },
    { id: 'malm', name: 'MALM', desc: 'Khung giường cao, trắng, 160x200 cm', price: 279, image: 'images/products/bedroom/beds/MALM-2.png', category: 'Giường' },
    { id: 'neiden', name: 'NEIDEN', desc: 'Khung giường gỗ thông, 90x200 cm', price: 89, image: 'images/products/bedroom/beds/NEIDEN.png', category: 'Giường' },
    { id: 'ramnefjall', name: 'RAMNEFJ\u00C4LL', desc: 'Khung giường bọc nệm, 140x200 cm', price: 399, image: 'images/products/bedroom/beds/RAMNEFJ\u00C4LL.png', category: 'Giường' },
    { id: 'vihals-w', name: 'VIHALS', desc: 'Tủ quần áo 2 cánh, trắng, 105 cm', price: 249, image: 'images/products/bedroom/beds/MALM-3.png', category: 'Tủ quần áo' },
  ];

  // ---- planner state ----
  plannerOpen = signal(false);
  activeRoom = signal<RoomDesign | null>(null);
  activeTab = signal<'add' | 'list'>('add');
  activeCategory = signal('Tất cả danh mục');
  searchTerm = signal('');
  view = signal<ViewMode>('dollhouse');
  placed = signal<PlannerProduct[]>([]);

  filteredProducts = computed<PlannerProduct[]>(() => {
    const cat = this.activeCategory();
    const term = this.searchTerm().trim().toLowerCase();
    return this.products.filter((p) => {
      if (cat !== 'Tất cả danh mục' && p.category !== cat) return false;
      if (term && !(p.name.toLowerCase().includes(term) || p.desc.toLowerCase().includes(term))) return false;
      return true;
    });
  });

  total = computed(() => this.placed().reduce((sum, p) => sum + p.price, 0));

  saveDesign() {
    if (this.authService.isLoggedIn) {
      alert('Thiết kế 3D của bạn đã được lưu thành công vào danh sách!');
      //sau này có Backend sẽ lưu thiệt
    } else {
      const confirmLogin = confirm(
        'Tính năng lưu thiết kế chỉ dành cho thành viên. Bạn có muốn chuyển đến trang đăng nhập không?'
      );
      
      if (confirmLogin) {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/design' } });
      }
    }
  }

  onRoomCardClick(room: RoomDesign) {
    this.pendingRoomSelection = room;
    this.selectedPreset = 'medium';
    this.selectLength = 6;
    this.selectWidth = 4;
    this.showSelectSizeModal = true;
  }

  selectSizePreset(preset: 'small' | 'medium' | 'large' | 'custom', length: number, width: number) {
    this.selectedPreset = preset;
    this.selectLength = length;
    this.selectWidth = width;
  }

  confirmRoomSize() {
    if (this.pendingRoomSelection) {
      this.pendingRoomSelection.area = `${this.selectLength * this.selectWidth} m²`;
      this.openPlanner(this.pendingRoomSelection);
    }
    this.showSelectSizeModal = false;
  }

  closeSelectSizeModal() {
    this.showSelectSizeModal = false;
  }

  openCreateSpaceModal() {
    this.newSpaceName = '';
    this.newSpaceTag = 'Hiện đại & ấm cúng';
    this.newSpaceLength = 5;
    this.newSpaceWidth = 4;
    this.showCreateSpaceModal = true;
  }

  closeCreateSpaceModal() {
    this.showCreateSpaceModal = false;
  }

  createCustomSpace() {
    if (this.newSpaceName.trim()) {
      this.rooms.push({
        name: this.newSpaceName.trim(),
        area: `${this.newSpaceLength * this.newSpaceWidth} m²`,
        image: 'images/rooms/living-room.png',
        tag: this.newSpaceTag.trim() || 'Không gian tùy chỉnh'
      });
    }
    this.showCreateSpaceModal = false;
  }

  goCheckout() {
    this.showSelectSizeModal = false;
    this.plannerOpen.set(false);
    
    // Add all placed items to the cart
    const placedItems = this.placed();
    placedItems.forEach(item => {
      this.cartService.addToCart({
        id: item.id,
        name: item.name,
        description: item.desc,
        price: item.price,
        image: item.image,
        productId: item.id,
        roomName: this.activeRoom()?.name || 'Phòng khách',
        categoryName: item.category
      });
    });

    this.router.navigate(['/cart']);
  }

  loadSavedDesign(roomType: string) {
    if (roomType === 'bedroom') {
      const items = [
        this.products.find(p => p.id === 'slattum'),
        this.products.find(p => p.id === 'vihals')
      ].filter(Boolean) as PlannerProduct[];
      this.placed.set(items);
    } else {
      const items = [
        this.products.find(p => p.id === 'idanas'),
        this.products.find(p => p.id === 'gullaberg')
      ].filter(Boolean) as PlannerProduct[];
      this.placed.set(items);
    }
    alert('Thiết kế đã được tải lên bản vẽ 3D!');
  }

  openPlanner(room: RoomDesign) {
    this.activeRoom.set(room);
    this.plannerOpen.set(true);
    this.activeTab.set('add');
    this.placed.set([]);
    this.view.set('dollhouse');
  }

  closePlanner() {
    this.plannerOpen.set(false);
  }

  setTab(tab: 'add' | 'list') {
    if (tab === 'list' && !this.authService.isLoggedIn) {
      const confirmLogin = confirm(
        'Bạn cần đăng nhập để xem các thiết kế đã lưu. Chuyển đến trang đăng nhập?'
      );
      if (confirmLogin) {
        this.plannerOpen.set(false);
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/design' } });
      }
      return;
    }
    this.activeTab.set(tab);
  }

  setCategory(cat: string) {
    this.activeCategory.set(cat);
  }

  setView(v: ViewMode) {
    this.view.set(v);
  }

  onSearch(ev: Event) {
    this.searchTerm.set((ev.target as HTMLInputElement).value);
  }

  addProduct(p: PlannerProduct) {
    this.placed.update((list) => [...list, p]);
  }

  removeProduct(index: number) {
    this.placed.update((list) => list.filter((_, i) => i !== index));
  }

  trackId = (_: number, p: PlannerProduct) => p.id;
}
