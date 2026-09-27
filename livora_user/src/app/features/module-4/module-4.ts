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
    { name: 'Living Room', area: '32 m\u00B2', image: 'images/rooms/living-room.png', tag: 'Spacious & cosy' },
    { name: 'Bedroom', area: '23 m\u00B2', image: 'images/rooms/bedroom.png', tag: 'Quiet & relaxing' },
    { name: 'Kitchen', area: '18 m\u00B2', image: 'images/rooms/kitchen.png', tag: 'Bright & functional' },
    { name: 'Dining Room', area: '21 m\u00B2', image: 'images/rooms/dining-room.png', tag: 'Warm & intimate' },
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

  categories = ['All categories', 'Beds', 'Wardrobes', 'Drawers'];

  products: PlannerProduct[] = [
    { id: 'idanas', name: 'IDAN\u00C5S', desc: '6-drawer chest, white, 84x135 cm', price: 299, image: 'images/products/bedroom/beds/MALM.png', category: 'Drawers' },
    { id: 'vihals', name: 'VIHALS', desc: '6-drawer chest, white, 89x48x122 cm', price: 179, image: 'images/products/bedroom/beds/VIHALS.png', category: 'Drawers' },
    { id: 'gullaberg', name: 'GULLABERG', desc: '6-drawer chest, white, 89x48x122 cm', price: 225, image: 'images/products/bedroom/beds/GULLABERG.png', category: 'Drawers' },
    { id: 'slattum', name: 'SLATTUM', desc: 'Upholstered bed frame, 160x200 cm', price: 349, image: 'images/products/bedroom/beds/SLATTUM.png', category: 'Beds' },
    { id: 'malm', name: 'MALM', desc: 'Bed frame, high, white, 160x200 cm', price: 279, image: 'images/products/bedroom/beds/MALM-2.png', category: 'Beds' },
    { id: 'neiden', name: 'NEIDEN', desc: 'Bed frame, pine, 90x200 cm', price: 89, image: 'images/products/bedroom/beds/NEIDEN.png', category: 'Beds' },
    { id: 'ramnefjall', name: 'RAMNEFJ\u00C4LL', desc: 'Upholstered bed frame, 140x200 cm', price: 399, image: 'images/products/bedroom/beds/RAMNEFJ\u00C4LL.png', category: 'Beds' },
    { id: 'vihals-w', name: 'VIHALS', desc: '2-door wardrobe, white, 105 cm', price: 249, image: 'images/products/bedroom/beds/MALM-3.png', category: 'Wardrobes' },
  ];

  // ---- planner state ----
  plannerOpen = signal(false);
  activeRoom = signal<RoomDesign | null>(null);
  activeTab = signal<'add' | 'list'>('add');
  activeCategory = signal('All categories');
  searchTerm = signal('');
  view = signal<ViewMode>('dollhouse');
  placed = signal<PlannerProduct[]>([]);

  filteredProducts = computed<PlannerProduct[]>(() => {
    const cat = this.activeCategory();
    const term = this.searchTerm().trim().toLowerCase();
    return this.products.filter((p) => {
      if (cat !== 'All categories' && p.category !== cat) return false;
      if (term && !(p.name.toLowerCase().includes(term) || p.desc.toLowerCase().includes(term))) return false;
      return true;
    });
  });

  total = computed(() => this.placed().reduce((sum, p) => sum + p.price, 0));

  saveDesign() {
    if (this.authService.isLoggedIn) {
      alert('Your 3D design has been successfully saved to the list!');
      //sau này có Backend sẽ lưu thiệt
    } else {
      const confirmLogin = confirm(
        'The design saving feature is only available to members. Would you like to go directly to the login page?'
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
    this.newSpaceTag = 'Modern & cosy';
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
        tag: this.newSpaceTag.trim() || 'Custom space'
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
        roomName: this.activeRoom()?.name || 'Living Room',
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
    alert('Design loaded onto 3D canvas!');
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
        'You need to log in to view your saved designs. Redirect to the login page?'
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
