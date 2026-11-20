import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../supabase/services/profile.service';

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
  IonItem,
  IonLabel,
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
    IonLabel,
    IonItem,
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
    RouterLink,
  ],
})
export class HomePage implements OnInit {
  component = AuthPage;
  public photoService = inject(PhotoService);
  constructor() {
    addIcons({ camera });
  }

  userName = signal<string>('');
  private profileService = inject(ProfileService);

  async ngOnInit() {
    await this.getUserName();
  }

  // wenn man Username ändert und wieder auf Home zurückkommt
  async ionViewWillEnter() {
    await this.getUserName();
  }

  private async getUserName(): Promise<void> {
    try {
      const profile = await this.profileService.getOwn();
      if (profile.display_name) {
        this.userName.set(profile.display_name);
        return;
      }
    } catch (error) {
      console.error('Profil konnte nicht geladen werden: ', error);
    }
  }
}
