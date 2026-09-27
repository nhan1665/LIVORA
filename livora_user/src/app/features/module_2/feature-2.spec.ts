import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Feature2 } from './feature-2';

describe('Feature2', () => {
  let component: Feature2;
  let fixture: ComponentFixture<Feature2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Feature2],
    }).compileComponents();

    fixture = TestBed.createComponent(Feature2);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
