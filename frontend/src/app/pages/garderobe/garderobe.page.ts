import { Component, computed, inject, signal } from '@angular/core';
import { addIcons } from 'ionicons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonText,
  IonTitle,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
  IonSearchbar,
} from '@ionic/angular';

import { GarmentService, type Garment } from '../../supabase/services/garment.service';
import { CATEGORY_LABELS, GARMENT_LAYERS, GarmentLayer, LAYER_LABELS } from '../add-garment/garment.constants';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { GarmentCardComponent } from '../../components/garment-card/garment-card.component';
import { optionsOutline, addCircle } from 'ionicons/icons';

export type GarmentWithUrl = Garment & {
  imageUrl?: string;
};

@Component({
  selector: 'app-garderobe',
  templateUrl: './garderobe.page.html',
  styleUrls: ['./garderobe.page.scss'],
  standalone: true,
  imports: [
    IonText,
    IonRow,
    IonGrid,
    IonIcon,
    IonFabButton,
    IonFab,
    IonContent,
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonLabel,
    CommonModule,
    FormsModule,
    RouterLink,
    AppHeaderComponent,
    GarmentCardComponent,
    IonTitle,
    IonSearchbar,
  ],
})
export class GarderobePage {
  constructor() {
    addIcons({ addCircle, optionsOutline });
  }

  public garmentService = inject(GarmentService);

  garments = signal<GarmentWithUrl[]>([]);
  isLoading = signal<boolean>(false);

  readonly layers = GARMENT_LAYERS;
  readonly categoryLabels = CATEGORY_LABELS;
  readonly layerLabels = LAYER_LABELS;

  // Standardmäßig alle Layer-Accordions geöffnet halten
  openAccordions = GARMENT_LAYERS.map((l) => l.value);

  // Garments automatisch nach Layer gruppieren
  garmentsByLayer = computed(() => {
    const grouped: Partial<Record<GarmentLayer, GarmentWithUrl[]>> = {};

    for (const garment of this.garments()) {
      const list = grouped[garment.layer] ?? [];
      list.push(garment);
      grouped[garment.layer] = list;
    }

    return grouped;
  });

  async ionViewWillEnter() {
    await this.loadGarments();
  }

  async loadGarments() {
    try {
      this.isLoading.set(true);

      const items = await this.garmentService.getAll();
      const paths = items.map((g) => g.image_path).filter(Boolean);
      const urls = await this.garmentService.getImageUrls(paths);

      const itemsWithUrls: GarmentWithUrl[] = items.map((item) => ({
        ...item,
        imageUrl: urls[item.image_path],
      }));

      this.garments.set(itemsWithUrls);
    } catch (error) {
      console.log('Fehler beim Laden der Garderobe: ', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteGarment(garmentId: string) {
    try {
      const deleteOutfits = false;
      await this.garmentService.delete(garmentId, { deleteOutfits });
      this.garments.update((list) => list.filter((g) => g.id !== garmentId));
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  }
}
