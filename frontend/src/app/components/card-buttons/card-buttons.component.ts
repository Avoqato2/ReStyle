import { Component, Input } from '@angular/core';
import { IonText, IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-card-buttons',
  templateUrl: './card-buttons.component.html',
  styleUrls: ['./card-buttons.component.scss'],
  standalone: true,
  imports: [IonText, IonIcon],
})
export class CardButtonsComponent {
  @Input() cardIcon: string = '';
  @Input() title: string = '';
  @Input() cardDescription: string = '';
}
