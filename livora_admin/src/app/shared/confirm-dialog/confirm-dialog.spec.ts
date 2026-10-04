import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let component: ConfirmDialog;
  let fixture: ComponentFixture<ConfirmDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    component.isOpen = true;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit confirm on onConfirm', () => {
    let confirmed = false;
    component.confirm.subscribe(() => {
      confirmed = true;
    });

    component.onConfirm();
    expect(confirmed).toBe(true);
  });

  it('should emit cancel on onCancel', () => {
    let cancelled = false;
    component.cancel.subscribe(() => {
      cancelled = true;
    });

    component.onCancel();
    expect(cancelled).toBe(true);
  });
});
