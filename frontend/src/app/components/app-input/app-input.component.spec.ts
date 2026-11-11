import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppInputOption, AppInputComponent } from './app-input.component';

describe('AppInputComponent', () => {
  let component: AppInputComponent;
  let fixture: ComponentFixture<AppInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppInputComponent],
    });
    fixture = TestBed.createComponent(AppInputComponent);
    fixture.componentRef.setInput('label', 'E-Mail');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses primary as the default variant', () => {
    expect(component.variant()).toBe('primary');
    expect(fixture.nativeElement.classList).toContain('app-input--primary');
  });

  it('shows a select when options are provided', () => {
    const options: AppInputOption[] = [{ label: 'Blau', value: 'blue' }];
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ion-select')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('ion-input')).toBeNull();
  });

  it('shows the password toggle for password inputs', () => {
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ion-input-password-toggle')).toBeTruthy();
  });

  it('propagates changed values to the form', () => {
    const onChange = vi.fn();
    component.registerOnChange(onChange);

    component.handleValueChange('test@example.com');

    expect(component.value).toBe('test@example.com');
    expect(onChange).toHaveBeenCalledWith('test@example.com');
  });
});
