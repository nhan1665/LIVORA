import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Homepage } from './homepage';

describe('Homepage', () => {
  let component: Homepage;
  let fixture: ComponentFixture<Homepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Homepage],
    }).compileComponents();

    fixture = TestBed.createComponent(Homepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate active count and quota percentage correctly', () => {
    expect(component.activeCount).toBe(4);
    expect(component.activeQuotaPercentage).toBe(80);
  });

  it('should filter items by keyword', () => {
    component.filterKeyword = 'sofa';
    component.onFilter();
    expect(component.filteredData.length).toBeGreaterThan(0);
    expect(component.filteredData.every((item) => item.title.toLowerCase().includes('sofa'))).toBe(true);
  });

  it('should filter items by status', () => {
    component.filterStatus = 'Đã ẩn';
    component.onFilter();
    expect(component.filteredData.every((item) => item.status === 'Đã ẩn')).toBe(true);
  });

  it('should toggle item status between Đang hoạt động and Đã ẩn', () => {
    const item = component.marqueeList[0];
    component.handleAction({ action: 'hide', row: item });
    expect(item.status).toBe('Đã ẩn');

    component.handleAction({ action: 'show', row: item });
    expect(item.status).toBe('Đang hoạt động');
  });

  it('should open modal for creating a new notification', () => {
    component.openCreateModal();
    expect(component.isModalOpen).toBe(true);
    expect(component.modalMode).toBe('create');
  });
});
