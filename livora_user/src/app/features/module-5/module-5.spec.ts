import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Module5 } from './module-5';

describe('Module5', () => {
  let component: Module5;
  let fixture: ComponentFixture<Module5>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Module5],
    }).compileComponents();

    fixture = TestBed.createComponent(Module5);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
