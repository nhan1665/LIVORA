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
          id: p.id || p._id,
          code: p.sku || p.code || 'SP-001',
          name: p.name,
          roomIds: Array.isArray(p.roomIds) ? p.roomIds : (p.roomId ? [p.roomId] : []),
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

  forRoom(roomId: string): EligibleProduct[] {
    if (!roomId) return this.cachedProducts.filter((item) => item.saleable);
    return this.cachedProducts.filter((item) => item.saleable && (item.roomIds.length === 0 || item.roomIds.includes(roomId)));
  }
}
