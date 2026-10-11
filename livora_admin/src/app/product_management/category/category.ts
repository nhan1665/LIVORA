import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CategoryDraft,
  CategoryListQuery,
  CategoryListResponse,
  CategoryStatusFilter,
  ProductCategory,
} from './category.model';
import { CategoryService } from './category.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category.html',
  // Note: category.css is imported globally in styles.css to stay well below the 8kB angular component style budget
})
export class Category implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly pageSize = 10;

  // State Signals
  readonly categories = signal<ProductCategory[]>([]);
  readonly loading = signal(true);
  readonly totalItems = signal(14);
  readonly totalPages = signal(2);
  readonly currentPage = signal(1);
  readonly activeCount = signal(12);
  readonly inactiveCount = signal(2);

  // Selected Row IDs
  readonly selectedIds = signal<Set<string>>(new Set<string>());

  // Filters
  searchDraft = '';
  statusDraft: CategoryStatusFilter = 'all';

  activeSearch = '';
  activeStatus: CategoryStatusFilter = 'all';

  // Modal State
  readonly isModalOpen = signal(false);
  readonly isEditMode = signal(false);
  readonly editingCategoryId = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  // Form Model
  formDraft: CategoryDraft = {
    code: '',
    name: '',
    slug: '',
    displayOrder: 1,
    isActive: true,
    description: '',
    parentId: null,
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const query: CategoryListQuery = {
      search: this.activeSearch,
      status: this.activeStatus,
      page: this.currentPage(),
      pageSize: this.pageSize,
    };

    this.categoryService.queryCategories(query).subscribe({
      next: (res: CategoryListResponse) => {
        this.categories.set(res.items);
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.page);
        this.activeCount.set(res.activeCount);
        this.inactiveCount.set(res.inactiveCount);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  // Search & Filter Handlers
  onSearchChange(): void {
    this.activeSearch = this.searchDraft;
    this.currentPage.set(1);
    this.loadData();
  }

  clearSearch(): void {
    this.searchDraft = '';
    this.onSearchChange();
  }

  onFilterChange(): void {
    this.activeStatus = this.statusDraft;
    this.currentPage.set(1);
    this.loadData();
  }

  resetFilters(): void {
    this.searchDraft = '';
    this.statusDraft = 'all';
    this.activeSearch = '';
    this.activeStatus = 'all';
    this.currentPage.set(1);
    this.loadData();
  }

  isFiltering(): boolean {
    return !!this.activeSearch || this.activeStatus !== 'all';
  }

  // Pagination
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadData();
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  paginationStartIndex(): number {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  paginationEndIndex(): number {
    return Math.min(this.currentPage() * this.pageSize, this.totalItems());
  }

  // Row Selection
  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelect(id: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedIds.set(next);
  }

  isAllSelected(): boolean {
    const list = this.categories();
    if (list.length === 0) return false;
    return list.every((c) => this.selectedIds().has(c.id));
  }

  toggleSelectAll(): void {
    const list = this.categories();
    const next = new Set(this.selectedIds());
    if (this.isAllSelected()) {
      for (const c of list) {
        next.delete(c.id);
      }
    } else {
      for (const c of list) {
        next.add(c.id);
      }
    }
    this.selectedIds.set(next);
  }

  // Status Toggle
  toggleStatus(cat: ProductCategory): void {
    this.categoryService.toggleStatus(cat.id).subscribe({
      next: () => {
        this.loadData();
      },
    });
  }

  // Modal Open/Close
  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingCategoryId.set(null);
    this.errorMessage.set('');
    this.formDraft = {
      code: '',
      name: '',
      slug: '',
      displayOrder: this.totalItems() + 1,
      isActive: true,
      description: '',
      parentId: null,
    };
    this.isModalOpen.set(true);
  }

  openEditModal(cat: ProductCategory): void {
    this.isEditMode.set(true);
    this.editingCategoryId.set(cat.id);
    this.errorMessage.set('');
    this.formDraft = {
      code: cat.code,
      name: cat.name,
      slug: cat.slug,
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
      description: cat.description,
      parentId: cat.parentId,
    };
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.errorMessage.set('');
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  onNameChange(): void {
    if (!this.isEditMode() || !this.formDraft.slug) {
      this.formDraft.slug = this.categoryService.slugify(this.formDraft.name);
    }
  }

  // Save Modal
  saveCategory(): void {
    if (!this.formDraft.code.trim()) {
      this.errorMessage.set('Vui lòng nhập mã loại sản phẩm (VD: CAT-SOFA).');
      return;
    }
    if (!this.formDraft.name.trim()) {
      this.errorMessage.set('Vui lòng nhập tên loại sản phẩm.');
      return;
    }
    if (!this.formDraft.slug.trim()) {
      this.formDraft.slug = this.categoryService.slugify(this.formDraft.name);
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    if (this.isEditMode() && this.editingCategoryId()) {
      this.categoryService.updateCategory(this.editingCategoryId()!, this.formDraft).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.message || 'Có lỗi xảy ra khi cập nhật.');
        },
      });
    } else {
      this.categoryService.createCategory(this.formDraft).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.message || 'Có lỗi xảy ra khi thêm mới.');
        },
      });
    }
  }

  confirmDelete(cat: ProductCategory): void {
    const ok = window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${cat.name}" (${cat.code}) không?`);
    if (ok) {
      this.categoryService.deleteCategory(cat.id).subscribe({
        next: () => {
          this.loadData();
        },
      });
    }
  }
}
