import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type ColumnType =
  | 'text'
  | 'badge'
  | 'number'
  | 'currency'
  | 'date'
  | 'actions'
  | 'image'
  | 'custom';

export type BadgeVariant =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'completed'
  | 'danger'
  | 'warning'
  | 'info'
  | 'default';

export interface BadgeInfo {
  label: string;
  variant: BadgeVariant;
  customDotColor?: string;
  customBgColor?: string;
  customTextColor?: string;
}

export type ActionVariant = 'view' | 'edit' | 'hide' | 'delete' | 'more' | 'default';

export interface TableAction<T = any> {
  id: string;
  label?: string;
  variant?: ActionVariant;
  icon?: string; // bootstrap icon class or custom icon
  show?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  danger?: boolean;
}

export interface TableColumn<T = any> {
  key: string;
  label: string;
  type?: ColumnType;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  formatter?: (value: any, row: T) => string;
  badgeResolver?: (value: any, row: T) => BadgeInfo;
  actions?: TableAction<T>[];
  cellTemplate?: TemplateRef<any>;
}

export interface TableSort {
  key: string;
  direction: 'asc' | 'desc' | null;
}

export interface TableActionEvent<T = any> {
  action: string;
  row: T;
  index?: number;
}

@Component({
  selector: 'app-data-table',
  imports: [CommonModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTable<T = any> {
  // Input: Columns definition
  @Input() columns: TableColumn<T>[] = [];

  // Input: Data items
  @Input() data: T[] = [];

  // Input: Loading state
  @Input() loading: boolean = false;

  // Input: Empty state messages
  @Input() emptyMessage: string = 'Không có dữ liệu';
  @Input() emptySubMessage: string = 'Hiện tại chưa có bản ghi nào để hiển thị.';
  @Input() itemLabel: string = '';

  // Input: Default actions if column doesn't specify its own
  @Input() actions: TableAction<T>[] = [];

  // Input: Pagination properties
  @Input() showPagination: boolean = true;
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 10;
  @Input() totalPages?: number;

  // Input: Row selection
  @Input() selectable: boolean = false;
  @Input() rowKey: string = 'id';
  @Input() selectedRows: T[] = [];

  // Outputs
  @Output() pageChange = new EventEmitter<number>();
  @Output() actionClick = new EventEmitter<TableActionEvent<T>>();
  @Output() rowClick = new EventEmitter<{ row: T; index: number }>();
  @Output() sortChange = new EventEmitter<TableSort>();
  @Output() selectionChange = new EventEmitter<T[]>();

  // Current sorting state
  currentSort: TableSort = { key: '', direction: null };

  // Track image load errors
  private failedImages = new Set<string>();

  // Default action sets if parent doesn't provide custom actions
  readonly defaultRowActions: TableAction<T>[] = [
    { id: 'view', label: 'Xem', variant: 'view' },
    { id: 'edit', label: 'Chỉnh sửa', variant: 'edit' },
    { id: 'hide', label: 'Ẩn', variant: 'hide' },
    { id: 'delete', label: 'Xóa', variant: 'delete' },
  ];

  // ===================== PAGINATION GETTERS =====================

  get totalPagesCount(): number {
    if (this.totalPages && this.totalPages > 0) {
      return this.totalPages;
    }
    const perPage = this.itemsPerPage > 0 ? this.itemsPerPage : 10;
    return Math.max(1, Math.ceil(this.totalItems / perPage));
  }

  get startItemIndex(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItemIndex(): number {
    if (this.totalItems === 0) return 0;
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  get pageNumbers(): (number | string)[] {
    const total = this.totalPagesCount;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (current > 3) {
        pages.push('...');
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }
      pages.push(total);
    }

    return pages;
  }

  // ===================== PAGINATION HANDLERS =====================

  onPageChange(page: number | string): void {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.totalPagesCount || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.pageChange.emit(page);
  }

  onPrevPage(): void {
    if (this.currentPage > 1) {
      this.onPageChange(this.currentPage - 1);
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPagesCount) {
      this.onPageChange(this.currentPage + 1);
    }
  }

  // ===================== CELL VALUE RESOLVERS =====================

  getCellValue(row: any, key: string): any {
    if (!row || !key) return undefined;
    // Support nested properties: 'user.name'
    if (key.includes('.')) {
      return key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), row);
    }
    return row[key];
  }

  formatCell(row: T, col: TableColumn<T>): string {
    const rawValue = this.getCellValue(row, col.key);

    if (col.formatter) {
      return col.formatter(rawValue, row);
    }

    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return '—';
    }

    return String(rawValue);
  }

  formatCurrency(value: any): string {
    if (value === null || value === undefined || value === '') return '—';
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return num.toLocaleString('vi-VN') + ' đ';
  }

  formatDate(value: any): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  // ===================== STATUS BADGE RESOLVER =====================

  resolveBadge(val: any, row: T, col: TableColumn<T>): BadgeInfo {
    if (val === null || val === undefined || val === '') {
      return { label: '—', variant: 'default' };
    }

    if (col.badgeResolver) {
      return col.badgeResolver(val, row);
    }

    if (typeof val === 'object' && val.label) {
      return {
        label: val.label,
        variant: val.variant || 'default',
        customDotColor: val.customDotColor,
        customBgColor: val.customBgColor,
        customTextColor: val.customTextColor,
      };
    }

    const str = String(val).trim().toLowerCase();

    // 1. Active / Đang hoạt động / Hiển thị
    if (
      [
        'active',
        'đang hoạt động',
        'hoạt động',
        'hiển thị',
        'kích hoạt',
        'sẵn sàng',
        'đã duyệt',
        'bình thường',
        'áp dụng',
      ].includes(str)
    ) {
      return { label: String(val), variant: 'active' };
    }

    // 2. Inactive / Đã ẩn / Ngừng hoạt động
    if (
      [
        'inactive',
        'đã ẩn',
        'ẩn',
        'ngừng hoạt động',
        'tạm ngưng',
        'vô hiệu hóa',
        'vô hiệu',
        'đã khóa',
        'khóa',
        'hết hạn',
      ].includes(str)
    ) {
      return { label: String(val), variant: 'inactive' };
    }

    // 3. Pending / Chờ xử lý / Đang giao
    if (
      [
        'pending',
        'chờ xử lý',
        'chờ duyệt',
        'đang xử lý',
        'chờ thanh toán',
        'đang giao',
        'khởi tạo',
        'chờ xác nhận',
      ].includes(str)
    ) {
      return { label: String(val), variant: 'pending' };
    }

    // 4. Completed / Đã xử lý / Hoàn thành
    if (
      [
        'completed',
        'đã xử lý',
        'hoàn thành',
        'đã hoàn thành',
        'đã thanh toán',
        'thành công',
        'đã giao',
        'đã nhận',
      ].includes(str)
    ) {
      return { label: String(val), variant: 'completed' };
    }

    // 5. Danger / Cancelled / Đã hủy
    if (
      [
        'cancelled',
        'canceled',
        'đã hủy',
        'hủy',
        'thất bại',
        'từ chối',
        'hết hàng',
        'danger',
        'lỗi',
      ].includes(str)
    ) {
      return { label: String(val), variant: 'danger' };
    }

    // 6. Warning
    if (['warning', 'cảnh báo', 'sắp hết hạn', 'hạn chế'].includes(str)) {
      return { label: String(val), variant: 'warning' };
    }

    return { label: String(val), variant: 'default' };
  }

  trackByRow(index: number, row: any): any {
    return row && row[this.rowKey] !== undefined ? row[this.rowKey] : index;
  }

  getBadge(row: T, col: TableColumn<T>): BadgeInfo {
    return this.resolveBadge(this.getCellValue(row, col.key), row, col);
  }

  // ===================== ACTIONS =====================

  getRowActions(col: TableColumn<T>): TableAction<T>[] {
    if (col.actions && col.actions.length > 0) {
      return col.actions;
    }
    if (this.actions && this.actions.length > 0) {
      return this.actions;
    }
    return this.defaultRowActions;
  }

  isActionVisible(action: TableAction<T>, row: T): boolean {
    return action.show ? action.show(row) : true;
  }

  isActionDisabled(action: TableAction<T>, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  onActionClick(action: TableAction<T>, row: T, index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.isActionDisabled(action, row)) return;

    this.actionClick.emit({
      action: action.id,
      row,
      index,
    });
  }

  // ===================== SORTING =====================

  onHeaderClick(col: TableColumn<T>): void {
    if (!col.sortable) return;

    let nextDirection: 'asc' | 'desc' | null = 'asc';
    if (this.currentSort.key === col.key) {
      if (this.currentSort.direction === 'asc') {
        nextDirection = 'desc';
      } else if (this.currentSort.direction === 'desc') {
        nextDirection = null;
      }
    }

    this.currentSort = {
      key: nextDirection ? col.key : '',
      direction: nextDirection,
    };

    this.sortChange.emit(this.currentSort);
  }

  // ===================== ROW CLICK & SELECTION =====================

  onRowClick(row: T, index: number): void {
    this.rowClick.emit({ row, index });
  }

  isRowSelected(row: T): boolean {
    const key = (row as any)[this.rowKey];
    return this.selectedRows.some((r: any) => r[this.rowKey] === key);
  }

  toggleRowSelection(row: T, event: Event): void {
    event.stopPropagation();
    const key = (row as any)[this.rowKey];
    const exists = this.selectedRows.some((r: any) => r[this.rowKey] === key);

    if (exists) {
      this.selectedRows = this.selectedRows.filter((r: any) => r[this.rowKey] !== key);
    } else {
      this.selectedRows = [...this.selectedRows, row];
    }

    this.selectionChange.emit(this.selectedRows);
  }

  get isAllSelected(): boolean {
    if (!this.data || this.data.length === 0) return false;
    return this.data.every((row: any) =>
      this.selectedRows.some((r: any) => r[this.rowKey] === row[this.rowKey])
    );
  }

  get isPartiallySelected(): boolean {
    if (!this.data || this.data.length === 0) return false;
    const selectedCount = this.data.filter((row: any) =>
      this.selectedRows.some((r: any) => r[this.rowKey] === row[this.rowKey])
    ).length;
    return selectedCount > 0 && selectedCount < this.data.length;
  }

  toggleSelectAll(event: Event): void {
    event.stopPropagation();
    if (this.isAllSelected) {
      // Unselect rows on current view
      const currentKeys = new Set(this.data.map((r: any) => r[this.rowKey]));
      this.selectedRows = this.selectedRows.filter(
        (r: any) => !currentKeys.has(r[this.rowKey])
      );
    } else {
      // Add all current data rows to selected
      const currentKeys = new Set(this.selectedRows.map((r: any) => r[this.rowKey]));
      const newItems = this.data.filter((r: any) => !currentKeys.has(r[this.rowKey]));
      this.selectedRows = [...this.selectedRows, ...newItems];
    }
    this.selectionChange.emit(this.selectedRows);
  }

  // ===================== IMAGE ERROR HANDLING =====================

  onImageError(src: string): void {
    if (src) {
      this.failedImages.add(src);
    }
  }

  isImageFailed(src: string): boolean {
    return !src || this.failedImages.has(src);
  }
}
