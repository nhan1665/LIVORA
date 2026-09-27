import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Module3 } from './module-3';

describe('Module3', () => {
  let component: Module3;
  let fixture: ComponentFixture<Module3>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Module3],
    }).compileComponents();

    fixture = TestBed.createComponent(Module3);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
