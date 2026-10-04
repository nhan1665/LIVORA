import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterSelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-filter-bar',
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.css',
})
export class FilterBar {
  // Search configuration
  @Input() showSearch: boolean = true;
  @Input() searchLabel: string = 'TỪ KHÓA';
  @Input() searchPlaceholder: string = 'Nhập từ khóa tìm kiếm...';
  @Input() searchValue: string = '';

  // Status dropdown configuration
  @Input() showStatus: boolean = true;
  @Input() statusLabel: string = 'TRẠNG THÁI';
  @Input() statusValue: string = 'all';
  @Input() statusOptions: FilterSelectOption[] = [
    { label: 'Tất cả trạng thái', value: 'all' },
    { label: 'Đang hoạt động', value: 'Đang hoạt động' },
    { label: 'Đã ẩn', value: 'Đã ẩn' },
  ];

  // Action buttons configuration
  @Input() filterButtonText: string = 'Lọc';
  @Input() showResetButton: boolean = true;

  // Outputs
  @Output() searchValueChange = new EventEmitter<string>();
  @Output() statusValueChange = new EventEmitter<string>();
  @Output() filter = new EventEmitter<{ search: string; status: string }>();
  @Output() reset = new EventEmitter<void>();

  onSearchInput(val: string): void {
    this.searchValue = val;
    this.searchValueChange.emit(val);
  }

  onStatusSelect(val: string): void {
    this.statusValue = val;
    this.statusValueChange.emit(val);
    this.onApplyFilter();
  }

  onApplyFilter(): void {
    this.filter.emit({
      search: this.searchValue,
      status: this.statusValue,
    });
  }

  onReset(): void {
    this.searchValue = '';
    this.statusValue = 'all';
    this.searchValueChange.emit('');
    this.statusValueChange.emit('all');
    this.reset.emit();
    this.filter.emit({ search: '', status: 'all' });
  }
}
