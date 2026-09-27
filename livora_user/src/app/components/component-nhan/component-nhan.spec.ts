import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentNhan } from './component-nhan';

describe('ComponentNhan', () => {
  let component: ComponentNhan;
  let fixture: ComponentFixture<ComponentNhan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentNhan],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentNhan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
