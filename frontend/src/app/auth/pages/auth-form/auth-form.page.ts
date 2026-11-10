import { Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../supabase/services/auth/auth.service';
import { logIn } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth-page',
  templateUrl: './auth-form.page.html',
  styleUrls: ['./auth-form.page.scss'],
  standalone: true,
  imports: [RouterLink, FormsModule],
})
export class AuthPage {
  private auth = inject(AuthService);
  mode: AuthMode = 'login';
  email = '';
  password = '';
  passwordVisible = false;
  toastMessage = '';
  toastVisible = false;

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.mode = data['mode'] === 'register' ? 'register' : 'login';
      this.email = '';
      this.password = '';
      this.passwordVisible = false;
    });
  }

  clearEmail(input: HTMLInputElement): void {
    this.email = '';
    input.focus();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  showMessage(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;
  }

  private readonly router = inject(Router);
  
  async AuthWithGoogle(): Promise<void>{
    const result = await this.auth.signInWithGoogle();

    if (!result.ok) {
      this.showMessage
  (result.error.message);
      return;
    }
    await this.router.navigateByUrl('/home');
  }

  async submit(): Promise<void> {
    const result =
    this.mode === 'register'
      ? await this.auth.signUp(this.email, this.password)
      : await this.auth.signIn(this.email, this.password);

    if (!result.ok) {
      this.showMessage(result.error.message);
      return;
    }
    await this.router.navigateByUrl(this.mode === 'register' ? '/display-name' : '/home');
  }

  async forgotPassword(): Promise<void> {
    await this.router.navigateByUrl('/forgot-password');
  }
}
