import { Injectable, inject } from '@angular/core';
import { ProductService } from '../../product_management/product/product.service';

export interface EligibleProduct {
  id: string;
  code: string;
  name: string;
  roomIds: string[];
  saleable: boolean;
}

@Injectable({ providedIn: 'root' })
export class EligibleProductService {
  private readonly productService = inject(ProductService);
  private cachedProducts: EligibleProduct[] = [];

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.productService.getAllProducts().subscribe({
      next: (items) => {
        this.cachedProducts = (items || []).map((p: any) => ({
          id: String(p.id || p._id || ''),
          code: p.sku || p.code || 'SP-001',
          name: p.name,
          roomIds: Array.isArray(p.roomIds)
            ? p.roomIds.map((r: any) => (r && typeof r === 'object' ? String(r._id || r.id || '') : String(r || '')))
            : (p.roomId ? [String(p.roomId)] : []),
          saleable: p.status === 'Đang kinh doanh' || p.status === 'active' || p.isActive !== false,
        }));
      },
      error: () => {
        this.cachedProducts = [];
      },
    });
  }

  get products(): readonly EligibleProduct[] {
    return this.cachedProducts;
  }

  find(id: string): EligibleProduct | undefined {
    return this.cachedProducts.find((item) => item.id === id);
  }

  forRoom(roomId: string, currentProductId?: string): EligibleProduct[] {
    const allSaleable = this.cachedProducts.filter((item) => item.saleable);
    if (!roomId) return allSaleable;
    const roomProducts = allSaleable.filter((item) => item.roomIds.length === 0 || item.roomIds.includes(roomId));
    
    // Nếu có sản phẩm hiện tại của hotspot mà chưa nằm trong danh sách, thêm vào để không bị mất option trong select
    if (currentProductId) {
      const current = this.cachedProducts.find((item) => item.id === currentProductId);
      if (current && !roomProducts.some((item) => item.id === currentProductId)) {
        roomProducts.unshift(current);
      }
    }
    return roomProducts.length > 0 ? roomProducts : allSaleable;
  }
}
