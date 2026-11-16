import { Component, inject, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
  IonIcon,
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import { camera } from 'ionicons/icons';
import { PhotoService } from '../../services/photo.service';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { AuthPage } from '../auth/auth-form/auth-form.page';
import { RouterLink } from '@angular/router';
import { CarouselComponent } from '../../components/carousel/carousel.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CarouselComponent,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonFab,
    IonFabButton,
    IonIcon,
    AppHeaderComponent,
  ],
})
export class HomePage implements OnInit {
  component = AuthPage;
  public photoService = inject(PhotoService);
  constructor() {
    addIcons({ camera });
  }

  async ngOnInit() {
    await this.photoService.loadSaved();
  }
  addPhotoToGallery() {
    this.photoService.HandlePhoto();
  }
}
