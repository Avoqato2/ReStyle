import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, IonToast, IonNav } from '@ionic/angular';
import { HomePage } from '../../../../home/home.page';
import { Router } from '@angular/router';

@Component({
  selector: 'app-display-name',
  templateUrl: './display-name.page.html',
  styleUrls: ['./display-name.page.scss'],
  imports: [IonNav, IonToast, IonButton, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HomePage],
})
export class DisplayNamePage{
  private readonly router = inject(Router);
  async submit(): Promise<void> {
    await this.router.navigateByUrl('/home');
  }
}
