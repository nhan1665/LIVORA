import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterBar } from './filter-bar';

describe('FilterBar', () => {
  let component: FilterBar;
  let fixture: ComponentFixture<FilterBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterBar],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit filter event on apply', () => {
    let filterResult: any = null;
    component.filter.subscribe((res) => {
      filterResult = res;
    });

    component.searchValue = 'sofa';
    component.statusValue = 'Đang hoạt động';
    component.onApplyFilter();

    expect(filterResult).toEqual({
      search: 'sofa',
      status: 'Đang hoạt động',
    });
  });

  it('should reset values on reset', () => {
    component.searchValue = 'sofa';
    component.statusValue = 'Đang hoạt động';
    component.onReset();

    expect(component.searchValue).toBe('');
    expect(component.statusValue).toBe('all');
  });
});
