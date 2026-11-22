import { Component, input, output } from '@angular/core';
import { IonText, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trashOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-garment-card',
  templateUrl: './garment-card.component.html',
  styleUrls: ['./garment-card.component.scss'],
  imports: [IonText, IonIcon],
})
export class GarmentCardComponent {
  garmentImageUrl = input<string | undefined>();
  garmentName = input<string | null | undefined>();
  garmentLayer = input<string | null | undefined>();
  garmentCategory = input<string | null | undefined>();

  deleteClick = output<void>();

  constructor() {
    addIcons({ trashOutline, chevronForwardOutline });
  }

  onDeleteClick(event: Event) {
    event.stopPropagation();
    this.deleteClick.emit();
  }
}
