import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Space } from './space';

describe('Space', () => {
  let component: Space;
  let fixture: ComponentFixture<Space>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Space],
    }).compileComponents();

    fixture = TestBed.createComponent(Space);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
