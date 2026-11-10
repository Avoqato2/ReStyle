import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonNav } from '@ionic/angular';
import { HeaderComponent } from '../../../components/header/header.component';
import { ResetPasswordPage } from '../reset-password/reset-password.page';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  imports: [RouterLink, IonNav, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, ResetPasswordPage],
})
export class ForgotPasswordPage {
  private readonly router = inject(Router);
  async submit(): Promise<void> {
    await this.router.navigateByUrl('/reset-password');
  }
}
