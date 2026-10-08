import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { FormModal } from '../../shared/form-modal/form-modal';
import { Room as RoomRecord } from '../room/room.model';
import { RoomService } from '../room/room.service';
import { EligibleProductService } from './eligible-product.service';
import { InspirationDraft, InspirationRecord, InspirationStatusFilter } from './inspiration.model';
import { InspirationService } from './inspiration.service';

type Mode = 'create' | 'edit' | 'view';

@Component({ selector: 'app-inspiration', standalone: true, imports: [CommonModule, FormsModule, FormModal, ConfirmDialog], templateUrl: './inspiration.html' })
export class Inspiration {
  private readonly service = inject(InspirationService);
  private readonly roomService = inject(RoomService);
  readonly products = inject(EligibleProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly pageSize = 5;
  readonly items = signal<InspirationRecord[]>([]);
  readonly rooms = signal<RoomRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly pageNumbers = signal<number[]>([1]);
  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly imageError = signal('');
  readonly notice = signal('');
  readonly pending = signal<InspirationRecord | null>(null);
  search = '';
  roomFilter = '';
  status: InspirationStatusFilter = 'all';
  mode: Mode = 'create';
  editing: InspirationRecord | null = null;
  form: InspirationDraft = this.blank();

  constructor() {
    this.roomService.listRooms({ search: '', status: 'all', page: 1, pageSize: 100 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (result) => this.rooms.set(result.items), error: () => this.error.set('Không tải được danh sách phòng.') });
    this.load();
  }
  blank(): InspirationDraft { return { code: '', title: '', roomId: '', style: '', content: '', thumbnail: '', taggedProducts: [], status: 'published' }; }
  load(): void {
    this.loading.set(true); this.error.set('');
    this.service.list({ search: this.search, roomId: this.roomFilter, status: this.status, page: this.page(), pageSize: this.pageSize }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => { this.items.set(result.items); this.total.set(result.total); this.page.set(result.page); this.pages.set(result.pages); this.pageNumbers.set(Array.from({length: result.pages}, (_, i) => i + 1)); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('Không tải được danh sách cảm hứng.'); },
    });
  }
  apply(): void { this.page.set(1); this.load(); }
  reset(): void { this.search = ''; this.roomFilter = ''; this.status = 'all'; this.apply(); }
  changePage(page: number): void { if (page >= 1 && page <= this.pages()) { this.page.set(page); this.load(); } }
  roomName(id: string): string { return this.rooms().find((room) => room.id === id)?.name ?? 'Phòng không còn tồn tại'; }
  availableProducts() { return this.products.forRoom(this.form.roomId); }
  openCreate(): void { this.mode = 'create'; this.editing = null; this.form = this.blank(); this.formError.set(''); this.imageError.set(''); this.modalOpen.set(true); }
  open(item: InspirationRecord, mode: Mode): void { this.mode = mode; this.editing = item; this.form = { code: item.code, title: item.title, roomId: item.roomId, style: item.style, content: item.content, thumbnail: item.thumbnail, taggedProducts: item.taggedProducts.map((pin) => ({ ...pin })), status: item.status }; this.formError.set(''); this.imageError.set(''); this.modalOpen.set(true); }
  close(): void { if (this.saving()) return; this.modalOpen.set(false); }
  addPin(x = 50, y = 50): void { if (this.mode !== 'view') { this.form = { ...this.form, taggedProducts: [...this.form.taggedProducts, { productId: '', xPercent: x, yPercent: y, note: '' }] }; this.formError.set(''); this.cdr.markForCheck(); } }
  removePin(index: number): void { this.form = { ...this.form, taggedProducts: this.form.taggedProducts.filter((_, position) => position !== index) }; this.cdr.markForCheck(); }
  pinFromImage(event: MouseEvent): void { if (this.mode === 'view' || !this.form.thumbnail) return; const rect = (event.currentTarget as HTMLElement).getBoundingClientRect(); this.addPin(Math.round((event.clientX - rect.left) / rect.width * 1000) / 10, Math.round((event.clientY - rect.top) / rect.height * 1000) / 10); }
  imageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { this.imageError.set('Chọn ảnh JPG, PNG hoặc WEBP không quá 10 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { this.form.thumbnail = String(reader.result); this.imageError.set(''); this.formError.set(''); this.cdr.markForCheck(); };
    reader.onerror = () => { this.imageError.set('Không đọc được ảnh. Hãy chọn lại.'); this.cdr.markForCheck(); };
    reader.readAsDataURL(file);
  }
  save(form: NgForm): void {
    if (this.mode === 'view' || this.saving()) return;
    form.control.markAllAsTouched();
    if (form.invalid || !this.form.thumbnail) { this.formError.set('Nhập đầy đủ mã, tiêu đề, phòng, mô tả và ảnh phối cảnh.'); return; }
    this.saving.set(true); this.formError.set('');
    this.service.save(this.form, this.editing?.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving.set(false); this.modalOpen.set(false); this.notice.set(this.editing ? 'Đã lưu thay đổi cảm hứng.' : 'Đã thêm cảm hứng.'); this.load(); },
      error: (error: Error) => { this.saving.set(false); this.formError.set(error.message); },
    });
  }
  requestStatus(item: InspirationRecord): void { this.pending.set(item); }
  cancelStatus(): void { this.pending.set(null); }
  confirmStatus(): void { const item = this.pending(); if (!item) return; this.service.setStatus(item.id, item.status === 'published' ? 'hidden' : 'published').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.pending.set(null); this.notice.set('Đã cập nhật trạng thái cảm hứng.'); this.load(); }, error: (error: Error) => { this.pending.set(null); this.notice.set(error.message); } }); }
}
