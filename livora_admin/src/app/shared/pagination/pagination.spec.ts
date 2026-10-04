import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

describe('Pagination', () => {
  let component: Pagination;
  let fixture: ComponentFixture<Pagination>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagination],
    }).compileComponents();

    fixture = TestBed.createComponent(Pagination);
    component = fixture.componentInstance;
    component.currentPage = 1;
    component.totalItems = 25;
    component.itemsPerPage = 10;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate total pages and indices correctly', () => {
    expect(component.totalPagesCount).toBe(3);
    expect(component.startItemIndex).toBe(1);
    expect(component.endItemIndex).toBe(10);
  });

  it('should emit page change event', () => {
    let emittedPage: number | null = null;
    component.pageChange.subscribe((page) => {
      emittedPage = page;
    });

    component.onNextPage();
    expect(emittedPage).toBe(2);
  });
});
