import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Module4 } from './module-4';

describe('Module4', () => {
  let component: Module4;
  let fixture: ComponentFixture<Module4>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Module4],
    }).compileComponents();

    fixture = TestBed.createComponent(Module4);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
