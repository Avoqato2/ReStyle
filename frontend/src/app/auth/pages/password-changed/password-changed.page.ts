import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonNav } from '@ionic/angular';
import { HeaderComponent } from '../../../components/header/header.component';
import { HomePage } from '../../../../home/home.page';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-password-changed',
  templateUrl: './password-changed.page.html',
  styleUrls: ['./password-changed.page.scss'],
  imports: [RouterLink, IonNav, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, HomePage],
})
export class PasswordChangedPage{
  private readonly router = inject(Router);
  async submit(): Promise<void> {
    await this.router.navigateByUrl('/home');
  }
}
