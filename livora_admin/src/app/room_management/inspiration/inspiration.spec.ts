import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inspiration } from './inspiration';

describe('Inspiration', () => {
  let component: Inspiration;
  let fixture: ComponentFixture<Inspiration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inspiration],
    }).compileComponents();

    fixture = TestBed.createComponent(Inspiration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('opens the multi-section create form', () => {
    component.openCreate(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Điểm ghim sản phẩm');
    expect(fixture.nativeElement.textContent).toContain('Hiển thị công khai');
  });
});
