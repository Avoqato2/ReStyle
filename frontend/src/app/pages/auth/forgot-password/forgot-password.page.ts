import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { Router } from '@angular/router';
import { AuthService } from '../../../supabase/services/auth/auth.service';
import { NgHcaptchaModule } from 'ng-hcaptcha';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  imports: [NgHcaptchaModule, IonContent, CommonModule, FormsModule, AppHeaderComponent],
})
export class ForgotPasswordPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  email = '';
  captchaToken = '';

  toastMessage = '';
  toastVisible = false;

  onCaptchaVerified(token: string): void {
    this.captchaToken = token;
  }

  onCaptchaExpired(): void {
    this.captchaToken = '';
  }

  onCaptchaError(): void {
    this.captchaToken = '';
    this.showMessage('hCaptcha konnte nicht geladen werden.');
  }

  showMessage(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;
  }

  async passwordReset(): Promise<void> {
    if (!this.captchaToken) {
      this.showMessage('Bitte bestätige zuerst das Captcha.');
      return;
    }

    const result = await this.auth.requestPasswordReset(this.email, this.captchaToken);

    if (!result.ok) {
      this.captchaToken = '';
      this.showMessage(result.error.message);
      return;
    }

    await this.router.navigateByUrl('/confirmation-mail');
  }
}
