import { Component, signal, computed, inject, OnInit, OnDestroy, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { SpaceService, UserSpaceItem } from '../../services/space.service';
import { ProductService, UserProduct } from '../../services/product.service';

export interface RoomDesign {
  id?: string;
  name: string;
  area: string;
  image: string;
  tag: string;
  file3DUrl?: string;
  roomId?: string;
  length?: number;
  width?: number;
  height?: number;
}

export interface PlannerProduct {
  id: string;
  name: string;
  desc: string;
  price: number;
  image: string;
  category: string;
  sku?: string;
}

export interface PlacedItem extends PlannerProduct {
  x: number; // percentage X on stage
  y: number; // percentage Y on stage
  placedId: string;
}

export interface SavedDesign {
  id: string;
  name: string;
  spaceName: string;
  glbFileName: string;
  date: string;
  totalPrice: number;
  itemCount: number;
  items: PlacedItem[];
  previewImage: string;
}

type ViewMode = 'dollhouse' | 'top' | 'side';

@Component({
  selector: 'app-module-4',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './module-4.html',
  styleUrl: './module-4.css',
})
export class Module4 implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  public readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly spaceService = inject(SpaceService);
  private readonly productService = inject(ProductService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Default fallback rooms if backend has no spaces yet
  readonly defaultRooms: RoomDesign[] = [
    { name: 'Phòng khách', area: '32 m²', image: 'images/rooms/living-room.png', tag: 'Rộng rãi & ấm cúng', length: 8, width: 4, height: 2.8 },
    { name: 'Phòng ngủ', area: '23 m²', image: 'images/rooms/bedroom.png', tag: 'Yên tĩnh & thư giãn', length: 6, width: 4, height: 2.8 },
    { name: 'Phòng bếp', area: '18 m²', image: 'images/rooms/kitchen.png', tag: 'Sáng sủa & tiện nghi', length: 5, width: 3.6, height: 2.8 },
    { name: 'Phòng ăn', area: '21 m²', image: 'images/rooms/dining-room.png', tag: 'Ấm áp & sum vầy', length: 6, width: 3.5, height: 2.8 },
  ];

  rooms: RoomDesign[] = [...this.defaultRooms];

  // Select Size Modal state
  showSelectSizeModal = false;
  pendingRoomSelection: RoomDesign | null = null;
  selectedPreset: 'small' | 'medium' | 'large' | 'custom' = 'medium';
  selectLength = 6;
  selectWidth = 4;

  categories: string[] = ['Tất cả danh mục', 'Giường', 'Tủ quần áo', 'Ngăn kéo', 'Sofa', 'Bàn trà', 'Bàn ăn', 'Ghế'];

  readonly defaultProducts: PlannerProduct[] = [
    { id: 'idanas', name: 'IDANÄS', desc: 'Tủ 6 ngăn kéo, trắng, 84x135 cm', price: 299, image: 'images/products/bedroom/beds/MALM.png', category: 'Ngăn kéo' },
    { id: 'vihals', name: 'VIHALS', desc: 'Tủ 6 ngăn kéo, trắng, 89x48x122 cm', price: 179, image: 'images/products/bedroom/beds/VIHALS.png', category: 'Ngăn kéo' },
    { id: 'gullaberg', name: 'GULLABERG', desc: 'Tủ 6 ngăn kéo, trắng, 89x48x122 cm', price: 225, image: 'images/products/bedroom/beds/GULLABERG.png', category: 'Ngăn kéo' },
    { id: 'slattum', name: 'SLATTUM', desc: 'Khung giường bọc nệm, 160x200 cm', price: 349, image: 'images/products/bedroom/beds/SLATTUM.png', category: 'Giường' },
    { id: 'malm', name: 'MALM', desc: 'Khung giường cao, trắng, 160x200 cm', price: 279, image: 'images/products/bedroom/beds/MALM-2.png', category: 'Giường' },
    { id: 'neiden', name: 'NEIDEN', desc: 'Khung giường gỗ thông, 90x200 cm', price: 89, image: 'images/products/bedroom/beds/NEIDEN.png', category: 'Giường' },
    { id: 'ramnefjall', name: 'RAMNEFJÄLL', desc: 'Khung giường bọc nệm, 140x200 cm', price: 399, image: 'images/products/bedroom/beds/RAMNEFJÄLL.png', category: 'Giường' },
    { id: 'vihals-w', name: 'VIHALS', desc: 'Tủ quần áo 2 cánh, trắng, 105 cm', price: 249, image: 'images/products/bedroom/beds/MALM-3.png', category: 'Tủ quần áo' },
  ];

  products: PlannerProduct[] = [...this.defaultProducts];

  // ---- planner state ----
  plannerOpen = signal(false);
  activeRoom = signal<RoomDesign | null>(null);
  activeTab = signal<'add' | 'list'>('add');
  activeCategory = signal('Tất cả danh mục');
  searchTerm = signal('');
  view = signal<ViewMode>('dollhouse');
  placed = signal<PlacedItem[]>([]);

  // ---- GLB 3D Model state ----
  currentGlbUrl: string | null = null;
  currentGlbName: string = '';
  isDraggingOverStage: boolean = false;
  draggedProduct: PlannerProduct | null = null;

  // ---- Saved Designs list ----
  savedDesigns = signal<SavedDesign[]>([]);

  // Toast
  showToast: boolean = false;
  toastMessage: string = '';
  private toastTimeout: any;

  ngOnInit(): void {
    this.loadAdminSpaces();
    this.loadProducts();
    this.loadSavedDesignsFromStorage();
  }

  ngOnDestroy(): void {
    if (this.currentGlbUrl && this.currentGlbUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentGlbUrl);
    }
  }

  loadAdminSpaces(): void {
    this.spaceService.getSpaceTemplates().subscribe({
      next: (spaces) => {
        if (Array.isArray(spaces) && spaces.length > 0) {
          const roomImages: Record<string, string> = {
            'phòng ngủ': 'images/rooms/bedroom.png',
            'phòng bếp': 'images/rooms/kitchen.png',
            'phòng ăn': 'images/rooms/dining-room.png',
            'phòng tắm': 'images/rooms/bathroom.jpg',
            'phòng khách': 'images/rooms/living-room.png',
          };

          const resolveImage = (s: UserSpaceItem): string => {
            // 1. If the space has a base64 or external url image, use it directly!
            if (s.previewImage && (s.previewImage.startsWith('data:image') || s.previewImage.startsWith('http'))) {
              return s.previewImage;
            }

            // 2. Prioritize matching by the assigned room name
            const rName = (s.roomName || '').trim().toLowerCase();
            for (const [key, val] of Object.entries(roomImages)) {
              if (rName.includes(key)) return val;
            }

            // 3. If previewImage has a specific local path
            if (s.previewImage && !s.previewImage.includes('default-space')) {
              let p = s.previewImage;
              if (p.startsWith('/')) p = p.slice(1);
              return p;
            }

            // 4. Fallback matching by space name
            const sName = (s.name || '').toLowerCase();
            if (sName.includes('ngủ') || sName.includes('bed')) return 'images/rooms/bedroom.png';
            if (sName.includes('bếp') || sName.includes('kitchen')) return 'images/rooms/kitchen.png';
            if (sName.includes('ăn') || sName.includes('dining')) return 'images/rooms/dining-room.png';
            if (sName.includes('tắm') || sName.includes('bath')) return 'images/rooms/bathroom.jpg';

            return 'images/rooms/living-room.png';
          };

          this.rooms = spaces.map((s) => ({
            id: s.id,
            name: s.name,
            area: s.area || `${(s.lengthM || 6) * (s.widthM || 4)} m²`,
            image: resolveImage(s),
            tag: s.file3DUrl ? 'Mô hình 3D (.GLB)' : (s.roomName || 'Không gian chuẩn'),
            file3DUrl: s.file3DUrl || '',
            roomId: s.roomId,
            length: s.lengthM || 6,
            width: s.widthM || 4,
            height: s.heightM || 2.8,
          }));
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.warn('Using default spaces fallback:', err)
    });
  }

  loadProducts(): void {
    this.productService.getProducts({ all: true } as any).subscribe({
      next: (res) => {
        if (Array.isArray(res) && res.length > 0) {
          const mapped = res.map((p) => ({
            id: p.id || p.slug,
            name: p.name,
            desc: p.description ? p.description.slice(0, 50) + '...' : `Sản phẩm cao cấp LIVORA`,
            price: p.salePrice || p.price || 99,
            image: p.thumbnail || (p.images && p.images[0]) || 'images/products/bedroom/beds/MALM.png',
            category: p.categoryName || 'Nội thất',
            sku: p.sku
          }));

          this.products = [...mapped, ...this.defaultProducts];

          const distinctCats = Array.from(new Set(this.products.map(p => p.category).filter(Boolean)));
          this.categories = ['Tất cả danh mục', ...distinctCats];
          this.cdr.detectChanges();
        }
      },
      error: () => console.warn('Using default products fallback')
    });
  }

  loadSavedDesignsFromStorage(): void {
    try {
      const stored = localStorage.getItem('livora_user_saved_designs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.savedDesigns.set(parsed);
          return;
        }
      }
    } catch {}

    // Default sample saved designs
    this.savedDesigns.set([
      {
        id: 'des-sample-1',
        name: 'Phòng ngủ ấm cúng Master',
        spaceName: 'Phòng ngủ',
        glbFileName: 'bedroom_scandi.glb',
        date: '01/07/2026 14:30',
        totalPrice: 528,
        itemCount: 2,
        items: [
          { ...this.defaultProducts[3], x: 35, y: 45, placedId: 'p-1' },
          { ...this.defaultProducts[1], x: 65, y: 55, placedId: 'p-2' }
        ],
        previewImage: 'images/rooms/bedroom.png'
      },
      {
        id: 'des-sample-2',
        name: 'Phòng khách tối giản Japandi',
        spaceName: 'Phòng khách',
        glbFileName: 'living_minimal.glb',
        date: '05/07/2026 10:15',
        totalPrice: 524,
        itemCount: 2,
        items: [
          { ...this.defaultProducts[0], x: 30, y: 48, placedId: 'p-3' },
          { ...this.defaultProducts[2], x: 62, y: 52, placedId: 'p-4' }
        ],
        previewImage: 'images/rooms/living-room.png'
      }
    ]);
  }

  showToastNotification(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

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

  isGlbFile(filename: string): boolean {
    if (!filename) return false;
    return filename.toLowerCase().endsWith('.glb') || filename.toLowerCase().endsWith('.gltf');
  }

  isImageFile(filename: string): boolean {
    if (!filename) return false;
    return /\.(png|jpe?g|webp|gif|svg)$/i.test(filename);
  }

  // ============ GLB & Custom File Handling ============
  onGlbFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (this.currentGlbUrl && this.currentGlbUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentGlbUrl);
    }

    this.currentGlbUrl = URL.createObjectURL(file);
    this.currentGlbName = file.name;
    this.showToastNotification(`Đã tải lên tệp không gian: ${file.name}`);
    this.cdr.detectChanges();
  }

  removeCurrentGlb(): void {
    if (this.currentGlbUrl && this.currentGlbUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentGlbUrl);
    }
    this.currentGlbUrl = null;
    this.currentGlbName = '';
    this.showToastNotification('Đã gỡ mô hình, chuyển về chế độ phòng 3D trực quan.');
  }

  // ============ Drag & Drop Product into 3D Stage ============
  onProductDragStart(event: DragEvent, product: PlannerProduct): void {
    this.draggedProduct = product;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', product.id);
      event.dataTransfer.setData('application/json', JSON.stringify(product));
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onProductDragEnd(): void {
    this.draggedProduct = null;
    this.isDraggingOverStage = false;
  }

  onStageDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    this.isDraggingOverStage = true;
  }

  onStageDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as HTMLElement;
    if (!target.contains(related)) {
      this.isDraggingOverStage = false;
    }
  }

  onStageDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOverStage = false;

    // Check if user dropped any file (glb, image, model, etc.)
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.currentGlbUrl && this.currentGlbUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.currentGlbUrl);
      }
      this.currentGlbUrl = URL.createObjectURL(file);
      this.currentGlbName = file.name;
      this.showToastNotification(`Đã thả và nạp tệp không gian: ${file.name}`);
      this.cdr.detectChanges();
      return;
    }

    // Otherwise check for product drop
    let prod: PlannerProduct | null = this.draggedProduct;
    if (!prod && event.dataTransfer) {
      try {
        const raw = event.dataTransfer.getData('application/json');
        if (raw) prod = JSON.parse(raw);
      } catch {}
    }

    if (!prod) return;

    // Calculate drop percentage coordinates inside stage
    const stageEl = event.currentTarget as HTMLElement;
    const rect = stageEl.getBoundingClientRect();
    const x = Math.max(8, Math.min(88, Math.round(((event.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(15, Math.min(82, Math.round(((event.clientY - rect.top) / rect.height) * 100)));

    const placedItem: PlacedItem = {
      ...prod,
      x,
      y,
      placedId: 'placed-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
    };

    this.placed.update((list) => [...list, placedItem]);
    this.showToastNotification(`Đã thả ${prod.name} vào không gian 3D!`);
  }

  // ============ Save Design ============
  saveDesign(): void {
    const placedItems = this.placed();
    if (placedItems.length === 0) {
      alert('Vui lòng kéo thả hoặc thêm ít nhất một sản phẩm vào không gian trước khi lưu!');
      return;
    }

    const room = this.activeRoom();
    const newDesign: SavedDesign = {
      id: 'des-' + Date.now(),
      name: `Thiết kế ${room?.name || 'Không gian'} (${new Date().toLocaleDateString('vi-VN')})`,
      spaceName: room?.name || 'Không gian 3D',
      glbFileName: this.currentGlbName || room?.file3DUrl || 'Không gian chuẩn',
      date: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
      totalPrice: this.total(),
      itemCount: placedItems.length,
      items: [...placedItems],
      previewImage: room?.image || 'images/rooms/living-room.png'
    };

    // Save to local storage
    this.savedDesigns.update((list) => [newDesign, ...list]);
    try {
      localStorage.setItem('livora_user_saved_designs', JSON.stringify(this.savedDesigns()));
    } catch {}

    // Save to backend if user is logged in
    if (this.authService.isLoggedIn) {
      this.spaceService.saveDesign({
        name: newDesign.name,
        roomId: room?.roomId,
        customerId: this.authService.currentUser()?.id,
        file3DUrl: newDesign.glbFileName,
        previewImage: newDesign.previewImage,
        dimensions: { length: room?.length || 6, width: room?.width || 4, height: room?.height || 2.8 },
        layoutData: { items: newDesign.items },
        suggestedProducts: newDesign.items.map(p => p.id)
      }).subscribe({
        next: () => console.log('Saved to backend database successfully.'),
        error: (e) => console.warn('Backend save skipped:', e)
      });
    }

    this.showToastNotification(`Đã lưu thiết kế với ${placedItems.length} sản phẩm thành công!`);
    // Automatically switch to 'list' tab to show saved designs
    this.activeTab.set('list');
  }

  loadSavedDesignItem(design: SavedDesign): void {
    this.placed.set([...design.items]);
    if (design.glbFileName && design.glbFileName !== 'Không gian chuẩn') {
      this.currentGlbName = design.glbFileName;
    }
    this.activeTab.set('add');
    this.showToastNotification(`Đã nạp thiết kế "${design.name}" lên bản vẽ 3D!`);
  }

  deleteSavedDesign(designId: string, event: Event): void {
    event.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa thiết kế này?')) return;
    this.savedDesigns.update((list) => list.filter(d => d.id !== designId));
    try {
      localStorage.setItem('livora_user_saved_designs', JSON.stringify(this.savedDesigns()));
    } catch {}
    this.showToastNotification('Đã xóa thiết kế khỏi danh sách.');
  }

  addDesignToCart(design: SavedDesign, event: Event): void {
    event.stopPropagation();
    design.items.forEach((item) => {
      this.cartService.addToCart({
        id: item.id,
        name: item.name,
        description: item.desc,
        price: item.price,
        image: item.image,
        productId: item.id,
        roomName: design.spaceName,
        categoryName: item.category
      });
    });
    this.showToastNotification(`Đã thêm ${design.items.length} sản phẩm từ thiết kế vào giỏ hàng!`);
  }

  // ============ Room Selection & Planner Open ============
  onRoomCardClick(room: RoomDesign): void {
    this.pendingRoomSelection = room;
    this.selectedPreset = 'medium';
    this.selectLength = room.length || 6;
    this.selectWidth = room.width || 4;
    this.showSelectSizeModal = true;
  }

  selectSizePreset(preset: 'small' | 'medium' | 'large' | 'custom', length: number, width: number): void {
    this.selectedPreset = preset;
    this.selectLength = length;
    this.selectWidth = width;
  }

  confirmRoomSize(): void {
    if (this.pendingRoomSelection) {
      this.pendingRoomSelection.area = `${this.selectLength * this.selectWidth} m²`;
      this.pendingRoomSelection.length = this.selectLength;
      this.pendingRoomSelection.width = this.selectWidth;
      this.openPlanner(this.pendingRoomSelection);
    }
    this.showSelectSizeModal = false;
  }

  closeSelectSizeModal(): void {
    this.showSelectSizeModal = false;
  }

  openPlanner(room: RoomDesign): void {
    this.activeRoom.set(room);
    this.plannerOpen.set(true);
    this.activeTab.set('add');
    this.placed.set([]);
    this.view.set('dollhouse');

    if (room.file3DUrl) {
      this.currentGlbName = room.file3DUrl.split('/').pop() || room.file3DUrl;
      this.currentGlbUrl = room.file3DUrl.startsWith('http') || room.file3DUrl.startsWith('/') ? room.file3DUrl : null;
    } else {
      this.currentGlbName = '';
      this.currentGlbUrl = null;
    }
  }

  closePlanner(): void {
    this.plannerOpen.set(false);
  }

  setTab(tab: 'add' | 'list'): void {
    this.activeTab.set(tab);
  }

  setCategory(cat: string): void {
    this.activeCategory.set(cat);
  }

  setView(v: ViewMode): void {
    this.view.set(v);
  }

  onSearch(ev: Event): void {
    this.searchTerm.set((ev.target as HTMLInputElement).value);
  }

  addProduct(p: PlannerProduct): void {
    const count = this.placed().length;
    const x = 20 + (count % 4) * 18;
    const y = 35 + (count % 3) * 16;
    const item: PlacedItem = {
      ...p,
      x,
      y,
      placedId: 'placed-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
    };
    this.placed.update((list) => [...list, item]);
    this.showToastNotification(`Đã thêm ${p.name} vào không gian!`);
  }

  removeProduct(index: number): void {
    this.placed.update((list) => list.filter((_, i) => i !== index));
  }

  goCheckout(): void {
    this.showSelectSizeModal = false;
    this.plannerOpen.set(false);
    
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

  trackId = (_: number, p: PlannerProduct) => p.id;
  trackPlacedId = (_: number, p: PlacedItem) => p.placedId;
}
