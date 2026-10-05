import { Component, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
}

export interface Hotspot {
  top: number; // percentage coordinate
  left: number; // percentage coordinate
  product: Product;
}

export interface Room {
  id: string;
  name: string;
  category: 'Phòng ngủ' | 'Phòng khách' | 'Phòng bếp' | 'Phòng tắm' | 'Phòng ăn' | 'Bedroom' | 'Living Room' | 'Kitchen' | 'Bathroom' | 'Dining room' | string;
  image: string;
  hotspots: Hotspot[];
}

@Component({
  selector: 'app-module-3',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './module-3.html',
  styleUrl: './module-3.css',
})
export class Module3 implements OnDestroy {
  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Active filter category
  selectedCategory: string = 'Tất cả';

  // Filter options matching the screenshot exactly
  readonly categories: string[] = ['Tất cả', 'Phòng ngủ', 'Phòng khách', 'Phòng bếp', 'Phòng tắm', 'Phòng ăn'];

  // Shop the Look Rooms database
  readonly rooms: Room[] = [
    {
      id: 'bedroom-scandic',
      name: 'Phòng ngủ phong cách Bắc Âu thanh bình',
      category: 'Phòng ngủ',
      image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
      hotspots: [
        {
          top: 48,
          left: 38,
          product: {
            id: '10',
            name: 'Bộ chăn ga DVALA',
            category: 'Bộ chăn ga',
            price: 20,
            description: 'Chất liệu cotton mềm mại, dễ giặt ủi và thân thiện với làn da.',
            image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80'
          }
        },
        {
          top: 62,
          left: 50,
          product: {
            id: '1',
            name: 'Khung giường gỗ thông NEIDEN',
            category: 'Giường',
            price: 89,
            description: 'Thiết kế nhỏ gọn, hoàn hảo cho không gian hẹp hoặc trần nhà thấp.',
            image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80'
          }
        },
        {
          top: 18,
          left: 75,
          product: {
            id: '16',
            name: 'Đèn thủy tinh mờ FADO',
            category: 'Đèn',
            price: 19,
            description: 'Chao đèn thủy tinh mờ lan tỏa ánh sáng dịu nhẹ khắp căn phòng.',
            image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80'
          }
        }
      ]
    },
    {
      id: 'living-cosy',
      name: 'Phòng khách tối giản ấm cúng',
      category: 'Phòng khách',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
      hotspots: [
        {
          top: 68,
          left: 32,
          product: {
            id: '40',
            name: 'Ghế bọc đệm ODGER',
            category: 'Ghế',
            price: 45,
            description: 'Thiết kế công thái học với lòng ghế uốn cong tạo cảm giác dễ chịu khi ngồi.',
            image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80'
          }
        },
        {
          top: 72,
          left: 72,
          product: {
            id: '38',
            name: 'Bàn ăn gỗ sồi LISABO',
            category: 'Bàn ăn',
            price: 79,
            description: 'Bộ bàn ăn gỗ thông truyền thống đi kèm 4 ghế đồng bộ thanh lịch.',
            image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80'
          }
        },
        {
          top: 32,
          left: 68,
          product: {
            id: '16',
            name: 'Đèn thủy tinh mờ FADO',
            category: 'Đèn',
            price: 19,
            description: 'Chao đèn thủy tinh mờ lan tỏa ánh sáng dịu nhẹ khắp căn phòng.',
            image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80'
          }
        }
      ]
    },
    {
      id: 'kitchen-modern',
      name: 'Phòng bếp hiện đại và tinh tế',
      category: 'Phòng bếp',
      image: 'https://images.unsplash.com/photo-1617228069096-4638a7ffc906?q=80&w=1742&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      hotspots: [
        {
          top: 65,
          left: 45,
          product: {
            id: '38',
            name: 'Bàn ăn gỗ sồi LISABO',
            category: 'Bàn ăn',
            price: 79,
            description: 'Bộ bàn ăn gỗ thông truyền thống đi kèm 4 ghế đồng bộ thanh lịch.',
            image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80'
          }
        },
        {
          top: 68,
          left: 62,
          product: {
            id: '40',
            name: 'Ghế ăn ODGER',
            category: 'Ghế',
            price: 45,
            description: 'Thiết kế công thái học với lòng ghế uốn cong tạo cảm giác dễ chịu khi ngồi.',
            image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80'
          }
        }
      ]
    },
    {
      id: 'bathroom-spa',
      name: 'Phòng tắm phong cách spa thư giãn',
      category: 'Phòng tắm',
      image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80',
      hotspots: [
        {
          top: 35,
          left: 50,
          product: {
            id: '16',
            name: 'Đèn thủy tinh mờ FADO',
            category: 'Đèn',
            price: 19,
            description: 'Chao đèn thủy tinh mờ lan tỏa ánh sáng dịu nhẹ khắp căn phòng.',
            image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80'
          }
        }
      ]
    },
    {
      id: 'dining-room-warm',
      name: 'Phòng ăn gia đình sum họp ấm áp',
      category: 'Phòng ăn',
      image: 'https://images.unsplash.com/photo-1616486886892-ff366aa67ba4?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      hotspots: [
        {
          top: 55,
          left: 40,
          product: {
            id: '40',
            name: 'Ghế bọc đệm ODGER',
            category: 'Ghế',
            price: 45,
            description: 'Thiết kế công thái học với lòng ghế uốn cong tạo cảm giác dễ chịu khi ngồi.',
            image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80'
          }
        },
        {
          top: 58,
          left: 65,
          product: {
            id: '38',
            name: 'Bàn ăn gỗ sồi LISABO',
            category: 'Bàn ăn',
            price: 79,
            description: 'Bộ bàn ăn gỗ thông truyền thống đi kèm 4 ghế đồng bộ thanh lịch.',
            image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80'
          }
        }
      ]
    }
  ];

  // Active room for full screen modal view
  selectedRoom: Room | null = null;

  showToast: boolean = false;
  toastMessage: string = '';
  toastTimeout: any;

  showToastNotification(message: string) {
    this.toastMessage = message;
    this.showToast = true;

    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges(); // Force Angular to update the UI immediately
    }, 3000);
  }

  filterCategory(category: string) {
    this.selectedCategory = category;
  }

  get filteredRooms(): Room[] {
    if (this.selectedCategory === 'Tất cả') {
      return this.rooms;
    }
    return this.rooms.filter(room => room.category === this.selectedCategory);
  }

  openRoomModal(room: Room) {
    this.selectedRoom = room;
    // Disable background scroll
    document.body.style.overflow = 'hidden';
  }

  closeRoomModal() {
    this.selectedRoom = null;
    // Enable background scroll
    document.body.style.overflow = '';
  }

  redirectToProduct(prodId: string, event: Event) {
    event.stopPropagation();
    this.closeRoomModal();

    let roomName = 'bedroom';
    let categoryName = 'beds';
    let productId = '1';

    if (prodId === 'neiden-bed' || prodId === '1') {
      productId = '1';
      roomName = 'bedroom'; categoryName = 'beds';
    } else if (prodId === 'pillow-1' || prodId === '10') {
      productId = '10';
      roomName = 'bedroom'; categoryName = 'bedding';
    } else if (prodId === 'chair-odger' || prodId === '40') {
      productId = '40';
      roomName = 'dining-room'; categoryName = 'chairs';
    } else if (prodId === 'lisabo-table' || prodId === '38') {
      productId = '38';
      roomName = 'dining-room'; categoryName = 'dining-tables';
    } else if (prodId === 'lamp-fado' || prodId === '16') {
      productId = '16';
      roomName = 'living-room'; categoryName = 'lighting';
    }

    this.router.navigate(['/rooms', roomName, categoryName, productId]);
  }

  addToCart(prod: Product, event: Event) {
    event.stopPropagation();

    this.cartService.addToCart({
      id: prod.id,
      name: prod.name,
      description: prod.description,
      price: prod.price,
      image: prod.image
    });

    this.showToastNotification(`Đã thêm ${prod.name} vào giỏ hàng!`);
  }
}
