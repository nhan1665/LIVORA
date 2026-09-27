import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoomProductDetail } from './room-product-detail';
import { RouterTestingModule } from '@angular/router/testing';

describe('RoomProductDetail', () => {
  let component: RoomProductDetail;
  let fixture: ComponentFixture<RoomProductDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomProductDetail, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomProductDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
