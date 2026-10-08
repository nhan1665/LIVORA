import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { RoomConflictError, RoomInUseError } from './room.model';
import { RoomService } from './room.service';

describe('RoomService demo implementation', () => {
  let service: RoomService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [RoomService] });
    service = TestBed.inject(RoomService);
  });

  it('returns a paginated list of eight demo rooms', async () => {
    const result = await firstValueFrom(service.listRooms({
      search: '', status: 'all', page: 1, pageSize: 7,
    }));

    expect(result.items).toHaveLength(7);
    expect(result.totalItems).toBe(8);
    expect(result.totalPages).toBe(2);
  });

  it('searches by code and name without case sensitivity', async () => {
    const result = await firstValueFrom(service.listRooms({
      search: 'rm-bed', status: 'all', page: 1, pageSize: 7,
    }));

    expect(result.totalItems).toBe(1);
    expect(result.items[0].name).toBe('Phòng ngủ Suite');
  });

  it('filters active and inactive rooms', async () => {
    const active = await firstValueFrom(service.listRooms({
      search: '', status: 'active', page: 1, pageSize: 10,
    }));
    const inactive = await firstValueFrom(service.listRooms({
      search: '', status: 'inactive', page: 1, pageSize: 10,
    }));

    expect(active.items.every((room) => room.isActive)).toBe(true);
    expect(inactive.items).toHaveLength(1);
    expect(inactive.items[0].code).toBe('RM-BTH-06');
  });

  it('creates and updates a room in the current demo session', async () => {
    const created = await firstValueFrom(service.createRoom({
      code: 'rm-new-09', name: '  Phòng mới  ', description: '  Mô tả  ',
      thumbnail: '/images/rooms/living-room.png', isActive: true,
    }));
    const updated = await firstValueFrom(service.updateRoom(created.id, {
      code: 'RM-NEW-09', name: 'Phòng mới cập nhật', description: 'Mô tả mới',
      thumbnail: '/images/rooms/bedroom.png', isActive: true,
    }));

    expect(created.code).toBe('RM-NEW-09');
    expect(created.name).toBe('Phòng mới');
    expect(updated.name).toBe('Phòng mới cập nhật');
    expect(updated.thumbnail).toBe('/images/rooms/bedroom.png');
  });

  it('rejects duplicate room codes', async () => {
    await expect(firstValueFrom(service.createRoom({
      code: 'rm-liv-01', name: 'Phòng khác', description: '',
      thumbnail: '/images/rooms/living-room.png', isActive: true,
    }))).rejects.toBeInstanceOf(RoomConflictError);
  });

  it('blocks deactivation when the demo relationship snapshot has references', async () => {
    await expect(firstValueFrom(service.setRoomActive('room-liv-01', false)))
      .rejects.toBeInstanceOf(RoomInUseError);
  });

  it('allows deactivation for an unreferenced room', async () => {
    const updated = await firstValueFrom(service.setRoomActive('room-wrk-04', false));
    expect(updated.isActive).toBe(false);
  });

  it('blocks changing an in-use room to inactive through the edit operation too', async () => {
    await expect(firstValueFrom(service.updateRoom('room-bed-02', {
      code: 'RM-BED-02', name: 'Phòng ngủ Suite', description: 'Updated',
      thumbnail: '/images/rooms/bedroom.png', isActive: false,
    }))).rejects.toBeInstanceOf(RoomInUseError);
  });
});
