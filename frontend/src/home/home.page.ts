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
  IonIcon, IonNav } from '@ionic/angular';

import { addIcons } from 'ionicons';
import { camera } from 'ionicons/icons';
import { PhotoService } from '../app/services/photo.service';
import { AuthPage } from '../app/auth/pages/auth-form/auth-form.page';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [RouterLink, IonNav, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonFab, IonFabButton, IonIcon],
})
export class HomePage implements OnInit {
  component = AuthPage;
  public photoService = inject(PhotoService);
  constructor() {
    addIcons({ camera });
  }

  // when user gets to this page, pics are loaded automatically
  async ngOnInit() {
    await this.photoService.loadSaved();
    console.log('hi');
  }
  addPhotoToGallery() {
    this.photoService.HandlePhoto();
  }
}
