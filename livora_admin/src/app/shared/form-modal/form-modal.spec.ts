import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormModal } from './form-modal';

describe('FormModal', () => {
  let component: FormModal;
  let fixture: ComponentFixture<FormModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(FormModal);
    component = fixture.componentInstance;
    component.isOpen = true;
    component.title = 'Thêm thông báo mới';
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close on onClose', () => {
    let closed = false;
    component.close.subscribe(() => {
      closed = true;
    });

    component.onClose();
    expect(closed).toBe(true);
  });

  it('should emit submit on onSubmit when not submitting', () => {
    let submitted = false;
    component.submit.subscribe(() => {
      submitted = true;
    });

    component.onSubmit();
    expect(submitted).toBe(true);
  });
});
