import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Contact } from './contact';
import { ContactService } from './contact.service';

describe('Contact Component', () => {
  let component: Contact;
  let fixture: ComponentFixture<Contact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [ContactService],
    }).compileComponents();

    fixture = TestBed.createComponent(Contact);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the Contact component', () => {
    expect(component).toBeTruthy();
  });

  it('should load page 1 with 5 of 48 contacts and 10 pages', () => {
    expect(component.contacts().length).toBe(5);
    expect(component.totalItems()).toBe(48);
    expect(component.totalPages()).toBe(10);
    expect(component.pendingCount()).toBeGreaterThan(0);
  });

  it('should filter contacts when applyFilter is called', () => {
    component.searchDraft = 'LH-2610-085';
    component.applyFilter();
    fixture.detectChanges();

    expect(component.totalItems()).toBe(1);
    expect(component.contacts()[0].fullName).toBe('Phạm Đức Toàn');
  });

  it('should reset filters and restore page 1', () => {
    component.searchDraft = 'LH-2610-085';
    component.statusDraft = 'new';
    component.applyFilter();

    component.resetFilter();
    fixture.detectChanges();

    expect(component.searchDraft).toBe('');
    expect(component.statusDraft).toBe('all');
    expect(component.totalItems()).toBe(48);
    expect(component.currentPage()).toBe(1);
  });

  it('should change page when changePage is called', () => {
    component.changePage(2);
    fixture.detectChanges();

    expect(component.currentPage()).toBe(2);
    expect(component.contacts().length).toBe(5);
  });

  it('should open and close the detail modal', () => {
    const first = component.contacts()[0];
    component.openDetailModal(first);
    fixture.detectChanges();

    expect(component.isDetailModalOpen()).toBe(true);
    expect(component.selectedContact()?.id).toBe(first.id);

    component.closeDetailModal();
    fixture.detectChanges();

    expect(component.isDetailModalOpen()).toBe(false);
    expect(component.selectedContact()).toBeNull();
  });

  it('should resolve a pending contact through the confirmation flow', () => {
    const pending = component.contacts().find((c) => c.status === 'new');
    expect(pending).toBeTruthy();

    component.openResolveConfirm(pending!);
    expect(component.isResolveConfirmOpen()).toBe(true);

    component.confirmResolve();
    fixture.detectChanges();

    expect(component.isResolveConfirmOpen()).toBe(false);
    expect(component.toastMessage()).toContain('Đã xử lý');
    const updated = component.contacts().find((c) => c.id === pending!.id);
    expect(updated?.status).toBe('resolved');
  });

  it('should return a windowed pagination list', () => {
    expect(component.getPaginationPages()).toEqual([1, 2, 3, 4, '...', 10]);
  });
});
