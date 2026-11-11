import { Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../supabase/services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { AppInputComponent } from '../../../components/app-input/app-input.component';
import { NgHcaptchaModule } from 'ng-hcaptcha';
import { IonContent } from '@ionic/angular';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth-page',
  templateUrl: './auth-form.page.html',
  styleUrls: ['./auth-form.page.scss'],
  standalone: true,
  imports: [RouterLink, FormsModule, AppInputComponent, NgHcaptchaModule, IonContent],
})
export class AuthPage {
  private auth = inject(AuthService);
  mode: AuthMode = 'login';
  email = '';
  password = '';
  toastMessage = '';
  toastVisible = false;
  captchaToken = '';

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.mode = data['mode'] === 'register' ? 'register' : 'login';
      this.email = '';
      this.password = '';
    });
  }

  showMessage(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;
  }

  private readonly router = inject(Router);

  async AuthWithGoogle(): Promise<void> {
    const result = await this.auth.signInWithGoogle();

    if (!result.ok) {
      this.showMessage(result.error.message);
      return;
    }
    await this.router.navigateByUrl('/home');
  }

  async submit(): Promise<void> {
    const result =
      this.mode === 'register'
        ? await this.auth.signUp(this.email, this.password, this.captchaToken)
        : await this.auth.signIn(this.email, this.password, this.captchaToken);

    if (!result.ok) {
      this.showMessage(result.error.message);
      return;
    }
    await this.router.navigateByUrl(this.mode === 'register' ? '/display-name' : '/home');
  }

  async forgotPassword(): Promise<void> {
    await this.router.navigateByUrl('/forgot-password');
  }

  onCaptchaVerified(token: string): void {
    this.captchaToken = token;
  }

  onCaptchaExpired(): void {
    this.captchaToken = '';
  }

  onCaptchaError(): void {
    this.captchaToken = '';
    this.showMessage('Captcha konnte nicht geladen werden.');
  }
}
