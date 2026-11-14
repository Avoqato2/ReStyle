import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { Router } from '@angular/router';
import { AuthService } from '../../../supabase/services/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  imports: [IonContent, CommonModule, FormsModule, AppHeaderComponent],
})
export class ResetPasswordPage {
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

  async submit(): Promise<void> {
    const result = await this.auth.updatePassword(this.newPassword);

    if (!result.ok) {
      this.showMessage(result.error.message);
      return;
    }

    await this.router.navigateByUrl('/password-changed');
  }
}
