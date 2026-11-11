import { CommonModule } from '@angular/common';
import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonInput, IonInputPasswordToggle, IonSelect, IonSelectOption } from '@ionic/angular';

export interface AppInputOption {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-input',
  templateUrl: './app-input.component.html',
  styleUrls: ['./app-input.component.scss'],
  standalone: true,
  imports: [CommonModule, IonInput, IonInputPasswordToggle, IonSelect, IonSelectOption],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppInputComponent),
      multi: true,
    },
  ],
  host: {
    class: 'app-input',
    '[class.app-input--primary]': 'variant() === "primary"',
    '[class.app-input--secondary]': 'variant() === "secondary"',
  },
})
export class AppInputComponent implements ControlValueAccessor {
  private static nextId = 0;

  label = input.required<string>();
  variant = input<'primary' | 'secondary'>('primary');
  type = input<'text' | 'email' | 'password' | 'number'>('text');
  name = input<string | undefined>();
  placeholder = input('');
  autocomplete = input<string | undefined>();
  options = input<readonly AppInputOption[]>([]);
  disabled = input(false);
  required = input(false);

  readonly controlId = `app-input-control-${AppInputComponent.nextId++}`;
  value: string | number | null = '';
  private isDisabled = false;
  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  get isSelect(): boolean {
    return this.options().length > 0;
  }

  get isPassword(): boolean {
    return this.type() === 'password';
  }

  get showClearButton(): boolean {
    return !this.isSelect;
  }

  get isControlDisabled(): boolean {
    return this.disabled() || this.isDisabled;
  }

  writeValue(value: string | number | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  handleValueChange(value: string | number | null): void {
    this.value = value;
    this.onChange(value);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
