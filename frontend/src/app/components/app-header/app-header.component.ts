import { Component } from '@angular/core';
import { IonToolbar, IonButtons, IonMenuButton, IonHeader, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  imports: [IonIcon, IonButton, IonContent, IonTitle, IonHeader, IonButtons, IonToolbar, IonMenuButton],
})
export class AppHeaderComponent {
  constructor() {}

  //ngOnInit() {}
}
