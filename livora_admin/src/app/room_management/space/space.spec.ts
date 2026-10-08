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
  it('switches between space and read-only design tabs', async () => {
    (fixture.nativeElement.querySelectorAll('[role="tab"]')[1] as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(component.tab).toBe('designs');
    expect(fixture.nativeElement.textContent).toContain('Danh sách thiết kế');
    expect(fixture.nativeElement.textContent).not.toContain('Thêm không gian');
  });
  it('opens the create Space form with metric and GLB controls', () => {
    component.openCreate(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('HỆ MÉT');
    expect(fixture.nativeElement.textContent).toContain('.glb');
  });
});
