import { Component, input } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [IonButton, IonIcon],
  templateUrl: './app-button.component.html',
  styleUrls: ['./app-button.component.scss'],
  host: {
    '[attr.variant]': 'variant()',
    '[attr.expand]': 'expand()',
  },
})
export class AppButtonComponent {
  variant = input<'primary' | 'secondary'>('primary');
  size = input<'small' | 'default' | 'large'>('default');
  expand = input<'block' | 'full' | undefined>(undefined);

  disabled = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');

  iconStart = input<string | undefined>();
  iconEnd = input<string | undefined>();
}
