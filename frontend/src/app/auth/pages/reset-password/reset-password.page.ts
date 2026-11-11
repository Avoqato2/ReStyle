import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonNav } from '@ionic/angular';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { PasswordChangedPage } from '../password-changed/password-changed.page';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../supabase/services/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  imports: [RouterLink, IonNav, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, AppHeaderComponent, PasswordChangedPage],
})
export class ResetPasswordPage{
  newPassword = '';
  newPasswordConfirm = '';
  private readonly router = inject(Router);
  private auth = inject(AuthService);
  toastMessage = '';
  toastVisible = false;

  showMessage(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;
  }

  async submit(): Promise<void>{
    const result = await this.auth.updatePassword(this.newPassword);

    if(!result.ok){
      this.showMessage(result.error.message);
      return;
    }

    await this.router.navigateByUrl('/password-changed');
  }
}
