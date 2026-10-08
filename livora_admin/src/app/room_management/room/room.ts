import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { FormModal } from '../../shared/form-modal/form-modal';
import { RoomService } from './room.service';
import {
  Room as RoomRecord,
  RoomConflictError,
  RoomDraft,
  RoomInUseError,
  RoomListResponse,
  RoomStatusFilter,
} from './room.model';

type RoomModalMode = 'create' | 'edit' | 'view';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, FormsModule, FormModal, ConfirmDialog],
  templateUrl: './room.html',
})
export class Room {
  private readonly roomService = inject(RoomService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  readonly pageSize = 7;

  readonly rooms = signal<RoomRecord[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);
  readonly isModalOpen = signal(false);
  readonly isSubmitting = signal(false);
  readonly formError = signal('');
  readonly imageError = signal('');
  readonly pendingStatusRoom = signal<RoomRecord | null>(null);
  readonly isStatusChanging = signal(false);
  readonly statusError = signal('');
  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');

  searchDraft = '';
  statusDraft: RoomStatusFilter = 'all';
  modalMode: RoomModalMode = 'create';
  editingRoom: RoomRecord | null = null;
  form: RoomDraft = this.emptyDraft();
  hasUnsavedChanges = false;

  constructor() {
    this.loadRooms();
  }

  loadRooms(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.roomService.listRooms({
      search: this.searchDraft,
      status: this.statusDraft,
      page: this.currentPage(),
      pageSize: this.pageSize,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: RoomListResponse) => {
        this.rooms.set(response.items);
        this.currentPage.set(response.page);
        this.totalItems.set(response.totalItems);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Không thể tải danh sách phòng. Vui lòng thử lại.');
      },
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadRooms();
  }

  resetFilters(): void {
    this.searchDraft = '';
    this.statusDraft = 'all';
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadRooms();
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingRoom = null;
    this.form = this.emptyDraft();
    this.formError.set('');
    this.imageError.set('');
    this.hasUnsavedChanges = false;
    this.isModalOpen.set(true);
  }

  openEditModal(room: RoomRecord): void {
    this.modalMode = 'edit';
    this.editingRoom = room;
    this.form = {
      code: room.code,
      name: room.name,
      description: room.description,
      thumbnail: room.thumbnail,
      isActive: room.isActive,
    };
    this.formError.set('');
    this.imageError.set('');
    this.hasUnsavedChanges = false;
    this.isModalOpen.set(true);
  }

  openViewModal(room: RoomRecord): void {
    this.modalMode = 'view';
    this.editingRoom = room;
    this.form = {
      code: room.code,
      name: room.name,
      description: room.description,
      thumbnail: room.thumbnail,
      isActive: room.isActive,
    };
    this.formError.set('');
    this.imageError.set('');
    this.hasUnsavedChanges = false;
    this.isModalOpen.set(true);
  }

  modalTitle(): string {
    if (this.modalMode === 'view') return 'Thông tin phòng';
    return this.modalMode === 'create' ? 'Thêm mới phòng' : 'Chỉnh sửa phòng';
  }

  requestCloseModal(): void {
    if (this.isSubmitting()) return;
    if (this.hasUnsavedChanges && !window.confirm('Bỏ các thay đổi chưa lưu?')) return;
    this.isModalOpen.set(false);
  }

  normalizeCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    const normalized = input.value.toUpperCase().replace(/\s+/g, '');
    this.form.code = normalized;
    input.value = normalized;
    this.hasUnsavedChanges = true;
  }

  markChanged(): void {
    this.hasUnsavedChanges = true;
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.imageError.set('');
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.imageError.set('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.imageError.set('Dung lượng ảnh tối đa là 10 MB.');
      input.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const dimensions = await this.readImageDimensions(objectUrl);
      const ratio = dimensions.width / dimensions.height;
      if (dimensions.width < 1920 || dimensions.height < 1080 || Math.abs(ratio - 16 / 9) > 0.03) {
        this.imageError.set('Ảnh cần tối thiểu 1920×1080 px và có tỷ lệ 16:9.');
        input.value = '';
        return;
      }
      this.form.thumbnail = await this.readFileAsDataUrl(file);
      this.hasUnsavedChanges = true;
      this.changeDetectorRef.markForCheck();
    } catch {
      this.imageError.set('Không thể đọc ảnh này. Vui lòng chọn tệp khác.');
      input.value = '';
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  removeSelectedImage(): void {
    this.form.thumbnail = '';
    this.imageError.set('');
    this.hasUnsavedChanges = true;
  }

  saveRoom(formRef: NgForm): void {
    if (this.modalMode === 'view') return;
    this.formError.set('');
    if (formRef.invalid || !this.isCodeValid(this.form.code) || !this.form.thumbnail) {
      formRef.control.markAllAsTouched();
      if (!this.form.thumbnail) this.imageError.set('Vui lòng chọn ảnh đại diện cho phòng.');
      return;
    }

    this.isSubmitting.set(true);
    const request = this.modalMode === 'create'
      ? this.roomService.createRoom(this.form)
      : this.roomService.updateRoom(this.editingRoom!.id, this.form);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isModalOpen.set(false);
        this.hasUnsavedChanges = false;
        this.showToast(this.modalMode === 'create' ? 'Đã thêm phòng mới.' : 'Đã cập nhật thông tin phòng.', 'success');
        this.currentPage.set(1);
        this.loadRooms();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        if (error instanceof RoomConflictError) {
          this.formError.set(error.message);
        } else if (error instanceof RoomInUseError) {
          this.formError.set(`Không thể ngừng hoạt động: phòng vẫn được tham chiếu bởi ${error.references.join(' và ')}.`);
        } else {
          this.formError.set('Không thể lưu phòng. Vui lòng thử lại.');
        }
      },
    });
  }

  isCodeValid(code: string): boolean {
    return /^RM-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code.trim());
  }

  requestStatusChange(room: RoomRecord): void {
    this.statusError.set('');
    if (!room.isActive) {
      this.updateRoomStatus(room, true);
      return;
    }
    this.pendingStatusRoom.set(room);
  }

  confirmStatusChange(): void {
    const room = this.pendingStatusRoom();
    if (!room || this.isStatusChanging()) return;
    this.isStatusChanging.set(true);
    this.statusError.set('');
    this.roomService.setRoomActive(room.id, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isStatusChanging.set(false);
          this.pendingStatusRoom.set(null);
          this.showToast('Trạng thái phòng đã được cập nhật.', 'success');
          this.loadRooms();
        },
        error: (error: unknown) => {
          this.isStatusChanging.set(false);
          if (error instanceof RoomInUseError) {
            this.statusError.set(`Không thể ngừng hoạt động: phòng vẫn được tham chiếu bởi ${error.references.join(' và ')}.`);
          } else {
            this.statusError.set('Không thể cập nhật trạng thái phòng. Vui lòng thử lại.');
          }
        },
      });
  }

  cancelStatusChange(): void {
    if (this.isStatusChanging()) return;
    this.pendingStatusRoom.set(null);
    this.statusError.set('');
  }

  retryLoad(): void {
    this.loadRooms();
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, index) => index + 1);
  }

  statusText(isActive: boolean): string {
    return isActive ? 'Hoạt động' : 'Ngừng hoạt động';
  }

  private updateRoomStatus(room: RoomRecord, isActive: boolean): void {
    this.roomService.setRoomActive(room.id, isActive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showToast('Trạng thái phòng đã được cập nhật.', 'success');
          this.loadRooms();
        },
        error: () => this.showToast('Không thể cập nhật trạng thái phòng.', 'error'),
      });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    window.setTimeout(() => this.toastMessage.set(''), 3200);
  }

  private emptyDraft(): RoomDraft {
    return { code: '', name: '', description: '', thumbnail: '', isActive: true };
  }

  private readImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = reject;
      image.src = url;
    });
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject();
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
