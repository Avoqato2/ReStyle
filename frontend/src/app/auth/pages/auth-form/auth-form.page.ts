import { Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth-page',
  templateUrl: './auth-form.page.html',
  styleUrls: ['./auth-form.page.scss'],
  standalone: true,
  imports: [RouterLink],
})
export class AuthPage {
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

  showUnavailable(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;
  }

  private readonly router = inject(Router);
  async submit(): Promise<void> {
    await this.router.navigateByUrl(
      this.mode === 'register' ? '/display-name' : '/home',
    );
  }

  async forgotPassword(): Promise<void> {
    await this.router.navigateByUrl('/forgot-password');
  }
}
