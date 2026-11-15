import { Component } from '@angular/core';
import { IonGrid, IonRow, IonCol } from '@ionic/angular';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
  imports: [IonCol, IonRow, IonGrid],
})
export class CarouselComponent {}
