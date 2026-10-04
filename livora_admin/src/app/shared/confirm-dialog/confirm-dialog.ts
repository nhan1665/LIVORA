import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ConfirmDialogType = 'warning' | 'danger' | 'info';

@Component({
  selector: 'app-confirm-dialog',
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Xác nhận hành động';
  @Input() message: string = 'Bạn có chắc chắn muốn thực hiện thao tác này không?';
  @Input() confirmText: string = 'Xác nhận';
  @Input() cancelText: string = 'Hủy bỏ';
  @Input() type: ConfirmDialogType = 'warning';
  @Input() isConfirming: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    if (!this.isConfirming) {
      this.confirm.emit();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('confirm-backdrop')) {
      this.onCancel();
    }
  }
}
