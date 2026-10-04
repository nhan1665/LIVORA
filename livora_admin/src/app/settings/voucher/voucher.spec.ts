import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Voucher } from './voucher';

describe('Voucher', () => {
  let component: Voucher;
  let fixture: ComponentFixture<Voucher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Voucher],
    }).compileComponents();

    fixture = TestBed.createComponent(Voucher);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
