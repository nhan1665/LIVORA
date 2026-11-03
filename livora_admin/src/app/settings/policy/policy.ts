import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolicyService, CompanyPolicy } from './policy.service';

@Component({
  selector: 'app-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './policy.html',
  styleUrl: './policy.css'
})
export class Policy implements OnInit {
  private policyService = inject(PolicyService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  readingFile = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  currentPolicy = signal<CompanyPolicy | null>(null);

  // File được chọn mới
  selectedFile: File | null = null;
  newFileName: string = '';
  newFileType: string = '';
  newFileSize: string = '';
  newFileData: string = '';

  ngOnInit(): void {
    this.loadPolicy();
  }

  loadPolicy(): void {
    this.loading.set(true);
    this.policyService.getPolicy().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.currentPolicy.set(res.data);
        }
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải chính sách:', err);
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Giới hạn 20MB
      if (file.size > 20 * 1024 * 1024) {
        this.errorMessage.set('Kích thước file không được vượt quá 20MB.');
        input.value = '';
        return;
      }

      this.selectedFile = file;
      this.newFileName = file.name;
      this.newFileType = file.type || 'application/octet-stream';
      this.newFileSize = this.formatBytes(file.size);
      this.readingFile.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newFileData = e.target.result;
        this.readingFile.set(false);
        this.cdr.detectChanges();
      };
      reader.onerror = () => {
        this.readingFile.set(false);
        this.errorMessage.set('Không thể đọc file đã chọn. Vui lòng thử lại!');
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.newFileName = '';
    this.newFileType = '';
    this.newFileSize = '';
    this.newFileData = '';
  }

  savePolicyFile(): void {
    if (!this.newFileData && !this.selectedFile) {
      this.errorMessage.set('Vui lòng chọn một file chính sách để tải lên.');
      return;
    }

    if (this.readingFile()) {
      this.errorMessage.set('Hệ thống đang nạp file, vui lòng đợi giây lát rồi bấm lưu lại!');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload: Partial<CompanyPolicy> = {
      title: 'Chính sách Bán hàng & Hoàn tiền LIVORA',
      fileName: this.newFileName,
      fileType: this.newFileType,
      fileSize: this.newFileSize,
      fileData: this.newFileData,
      updatedBy: 'Admin'
    };

    this.policyService.updatePolicy(payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res && res.data) {
          this.currentPolicy.set(res.data);
        }
        this.selectedFile = null;
        this.newFileData = '';
        this.newFileName = '';
        this.successMessage.set('Đã tải lên và lưu file chính sách thành công!');
        setTimeout(() => this.successMessage.set(''), 4000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving.set(false);
        console.error('Lỗi khi lưu file chính sách:', err);
        this.errorMessage.set('Lỗi khi lưu file chính sách. Vui lòng thử lại!');
        this.cdr.detectChanges();
      }
    });
  }

  openCurrentFile(): void {
    const policy = this.currentPolicy();
    const url = policy?.fileData || (policy?.fileUrl ? `http://localhost:5000${policy.fileUrl}` : '');
    if (url) {
      window.open(url, '_blank');
    }
  }
}
