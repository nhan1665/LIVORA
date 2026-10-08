import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { FormModal } from '../../shared/form-modal/form-modal';
import { Room as RoomRecord } from '../room/room.model';
import { RoomService } from '../room/room.service';
import { DesignRecord, SpaceDraft, SpaceRecord } from './space.model';
import { DesignService, SpaceService } from './space.service';

type Tab = 'spaces' | 'designs';
type Mode = 'create' | 'edit' | 'view';
@Component({ selector: 'app-space', standalone: true, imports: [CommonModule, FormsModule, FormModal, ConfirmDialog], templateUrl: './space.html' })
export class Space {
  private readonly service = inject(SpaceService);
  private readonly designsService = inject(DesignService);
  private readonly roomsService = inject(RoomService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly rooms = signal<RoomRecord[]>([]);
  readonly spaces = signal<SpaceRecord[]>([]);
  readonly designs = signal<DesignRecord[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly pageNumbers = signal<number[]>([1]);
  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly fileError = signal('');
  readonly pending = signal<SpaceRecord | null>(null);
  readonly selectedDesign = signal<DesignRecord | null>(null);
  readonly spaceCount = signal(0);
  readonly designCount = signal(0);
  tab: Tab = 'spaces';
  mode: Mode = 'create';
  editing: SpaceRecord | null = null;
  search = '';
  roomFilter = '';
  status: 'all' | 'active' | 'inactive' = 'all';
  spaceFilter = '';
  customerFilter = '';
  form: SpaceDraft = this.blank();
  readonly pageSize = 6;

  constructor() {
    this.roomsService.listRooms({search: '', status: 'all', page: 1, pageSize: 100}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next: (result) => this.rooms.set(result.items), error: () => this.error.set('Không tải được danh sách phòng.')});
    this.service.list('', '', 'all', 1, 100).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => this.spaceCount.set(result.total));
    this.designsService.list('', '', '', 1, 100).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => this.designCount.set(result.total));
    this.load();
  }
  blank(): SpaceDraft { return {code: '', name: '', roomId: '', description: '', lengthM: 0, widthM: 0, heightM: 0, modelFile: null, isActive: true}; }
  selectTab(tab: Tab): void { this.tab = tab; this.notice.set(''); this.search = ''; this.roomFilter = ''; this.status = 'all'; this.spaceFilter = ''; this.customerFilter = ''; this.page.set(1); this.load(); }
  load(): void {
    this.loading.set(true); this.error.set('');
    if (this.tab === 'spaces') this.service.list(this.search, this.roomFilter, this.status, this.page(), this.pageSize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next: (result) => { this.spaces.set(result.items); this.finishLoad(result.total, result.page, result.pages); }, error: () => this.failLoad('Không tải được danh sách không gian.')});
    else this.designsService.list(this.search, this.spaceFilter, this.customerFilter, this.page(), 10).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next: (result) => { this.designs.set(result.items); this.finishLoad(result.total, result.page, result.pages); }, error: () => this.failLoad('Không tải được danh sách thiết kế.')});
  }
  private finishLoad(total: number, page: number, pages: number): void { this.total.set(total); this.page.set(page); this.pages.set(pages); this.pageNumbers.set(Array.from({length: pages}, (_, i) => i + 1)); this.loading.set(false); }
  private failLoad(message: string): void { this.loading.set(false); this.error.set(message); }
  apply(): void { this.page.set(1); this.load(); }
  reset(): void { this.search = ''; this.roomFilter = ''; this.status = 'all'; this.spaceFilter = ''; this.customerFilter = ''; this.apply(); }
  changePage(page: number): void { if (page >= 1 && page <= this.pages()) { this.page.set(page); this.load(); } }
  roomName(id: string): string { return this.rooms().find((room) => room.id === id)?.name ?? (this.rooms().length ? 'Phòng không còn tồn tại' : 'Đang tải phòng…'); }
  roomImage(id: string): string { return this.rooms().find((room) => room.id === id)?.thumbnail ?? ''; }
  spaceName(id: string): string { return this.service.get(id)?.name ?? 'Không gian không còn tồn tại'; }
  spaceCode(id: string): string { return this.service.get(id)?.code ?? '—'; }
  spacesForFilter(): SpaceRecord[] { return this.spaceFilter ? [this.service.get(this.spaceFilter)].filter((item): item is SpaceRecord => !!item) : this.allSpaceOptions(); }
  allSpaceOptions(): SpaceRecord[] { return ['space-liv-1','space-liv-2','space-bed-1','space-din-1','space-wrk-1','space-out-1','space-liv-3'].map((id) => this.service.get(id)).filter((item): item is SpaceRecord => !!item); }
  customers() { return this.designsService.customers(); }
  area(item: SpaceRecord | SpaceDraft): string { return (item.lengthM * item.widthM).toFixed(1); }
  volume(): string { return (this.form.lengthM * this.form.widthM * this.form.heightM).toFixed(1); }
  selectedFileSize(): string { const bytes = this.form.modelFile?.size ?? 0; return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
  openCreate(): void { this.mode = 'create'; this.editing = null; this.form = this.blank(); this.formError.set(''); this.fileError.set(''); this.modalOpen.set(true); }
  open(item: SpaceRecord, mode: Mode): void { this.mode = mode; this.editing = item; this.form = {code: item.code, name: item.name, roomId: item.roomId, description: item.description, lengthM: item.lengthM, widthM: item.widthM, heightM: item.heightM, modelFile: item.modelFile ? {...item.modelFile} : null, isActive: item.isActive}; this.formError.set(''); this.fileError.set(''); this.modalOpen.set(true); }
  close(): void { if (!this.saving()) this.modalOpen.set(false); }
  async selectFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith('.glb') || file.size < 20 || file.size > 50 * 1024 * 1024) { this.fileError.set('Chọn file .glb từ 20 byte đến 50 MB.'); this.form.modelFile = null; return; }
    try {
      const header = new DataView(await file.slice(0, 12).arrayBuffer());
      if (header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2 || header.getUint32(8, true) !== file.size) throw new Error('invalid header');
      this.form.modelFile = { name: file.name, size: file.size };
      this.fileError.set(''); this.formError.set('');
    } catch {
      this.form.modelFile = null;
      this.fileError.set('File phải có header GLB phiên bản 2 hợp lệ.');
    }
    this.cdr.markForCheck();
  }
  save(form: NgForm): void {
    if (this.mode === 'view' || this.saving()) return;
    form.control.markAllAsTouched();
    if (form.invalid || !this.form.modelFile) { this.formError.set('Nhập mã, tên, phòng, kích thước hợp lệ và file .glb.'); return; }
    this.saving.set(true); this.formError.set('');
    this.service.save(this.form, this.editing?.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next: () => { this.saving.set(false); this.modalOpen.set(false); this.notice.set(this.editing ? 'Đã cập nhật không gian.' : 'Đã thêm không gian.'); this.spaceCount.update((count) => this.editing ? count : count + 1); this.load(); }, error: (error: Error) => { this.saving.set(false); this.formError.set(error.message); }});
  }
  requestStatus(item: SpaceRecord): void { this.pending.set(item); }
  cancelStatus(): void { this.pending.set(null); }
  confirmStatus(): void { const item = this.pending(); if (!item) return; this.service.setActive(item.id, !item.isActive).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next: () => { this.pending.set(null); this.notice.set('Đã cập nhật trạng thái không gian.'); this.load(); }, error: (error: Error) => { this.pending.set(null); this.notice.set(error.message); }}); }
  viewDesign(item: DesignRecord): void { this.selectedDesign.set(item); }
}
