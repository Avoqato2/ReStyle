/* eslint-disable prettier/prettier */
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GarmentService, type Garment } from '../../supabase/services/garment.service';
import { AppButtonComponent } from '../../components/app-button/app-button.component';
import { RouterLink } from '@angular/router';

import { CATEGORY_LABELS } from '../add-garment/garment.constants';

// Garment kombiniert mit seiner geladenen Signed-URL
export type GarmentWithUrl = Garment & {
  imageUrl?: string;
};

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonRouterLink,
  NavController,
} from '@ionic/angular';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-garderobe',
  templateUrl: './garderobe.page.html',
  styleUrls: ['./garderobe.page.scss'],
  imports: [
    IonCol,
    IonRow,
    IonGrid,
    IonIcon,
    IonFabButton,
    IonFab,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    AppButtonComponent,
    IonRouterLink,
    RouterLink,
    AppHeaderComponent,
],
})
export class GarderobePage {
  public garmentService = inject(GarmentService);
  private navCtrl = inject(NavController);

  garments = signal<GarmentWithUrl[]>([]);
  isLoading = signal<boolean>(false);
  readonly categoryLabels = CATEGORY_LABELS;

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
}
