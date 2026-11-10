import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonNav } from '@ionic/angular';
import { HeaderComponent } from '../../../components/header/header.component';
import { ResetPasswordPage } from '../reset-password/reset-password.page';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../supabase/services/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  imports: [RouterLink, IonNav, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, ResetPasswordPage],
})
export class ForgotPasswordPage {
  private readonly router = inject(Router);
  private auth = inject(AuthService);
  email = '';
  toastMessage = '';
  toastVisible = false;

   showMessage(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;
    }

  async passwordReset(): Promise<void> {
    const result = await this.auth.requestPasswordReset(this.email);
    if(!result.ok){
      this.showMessage(result.error.message);
      return;
    }
    await this.router.navigateByUrl('/confirmation-mail');
  }
}
