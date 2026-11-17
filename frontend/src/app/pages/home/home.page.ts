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
  IonText,
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import { camera } from 'ionicons/icons';
import { PhotoService } from '../../services/photo.service';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { AuthPage } from '../auth/auth-form/auth-form.page';
import { CarouselComponent } from '../../components/carousel/carousel.component';
import { CardButtonsComponent } from '../../components/card-buttons/card-buttons.component';
import { ImageCardComponent } from '../../components/image-card/image-card.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
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
    CarouselComponent,
    IonText,
    CardButtonsComponent,
    ImageCardComponent,
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
