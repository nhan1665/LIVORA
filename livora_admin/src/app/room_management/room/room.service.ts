import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, defer, delay, map, Observable, of } from 'rxjs';
import {
  Room,
  RoomConflictError,
  RoomDraft,
  RoomInUseError,
  RoomListQuery,
  RoomListResponse,
} from './room.model';
import { RoomUsageService } from './room-usage.service';

interface RoomFixture extends Room {
  /** Demo-only relationship snapshot. It is not part of the Room API/schema. */
  references: string[];
}

/**
 * Session-only mock implementation. Replace this provider with an API-backed
 * implementation after the Room code/slug and endpoint contracts are approved.
 */
@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly usage = inject(RoomUsageService);
  private readonly fixtures = new BehaviorSubject<RoomFixture[]>([
    {
      id: 'room-liv-01', code: 'RM-LIV-01', name: 'Phòng khách Master',
      description: 'Không gian tiếp khách chủ đạo', thumbnail: '/images/rooms/living-room.png',
      isActive: true, displayOrder: 1, references: ['Products', 'Inspirations'],
    },
    {
      id: 'room-bed-02', code: 'RM-BED-02', name: 'Phòng ngủ Suite',
      description: 'Phòng nghỉ thư giãn', thumbnail: '/images/rooms/bedroom.png',
      isActive: true, displayOrder: 2, references: ['Products'],
    },
    {
      id: 'room-din-03', code: 'RM-DIN-03', name: 'Phòng ăn & Bếp đảo',
      description: 'Không gian ẩm thực ấm cúng', thumbnail: '/images/rooms/dining-room.png',
      isActive: true, displayOrder: 3, references: ['Products'],
    },
    {
      id: 'room-wrk-04', code: 'RM-WRK-04', name: 'Phòng làm việc & Thư viện',
      description: 'Không gian làm việc yên tĩnh', thumbnail: '/images/rooms/living-room.png',
      isActive: true, displayOrder: 4, references: [],
    },
    {
      id: 'room-out-05', code: 'RM-OUT-05', name: 'Ban công & Sky Lounge',
      description: 'Không gian thư giãn ngoài trời', thumbnail: '/images/rooms/kitchen.png',
      isActive: true, displayOrder: 5, references: [],
    },
    {
      id: 'room-bth-06', code: 'RM-BTH-06', name: 'Phòng tắm Spa Sanctuary',
      description: 'Phòng chăm sóc cá nhân', thumbnail: '/images/rooms/bathroom.jpg',
      isActive: false, displayOrder: 6, references: ['Products'],
    },
    {
      id: 'room-ent-07', code: 'RM-ENT-07', name: 'Sảnh đón & Tiền sảnh',
      description: 'Khu vực sảnh đón tiếp', thumbnail: '/images/rooms/living-room.png',
      isActive: true, displayOrder: 7, references: ['Inspirations'],
    },
    {
      id: 'room-kit-08', code: 'RM-KIT-08', name: 'Phòng bếp hiện đại',
      description: 'Khu vực chuẩn bị và dùng bữa', thumbnail: '/images/rooms/kitchen.png',
      isActive: true, displayOrder: 8, references: ['Products'],
    },
  ]);
  private nextId = 9;
  private readonly responseDelayMs = 180;

  listRooms(query: RoomListQuery): Observable<RoomListResponse> {
    return this.fixtures.pipe(
      map((fixtures) => {
        const normalizedSearch = query.search.trim().toLocaleLowerCase();
        const filtered = fixtures
          .filter((room) => query.status === 'all'
            || (query.status === 'active' ? room.isActive : !room.isActive))
          .filter((room) => !normalizedSearch
            || room.code.toLocaleLowerCase().includes(normalizedSearch)
            || room.name.toLocaleLowerCase().includes(normalizedSearch));
        const pageSize = Math.max(1, query.pageSize);
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        const page = Math.min(Math.max(1, query.page), totalPages);
        const offset = (page - 1) * pageSize;

        return {
          items: filtered.slice(offset, offset + pageSize).map(({ references: _references, ...room }) => room),
          page,
          pageSize,
          totalItems: filtered.length,
          totalPages,
        };
      }),
      delay(this.responseDelayMs),
    );
  }

  getRoom(id: string): Observable<Room> {
    return defer(() => {
      const room = this.fixtures.value.find((candidate) => candidate.id === id);
      if (!room) throw new Error('Không tìm thấy phòng.');
      const { references: _references, ...result } = room;
      return of(result);
    }).pipe(delay(this.responseDelayMs));
  }

  createRoom(draft: RoomDraft): Observable<Room> {
    return defer(() => {
      this.assertUniqueCode(draft.code);
      const sequence = this.nextId++;
      const room: RoomFixture = {
        ...draft,
        id: `room-${sequence}`,
        code: draft.code.trim().toUpperCase(),
        name: draft.name.trim(),
        description: draft.description.trim(),
        displayOrder: sequence,
        references: [],
      };
      this.fixtures.next([...this.fixtures.value, room]);
      const { references: _references, ...result } = room;
      return of(result);
    }).pipe(delay(this.responseDelayMs));
  }

  updateRoom(id: string, draft: RoomDraft): Observable<Room> {
    return defer(() => {
      this.assertUniqueCode(draft.code, id);
      const existing = this.fixtures.value.find((room) => room.id === id);
      if (!existing) throw new Error('Không tìm thấy phòng.');
      const references = [...existing.references, ...this.usage.forRoom(id)];
      if (existing.isActive && !draft.isActive && references.length > 0) {
        throw new RoomInUseError(references);
      }
      const updated: RoomFixture = {
        ...existing,
        ...draft,
        code: draft.code.trim().toUpperCase(),
        name: draft.name.trim(),
        description: draft.description.trim(),
      };
      this.fixtures.next(this.fixtures.value.map((room) => room.id === id ? updated : room));
      const { references: _references, ...result } = updated;
      return of(result);
    }).pipe(delay(this.responseDelayMs));
  }

  setRoomActive(id: string, isActive: boolean): Observable<Room> {
    return defer(() => {
      const existing = this.fixtures.value.find((room) => room.id === id);
      if (!existing) throw new Error('Không tìm thấy phòng.');
      const references = [...existing.references, ...this.usage.forRoom(id)];
      if (!isActive && references.length > 0) {
        throw new RoomInUseError(references);
      }
      const updated = { ...existing, isActive };
      this.fixtures.next(this.fixtures.value.map((room) => room.id === id ? updated : room));
      const { references: _references, ...result } = updated;
      return of(result);
    }).pipe(delay(this.responseDelayMs));
  }

  private assertUniqueCode(code: string, exceptId?: string): void {
    const normalizedCode = code.trim().toLocaleUpperCase();
    const duplicate = this.fixtures.value.some((room) =>
      room.id !== exceptId && room.code.toLocaleUpperCase() === normalizedCode,
    );
    if (duplicate) throw new RoomConflictError('Mã phòng này đã tồn tại.');
  }
}
