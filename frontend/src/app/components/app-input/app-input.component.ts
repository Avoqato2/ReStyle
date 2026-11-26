import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonInput, IonInputPasswordToggle } from '@ionic/angular';

export type AppInputType = 'text' | 'email' | 'password';
export type AppInputAutocomplete = 'off' | 'email' | 'username' | 'current-password' | 'new-password';

@Component({
  selector: 'app-input',
  templateUrl: './app-input.component.html',
  styleUrl: './app-input.component.scss',
  imports: [IonInput, IonInputPasswordToggle],
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
  label = input.required<string>();
  variant = input<'primary' | 'secondary'>('primary');
  type = input<AppInputType>('text');
  name = input<string>();
  placeholder = input('');
  autocomplete = input<AppInputAutocomplete>('off');
  required = input(false);

  // Signals, damit Änderungen über writeValue/setDisabledState auch ohne zone.js gerendert werden.
  readonly value = signal('');
  readonly disabled = signal(false);
  readonly isPassword = computed(() => this.type() === 'password');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  handleInput(value: string | null | undefined): void {
    const next = value ?? '';
    this.value.set(next);
    this.onChange(next);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
