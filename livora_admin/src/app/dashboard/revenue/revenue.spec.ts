import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Revenue } from './revenue';

describe('Revenue', () => {
  let component: Revenue;
  let fixture: ComponentFixture<Revenue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Revenue],
    }).compileComponents();

    fixture = TestBed.createComponent(Revenue);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
