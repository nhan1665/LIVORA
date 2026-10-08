import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, defer, delay, firstValueFrom, from, map, Observable } from 'rxjs';
import { RoomService } from '../room/room.service';
import { RoomUsageService } from '../room/room-usage.service';
import { CatalogPage, DesignRecord, SpaceDraft, SpaceRecord } from './space.model';

const spaces: SpaceRecord[] = [
  { id: 'space-liv-1', code: 'KG-LIV-01', name: 'Phòng khách Penthouse', roomId: 'room-liv-01', description: 'Không gian sang trọng trên tầng cao', lengthM: 6.5, widthM: 4.2, heightM: 2.8, modelFile: { name: 'penthouse.glb', size: 24 * 1024 * 1024 }, isActive: true, version: '2.4' },
  { id: 'space-liv-2', code: 'KG-LIV-02', name: 'Phòng khách Căn hộ tiêu chuẩn', roomId: 'room-liv-01', description: 'Không gian gia đình phổ thông', lengthM: 4.8, widthM: 3.6, heightM: 2.7, modelFile: { name: 'apartment.glb', size: 18 * 1024 * 1024 }, isActive: true, version: '1.1' },
  { id: 'space-bed-1', code: 'KG-BED-01', name: 'Phòng ngủ Master Atelier', roomId: 'room-bed-02', description: 'Không gian nghỉ ngơi thư giãn', lengthM: 5.4, widthM: 4.5, heightM: 2.8, modelFile: null, isActive: false, version: '1.0' },
  { id: 'space-din-1', code: 'KG-DIN-01', name: 'Phòng ăn & Bếp mở', roomId: 'room-din-03', description: 'Kết nối đảo bếp và bàn tiệc', lengthM: 8, widthM: 5.5, heightM: 3.2, modelFile: { name: 'dining.glb', size: 32 * 1024 * 1024 }, isActive: true, version: '2.0' },
  { id: 'space-wrk-1', code: 'KG-WRK-01', name: 'Phòng làm việc & Đọc sách', roomId: 'room-wrk-04', description: 'Không gian riêng tư tập trung', lengthM: 4.2, widthM: 3.5, heightM: 2.8, modelFile: { name: 'workspace.glb', size: 16 * 1024 * 1024 }, isActive: true, version: '1.2' },
  { id: 'space-out-1', code: 'KG-OUT-01', name: 'Ban công & Sky Lounge', roomId: 'room-out-05', description: 'Khu vực ngoài trời bán dưỡng', lengthM: 5, widthM: 2.5, heightM: 2.6, modelFile: null, isActive: false, version: '0.9' },
  { id: 'space-liv-3', code: 'KG-LIV-03', name: 'Salon Grand', roomId: 'room-liv-01', description: 'Không gian phong cách Japandi', lengthM: 6, widthM: 4, heightM: 2.8, modelFile: { name: 'salon.glb', size: 12 * 1024 * 1024 }, isActive: true, version: '1.0' },
];
const designs: DesignRecord[] = [
  { id: 'design-1', code: 'TK-2610-001', customerCode: 'KH-VIP-018', customerName: 'KTS. Hoàng Nam', name: 'Solitude Wabi-Sabi', spaceId: 'space-liv-1', roomId: 'room-liv-01', productCodes: ['SP-TB-0245', 'SP-SF-0102', 'SP-CH-0089', 'SP-LT-0156'], createdAt: '2026-10-08T09:00:00' },
  { id: 'design-2', code: 'TK-2610-002', customerCode: 'KH-AT-092', customerName: 'Trần Tuấn Kiệt', name: 'Master Penthouse Serene', spaceId: 'space-bed-1', roomId: 'room-bed-02', productCodes: ['SP-BD-0312', 'SP-NS-0144'], createdAt: '2026-10-07T12:00:00' },
  { id: 'design-3', code: 'TK-2609-089', customerCode: 'KH-AT-104', customerName: 'Đặng Thu Thảo', name: 'Japandi Modern Dining', spaceId: 'space-din-1', roomId: 'room-din-03', productCodes: ['SP-DT-0056', 'SP-DC-0112'], createdAt: '2026-09-30T10:00:00' },
  { id: 'design-4', code: 'TK-2609-074', customerCode: 'KH-VIP-005', customerName: 'KTS. Minh Quân', name: 'Creative Loft Studio', spaceId: 'space-wrk-1', roomId: 'room-wrk-04', productCodes: ['SP-DK-0188', 'SP-OC-0091'], createdAt: '2026-09-29T10:00:00' },
  { id: 'design-5', code: 'TK-2609-055', customerCode: 'KH-AT-077', customerName: 'Lê Thanh Hương', name: 'Salon Du Thé Wabi', spaceId: 'space-liv-2', roomId: 'room-liv-01', productCodes: ['SP-TB-0115', 'SP-MD-0078'], createdAt: '2026-09-20T10:00:00' },
  { id: 'design-6', code: 'TK-2609-038', customerCode: 'KH-AT-042', customerName: 'Phạm Hoàng Long', name: 'Living Atelier Noir', spaceId: 'space-liv-1', roomId: 'room-liv-01', productCodes: ['SP-SF-0205', 'SP-TB-0245'], createdAt: '2026-09-19T10:00:00' },
  { id: 'design-7', code: 'TK-2609-021', customerCode: 'KH-VIP-018', customerName: 'KTS. Hoàng Nam', name: 'Minimalist Zen Reading Corner', spaceId: 'space-wrk-1', roomId: 'room-wrk-04', productCodes: ['SP-CH-0089', 'SP-LT-0156'], createdAt: '2026-09-15T10:00:00' },
  { id: 'design-8', code: 'TK-2608-095', customerCode: 'KH-AT-104', customerName: 'Đặng Thu Thảo', name: 'Suite Du Calme', spaceId: 'space-bed-1', roomId: 'room-bed-02', productCodes: ['SP-BD-0312', 'SP-OT-0087'], createdAt: '2026-08-22T10:00:00' },
  { id: 'design-9', code: 'TK-2608-081', customerCode: 'KH-AT-092', customerName: 'Trần Tuấn Kiệt', name: 'Dining Atelier Grand Banquet', spaceId: 'space-din-1', roomId: 'room-din-03', productCodes: ['SP-DT-0056', 'SP-DC-0112'], createdAt: '2026-08-12T10:00:00' },
  { id: 'design-10', code: 'TK-2608-064', customerCode: 'KH-VIP-005', customerName: 'KTS. Minh Quân', name: 'The Sunlit Gallery Living', spaceId: 'space-liv-1', roomId: 'room-liv-01', productCodes: ['SP-SF-0102', 'SP-TB-0245'], createdAt: '2026-08-01T10:00:00' },
  { id: 'design-11', code: 'TK-2607-010', customerCode: 'KH-AT-077', customerName: 'Lê Thanh Hương', name: 'Calm Corner', spaceId: 'space-liv-2', roomId: 'room-liv-01', productCodes: ['SP-LT-0156'], createdAt: '2026-07-10T10:00:00' },
];

@Injectable({ providedIn: 'root' })
export class SpaceService {
  private readonly rooms = inject(RoomService);
  private readonly usage = inject(RoomUsageService);
  private readonly records = new BehaviorSubject<SpaceRecord[]>(spaces);
  private nextId = 8;
  list(search: string, roomId: string, status: 'all' | 'active' | 'inactive', page: number, pageSize: number): Observable<CatalogPage<SpaceRecord>> {
    return this.records.pipe(map((records) => {
      const q = search.trim().toLocaleLowerCase();
      const found = records.filter((item) => (!q || `${item.code} ${item.name} ${item.description}`.toLocaleLowerCase().includes(q)) && (!roomId || item.roomId === roomId) && (status === 'all' || item.isActive === (status === 'active')));
      const pages = Math.max(1, Math.ceil(found.length / Math.max(1, pageSize))); const current = Math.min(Math.max(1, page), pages);
      return { items: found.slice((current - 1) * pageSize, current * pageSize), total: found.length, pages, page: current };
    }), delay(120));
  }
  save(draft: SpaceDraft, id?: string): Observable<SpaceRecord> { return defer(() => from(this.validateAndSave(draft, id))).pipe(delay(120)); }
  setActive(id: string, active: boolean): Observable<SpaceRecord> {
    return defer(() => {
      const current = this.records.value.find((item) => item.id === id); if (!current) throw new Error('Không tìm thấy không gian.');
      if (active && !current.modelFile) throw new Error('Không gian cần mô hình .glb trước khi kích hoạt.');
      const updated = { ...current, isActive: active }; this.records.next(this.records.value.map((item) => item.id === id ? updated : item)); return from(Promise.resolve(updated));
    }).pipe(delay(120));
  }
  get(id: string): SpaceRecord | undefined { return this.records.value.find((item) => item.id === id); }
  private async validateAndSave(draft: SpaceDraft, id?: string): Promise<SpaceRecord> {
    const code = draft.code.trim().toUpperCase();
    if (!/^KG-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code)) throw new Error('Mã không gian phải có dạng KG-XXX.');
    if (this.records.value.some((item) => item.id !== id && item.code === code)) throw new Error('Mã không gian đã tồn tại.');
    if (!draft.name.trim()) throw new Error('Nhập tên không gian.');
    if (![draft.lengthM, draft.widthM, draft.heightM].every((n) => Number.isFinite(n) && n > 0 && n <= 100)) throw new Error('Kích thước phải lớn hơn 0 và không vượt quá 100 m.');
    const room = (await firstValueFrom(this.rooms.listRooms({search: '', status: 'all', page: 1, pageSize: 100}))).items.find((item) => item.id === draft.roomId);
    if (!room?.isActive) throw new Error('Phòng không tồn tại hoặc đã ngừng hoạt động.');
    if (!draft.modelFile || !draft.modelFile.name.toLocaleLowerCase().endsWith('.glb')) throw new Error('Chọn mô hình 3D định dạng .glb.');
    if (draft.modelFile.size <= 0 || draft.modelFile.size > 50 * 1024 * 1024) throw new Error('File .glb phải từ 1 byte đến 50 MB (giới hạn demo).');
    const old = this.records.value.find((item) => item.id === id); if (id && !old) throw new Error('Không tìm thấy không gian.');
    const saved: SpaceRecord = { ...draft, code, name: draft.name.trim(), id: id ?? `space-${this.nextId++}`, version: old?.version ?? '1.0' };
    this.records.next(id ? this.records.value.map((item) => item.id === id ? saved : item) : [...this.records.value, saved]);
    this.usage.record(`space:${saved.id}`, saved.roomId, `Space ${saved.code}`);
    return saved;
  }
}

@Injectable({ providedIn: 'root' })
export class DesignService {
  list(search: string, spaceId: string, customerCode: string, page: number, pageSize: number): Observable<CatalogPage<DesignRecord>> {
    return defer(() => {
      const q = search.trim().toLocaleLowerCase();
      const found = designs.filter((item) => (!q || `${item.code} ${item.name} ${item.customerCode} ${item.customerName}`.toLocaleLowerCase().includes(q)) && (!spaceId || item.spaceId === spaceId) && (!customerCode || item.customerCode === customerCode));
      const pages = Math.max(1, Math.ceil(found.length / Math.max(1, pageSize))); const current = Math.min(Math.max(1, page), pages);
      return from(Promise.resolve({ items: found.slice((current - 1) * pageSize, current * pageSize), total: found.length, pages, page: current }));
    }).pipe(delay(120));
  }
  customers(): { code: string; name: string }[] { return Array.from(new Map(designs.map((item) => [item.customerCode, { code: item.customerCode, name: item.customerName }])).values()); }
}
