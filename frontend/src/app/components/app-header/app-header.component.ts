import { Component } from '@angular/core';
import { IonToolbar, IonButtons, IonMenuButton, IonButton, IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  imports: [IonIcon, IonButton, IonButtons, IonToolbar, IonMenuButton],
})
export class AppHeaderComponent {}
