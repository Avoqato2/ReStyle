import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonText, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trashOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-garment-card',
  templateUrl: './garment-card.component.html',
  styleUrls: ['./garment-card.component.scss'],
  standalone: true,
  imports: [IonText, IonIcon, RouterLink],
})
export class GarmentCardComponent {
  garmentId = input.required<string>();
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
    event.preventDefault();
    this.deleteClick.emit();
  }
}
