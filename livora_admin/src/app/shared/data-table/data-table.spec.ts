import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTable, TableColumn } from './data-table';

describe('DataTable', () => {
  let component: DataTable;
  let fixture: ComponentFixture<DataTable>;

  const mockColumns: TableColumn[] = [
    { key: 'code', label: 'MÃ', type: 'number' },
    { key: 'name', label: 'TÊN', type: 'text' },
    { key: 'price', label: 'GIÁ', type: 'currency' },
    { key: 'status', label: 'TRẠNG THÁI', type: 'badge' },
    { key: 'actions', label: 'THAO TÁC', type: 'actions' },
  ];

  const mockData = [
    { code: '001', name: 'Sản phẩm A', price: 150000, status: 'Đang hoạt động' },
    { code: '002', name: 'Sản phẩm B', price: 200000, status: 'Đã ẩn' },
    { code: '003', name: 'Sản phẩm C', price: 350000, status: 'Chờ xử lý' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTable],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTable);
    component = fixture.componentInstance;
    component.columns = mockColumns;
    component.data = mockData;
    component.totalItems = mockData.length;
    component.itemsPerPage = 10;
    component.currentPage = 1;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute pagination indices properly', () => {
    expect(component.startItemIndex).toBe(1);
    expect(component.endItemIndex).toBe(3);
    expect(component.totalPagesCount).toBe(1);
  });

  it('should resolve status badges accurately', () => {
    const activeBadge = component.resolveBadge('Đang hoạt động', mockData[0], mockColumns[3]);
    expect(activeBadge.variant).toBe('active');

    const inactiveBadge = component.resolveBadge('Đã ẩn', mockData[1], mockColumns[3]);
    expect(inactiveBadge.variant).toBe('inactive');

    const pendingBadge = component.resolveBadge('Chờ xử lý', mockData[2], mockColumns[3]);
    expect(pendingBadge.variant).toBe('pending');
  });

  it('should format currency correctly', () => {
    const formatted = component.formatCurrency(150000);
    expect(formatted).toContain('150.000');
    expect(formatted).toContain('đ');
  });

  it('should emit actionClick when action is triggered', () => {
    let emittedAction: any = null;
    component.actionClick.subscribe((event) => {
      emittedAction = event;
    });

    const testAction = { id: 'edit', label: 'Chỉnh sửa' };
    const mockEvent = new MouseEvent('click');
    component.onActionClick(testAction, mockData[0], 0, mockEvent);

    expect(emittedAction).toEqual({
      action: 'edit',
      row: mockData[0],
      index: 0,
    });
  });

  it('should emit pageChange when page changes', () => {
    let emittedPage: number | null = null;
    component.pageChange.subscribe((page) => {
      emittedPage = page;
    });
    component.totalItems = 30;
    component.itemsPerPage = 10;

    component.onPageChange(2);
    expect(emittedPage).toBe(2);
    expect(component.currentPage).toBe(2);
  });
});
