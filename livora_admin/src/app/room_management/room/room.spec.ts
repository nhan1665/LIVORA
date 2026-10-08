import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Room } from './room';
import { RoomService } from './room.service';

describe('Room', () => {
  let component: Room;
  let fixture: ComponentFixture<Room>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Room],
      providers: [RoomService],
    }).compileComponents();

    fixture = TestBed.createComponent(Room);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the Room page and loads the first page of demo data', async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.rooms().length).toBe(7);
    expect(component.totalItems()).toBe(8);
    expect(component.totalPages()).toBe(2);
  });

  it('validates the provisional room-code format', () => {
    expect(component.isCodeValid('RM-LIV-08')).toBe(true);
    expect(component.isCodeValid('LIV-08')).toBe(false);
  });

  it('maps active state to the correct Vietnamese label', () => {
    expect(component.statusText(true)).toBe('Hoạt động');
    expect(component.statusText(false)).toBe('Ngừng hoạt động');
  });
});
