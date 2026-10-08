import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, defer, delay, firstValueFrom, from, map, Observable } from 'rxjs';
import { RoomService } from '../room/room.service';
import { RoomUsageService } from '../room/room-usage.service';
import { EligibleProductService } from './eligible-product.service';
import { InspirationDraft, InspirationPage, InspirationQuery, InspirationRecord } from './inspiration.model';

const initial: InspirationRecord[] = [
  { id: 'ins-1', code: 'INS-LIV-01', title: 'Atelier Curated', roomId: 'room-liv-01', style: 'Scandinavian', content: 'Cảm hứng Scandinavian', thumbnail: '/images/rooms/living-room.png', taggedProducts: [{ productId: 'p-sofa', xPercent: 32, yPercent: 62, note: 'Góc sofa' }, { productId: 'p-table', xPercent: 58, yPercent: 72, note: 'Bàn trà' }], status: 'published', version: '2.4' },
  { id: 'ins-2', code: 'INS-BED-04', title: 'Quiet Luxury', roomId: 'room-bed-02', style: 'Quiet Luxury', content: 'Phòng cách Quiet Luxury', thumbnail: '/images/rooms/bedroom.png', taggedProducts: [{ productId: 'p-bed', xPercent: 45, yPercent: 68, note: 'Giường ngủ' }], status: 'published', version: '1.8' },
  { id: 'ins-3', code: 'INS-DIN-02', title: 'Warm Craft', roomId: 'room-din-03', style: 'Warm Craft', content: 'Bàn ăn ốc chó nguyên bản', thumbnail: '/images/rooms/dining-room.png', taggedProducts: [{ productId: 'p-dining', xPercent: 53, yPercent: 62, note: '' }], status: 'published', version: '3.1' },
  { id: 'ins-4', code: 'INS-WRK-07', title: 'Studio Minimal', roomId: 'room-wrk-04', style: 'Minimal', content: 'Không gian làm việc đậm cá tính', thumbnail: '/images/rooms/living-room.png', taggedProducts: [{ productId: 'p-desk', xPercent: 50, yPercent: 65, note: '' }], status: 'hidden', version: '1.0' },
  { id: 'ins-5', code: 'INS-OUT-03', title: 'Sunset Breeze', roomId: 'room-out-05', style: 'Outdoor', content: 'Không gian ngoài trời thư giãn', thumbnail: '/images/rooms/kitchen.png', taggedProducts: [{ productId: 'p-sofa', xPercent: 40, yPercent: 61, note: '' }], status: 'published', version: '2.0' },
  { id: 'ins-6', code: 'INS-LIV-06', title: 'Modern Calm', roomId: 'room-liv-01', style: 'Modern', content: 'Tông màu ấm tối giản', thumbnail: '/images/rooms/living-room.png', taggedProducts: [], status: 'hidden', version: '1.0' },
];

@Injectable({ providedIn: 'root' })
export class InspirationService {
  private readonly rooms = inject(RoomService);
  private readonly products = inject(EligibleProductService);
  private readonly usage = inject(RoomUsageService);
  private readonly records = new BehaviorSubject<InspirationRecord[]>(initial);
  private nextId = 7;

  list(query: InspirationQuery): Observable<InspirationPage> {
    return this.records.pipe(map((records) => {
      const search = query.search.trim().toLocaleLowerCase();
      const found = records.filter((item) =>
        (!search || `${item.code} ${item.title} ${item.style} ${item.content}`.toLocaleLowerCase().includes(search))
        && (!query.roomId || item.roomId === query.roomId)
        && (query.status === 'all' || item.status === query.status));
      const pages = Math.max(1, Math.ceil(found.length / Math.max(1, query.pageSize)));
      const page = Math.min(Math.max(1, query.page), pages);
      return { items: found.slice((page - 1) * query.pageSize, page * query.pageSize), total: found.length, page, pages };
    }), delay(120));
  }

  save(draft: InspirationDraft, id?: string): Observable<InspirationRecord> {
    return defer(() => from(this.validateAndSave(draft, id))).pipe(delay(120));
  }

  setStatus(id: string, status: InspirationRecord['status']): Observable<InspirationRecord> {
    return defer(() => {
      const item = this.records.value.find((record) => record.id === id);
      if (!item) throw new Error('Không tìm thấy cảm hứng.');
      if (status === 'hidden' && item.id === 'ins-1') throw new Error('Cảm hứng đang được tham chiếu nên không thể ẩn.');
      const updated = { ...item, status };
      this.records.next(this.records.value.map((record) => record.id === id ? updated : record));
      return from(Promise.resolve(updated));
    }).pipe(delay(120));
  }

  private async validateAndSave(draft: InspirationDraft, id?: string): Promise<InspirationRecord> {
    const code = draft.code.trim().toUpperCase();
    if (!/^INS-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code)) throw new Error('Mã cảm hứng phải có dạng INS-XXX.');
    if (this.records.value.some((item) => item.id !== id && item.code === code)) throw new Error('Mã cảm hứng đã tồn tại.');
    if (!draft.title.trim() || !draft.content.trim() || !draft.thumbnail) throw new Error('Nhập tiêu đề, mô tả và ảnh phối cảnh.');
    const room = (await firstValueFrom(this.rooms.listRooms({ search: '', status: 'all', page: 1, pageSize: 100 }))).items.find((item) => item.id === draft.roomId);
    if (!room?.isActive) throw new Error('Phòng không tồn tại hoặc đã ngừng hoạt động.');
    for (const pin of draft.taggedProducts) {
      const product = this.products.find(pin.productId);
      if (!product?.saleable || !product.roomIds.includes(draft.roomId)) throw new Error('Sản phẩm ghim không còn được kinh doanh hoặc không thuộc phòng đã chọn.');
      if (!Number.isFinite(pin.xPercent) || !Number.isFinite(pin.yPercent) || pin.xPercent < 0 || pin.xPercent > 100 || pin.yPercent < 0 || pin.yPercent > 100) throw new Error('Tọa độ điểm ghim phải từ 0 đến 100%.');
    }
    const existing = this.records.value.find((item) => item.id === id);
    if (id && !existing) throw new Error('Không tìm thấy cảm hứng.');
    if (existing?.status === 'published' && draft.status === 'hidden' && id === 'ins-1') throw new Error('Cảm hứng đang được tham chiếu nên không thể ẩn.');
    const record: InspirationRecord = { ...draft, code, title: draft.title.trim(), content: draft.content.trim(), id: id ?? `ins-${this.nextId++}`, version: existing?.version ?? '1.0' };
    this.records.next(id ? this.records.value.map((item) => item.id === id ? record : item) : [...this.records.value, record]);
    this.usage.record(`inspiration:${record.id}`, record.roomId, `Inspiration ${record.code}`);
    return record;
  }
}
