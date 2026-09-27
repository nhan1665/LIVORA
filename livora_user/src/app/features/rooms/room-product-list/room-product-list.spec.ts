import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoomProductList } from './room-product-list';
import { RouterTestingModule } from '@angular/router/testing';

describe('RoomProductList', () => {
  let component: RoomProductList;
  let fixture: ComponentFixture<RoomProductList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomProductList, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomProductList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
