import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { InspirationService } from './inspiration.service';
import { InspirationDraft } from './inspiration.model';
import { RoomService } from '../room/room.service';

describe('InspirationService', () => {
  let service: InspirationService;
  const draft = (): InspirationDraft => ({code: 'INS-LIV-99', title: 'Test concept', roomId: 'room-liv-01', style: 'Modern', content: 'A real description', thumbnail: '/images/rooms/living-room.png', taggedProducts: [{productId: 'p-sofa', xPercent: 45, yPercent: 60, note: ''}], status: 'published'});
  beforeEach(() => { TestBed.configureTestingModule({}); service = TestBed.inject(InspirationService); });
  it('filters, searches, and paginates inspirations', async () => {
    const first = await firstValueFrom(service.list({search: '', roomId: '', status: 'all', page: 1, pageSize: 5}));
    expect(first.total).toBe(6); expect(first.items.length).toBe(5);
    const filtered = await firstValueFrom(service.list({search: 'quiet', roomId: 'room-bed-02', status: 'published', page: 1, pageSize: 5}));
    expect(filtered.items.map((item) => item.code)).toEqual(['INS-BED-04']);
  });
  it('creates with valid room, saleable product, and coordinates', async () => {
    const created = await firstValueFrom(service.save(draft()));
    expect(created.code).toBe('INS-LIV-99'); expect(created.taggedProducts[0].productId).toBe('p-sofa');
  });
  it('rejects duplicate code and unavailable product', async () => {
    await expect(firstValueFrom(service.save({...draft(), code: 'INS-LIV-01'}))).rejects.toThrow('đã tồn tại');
    await expect(firstValueFrom(service.save({...draft(), taggedProducts: [{productId: 'p-retired', xPercent: 50, yPercent: 50, note: ''}]}))).rejects.toThrow('không còn được kinh doanh');
  });
  it('rejects inactive room and invalid hotspot coordinates', async () => {
    await expect(firstValueFrom(service.save({...draft(), roomId: 'room-bth-06'}))).rejects.toThrow('ngừng hoạt động');
    await expect(firstValueFrom(service.save({...draft(), taggedProducts: [{productId: 'p-sofa', xPercent: 101, yPercent: 50, note: ''}]}))).rejects.toThrow('0 đến 100');
  });
  it('blocks hiding an inspiration referenced by the fixture', async () => {
    await expect(firstValueFrom(service.setStatus('ins-1', 'hidden'))).rejects.toThrow('tham chiếu');
  });
  it('registers a newly saved Inspiration as a Room dependency', async () => {
    await firstValueFrom(service.save({...draft(), roomId: 'room-wrk-04', taggedProducts: [{productId: 'p-desk', xPercent: 50, yPercent: 50, note: ''}]}));
    await expect(firstValueFrom(TestBed.inject(RoomService).setRoomActive('room-wrk-04', false))).rejects.toThrow('Inspiration INS-LIV-99');
  });
});
