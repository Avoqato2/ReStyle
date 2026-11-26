import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppInputComponent } from './app-input.component';

describe('AppInputComponent', () => {
  let component: AppInputComponent;
  let fixture: ComponentFixture<AppInputComponent>;

  const ionInput = (): HTMLIonInputElement => fixture.nativeElement.querySelector('ion-input');

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

  it('renders the label inside the input label slot', () => {
    const label = fixture.nativeElement.querySelector('ion-input [slot="label"]');

    expect(label?.textContent?.trim()).toBe('E-Mail');
  });

  it('shows the password toggle and no clear button for password inputs', () => {
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ion-input-password-toggle')).toBeTruthy();
    expect(ionInput().clearInput).toBe(false);
  });

  it('shows a clear button for non-password inputs', () => {
    expect(fixture.nativeElement.querySelector('ion-input-password-toggle')).toBeNull();
    expect(ionInput().clearInput).toBe(true);
  });

  it('renders values written by the form', () => {
    component.writeValue('anna@example.com');
    fixture.detectChanges();

    expect(ionInput().value).toBe('anna@example.com');
  });

  it('treats null from the form as empty string', () => {
    component.writeValue(null);

    expect(component.value()).toBe('');
  });

  it('disables the control via setDisabledState', () => {
    component.setDisabledState(true);
    fixture.detectChanges();

    expect(ionInput().disabled).toBe(true);
  });

  it('propagates changed values to the form', () => {
    const onChange = vi.fn();
    component.registerOnChange(onChange);

    component.handleInput('test@example.com');

    expect(component.value()).toBe('test@example.com');
    expect(onChange).toHaveBeenCalledWith('test@example.com');
  });

  it('marks the control as touched on blur', () => {
    const onTouched = vi.fn();
    component.registerOnTouched(onTouched);

    component.handleBlur();

    expect(onTouched).toHaveBeenCalled();
  });
});
