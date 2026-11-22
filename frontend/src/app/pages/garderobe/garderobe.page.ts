/* eslint-disable prettier/prettier */
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GarmentService, type Garment } from '../../supabase/services/garment.service';
import { RouterLink } from '@angular/router';

import { CATEGORY_LABELS, LAYER_LABELS } from '../add-garment/garment.constants';

// Garment kombiniert mit seiner geladenen Signed-URL
export type GarmentWithUrl = Garment & {
  imageUrl?: string;
};

import { IonContent, IonFab, IonFabButton, IonIcon, IonGrid, IonRow, IonCol, IonRouterLink, IonText, IonTitle } from '@ionic/angular';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { GarmentCardComponent } from '../../components/garment-card/garment-card.component';

@Component({
  selector: 'app-garderobe',
  templateUrl: './garderobe.page.html',
  styleUrls: ['./garderobe.page.scss'],
  imports: [IonText,
    IonCol,
    IonRow,
    IonGrid,
    IonIcon,
    IonFabButton,
    IonFab,
    IonContent,
    CommonModule,
    FormsModule,
    IonRouterLink,
    RouterLink,
    AppHeaderComponent,
    GarmentCardComponent, IonTitle],
})
export class GarderobePage {
  public garmentService = inject(GarmentService);

  garments = signal<GarmentWithUrl[]>([]);
  isLoading = signal<boolean>(false);
  readonly categoryLabels = CATEGORY_LABELS;
  readonly layerLabels = LAYER_LABELS;

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
      console.log('delete Garment!!!', garmentId);
      await this.garmentService.delete(garmentId, { deleteOutfits });
      
      // Karte sofort aus der Anzeige entfernen:
      this.garments.update((list) => list.filter((g) => g.id !== garmentId));
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  }
}
