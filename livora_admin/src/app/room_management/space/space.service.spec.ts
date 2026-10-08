import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DesignService, SpaceService } from './space.service';
import { SpaceDraft } from './space.model';
import { RoomService } from '../room/room.service';

describe('SpaceService and DesignService', () => {
  let spaces: SpaceService;
  let designs: DesignService;
  const draft = (): SpaceDraft => ({code: 'KG-LIV-99', name: 'Test Space', roomId: 'room-liv-01', description: '', lengthM: 5, widthM: 4, heightM: 3, modelFile: {name: 'test.glb', size: 1024}, isActive: true});
  beforeEach(() => { TestBed.configureTestingModule({}); spaces = TestBed.inject(SpaceService); designs = TestBed.inject(DesignService); });
  it('filters and paginates space templates', async () => {
    const result = await firstValueFrom(spaces.list('', '', 'all', 1, 6));
    expect(result.total).toBe(7); expect(result.pages).toBe(2);
    const filtered = await firstValueFrom(spaces.list('KG-BED', 'room-bed-02', 'inactive', 1, 6));
    expect(filtered.items.map((item) => item.code)).toEqual(['KG-BED-01']);
  });
  it('creates a template and rejects duplicate code', async () => {
    const saved = await firstValueFrom(spaces.save(draft())); expect(saved.lengthM * saved.widthM).toBe(20);
    await expect(firstValueFrom(spaces.save(draft()))).rejects.toThrow('đã tồn tại');
  });
  it('validates room, metric dimensions, and GLB metadata', async () => {
    await expect(firstValueFrom(spaces.save({...draft(), roomId: 'room-bth-06'}))).rejects.toThrow('ngừng hoạt động');
    await expect(firstValueFrom(spaces.save({...draft(), lengthM: -1}))).rejects.toThrow('Kích thước');
    await expect(firstValueFrom(spaces.save({...draft(), modelFile: {name: 'bad.obj', size: 100}}))).rejects.toThrow('.glb');
  });
  it('cannot activate a template without a model', async () => {
    await expect(firstValueFrom(spaces.setActive('space-bed-1', true))).rejects.toThrow('.glb');
  });
  it('registers a newly saved Space as a Room dependency', async () => {
    await firstValueFrom(spaces.save({...draft(), roomId: 'room-wrk-04'}));
    await expect(firstValueFrom(TestBed.inject(RoomService).setRoomActive('room-wrk-04', false))).rejects.toThrow('Space KG-LIV-99');
  });
  it('provides read-only customer design search and pagination', async () => {
    const result = await firstValueFrom(designs.list('', '', '', 1, 10));
    expect(result.total).toBe(11); expect(result.pages).toBe(2);
    const filtered = await firstValueFrom(designs.list('TK-2610-001', 'space-liv-1', 'KH-VIP-018', 1, 10));
    expect(filtered.items[0].name).toBe('Solitude Wabi-Sabi');
  });
});
