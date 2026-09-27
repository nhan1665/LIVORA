import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoomCategories } from './room-categories';
import { RouterTestingModule } from '@angular/router/testing';

describe('RoomCategories', () => {
  let component: RoomCategories;
  let fixture: ComponentFixture<RoomCategories>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomCategories, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomCategories);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
