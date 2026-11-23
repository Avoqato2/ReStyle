import { Component, input } from '@angular/core';
import { IonHeader, IonToolbar, IonButtons, IonMenuButton, IonBackButton, IonButton, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';

export type HeaderVariant = 'main' | 'sub';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonMenuButton, IonBackButton, IonButton, IonIcon, RouterLink],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  variant = input<HeaderVariant>('main');
  backHref = input<string>('/');
}
