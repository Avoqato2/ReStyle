import { Component, input } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [IonButton, IonIcon],
  template: `
    <ion-button
      [color]="color()"
      [size]="size()"
      [expand]="expand()"
      [disabled]="disabled()"
      [type]="type()"
      fill="solid"
      shape="round">
      @if (iconStart()) {
        <ion-icon [name]="iconStart()" slot="start" />
      }

      <ng-content />

      @if (iconEnd()) {
        <ion-icon [name]="iconEnd()" slot="end" />
      }
    </ion-button>
  `,
})
export class AppButtonComponent {
  color = input<string>('primary');
  size = input<'small' | 'default' | 'large'>('default');
  expand = input<'block' | 'full' | undefined>(undefined);

  disabled = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');

  iconStart = input<string | undefined>();
  iconEnd = input<string | undefined>();
}
