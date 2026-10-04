import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-modal',
  imports: [CommonModule],
  templateUrl: './form-modal.html',
  styleUrl: './form-modal.css',
})
export class FormModal {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() submitText: string = 'Lưu';
  @Input() cancelText: string = 'Hủy bỏ';
  @Input() isSubmitting: boolean = false;
  @Input() showFooter: boolean = true;

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (!this.isSubmitting) {
      this.submit.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
}
