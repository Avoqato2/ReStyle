import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    // Nur Web: Ziel der Mail- und Google-Links im Browser (T048), ohne Guard.
    path: 'auth/callback',
    loadComponent: () => import('./pages/auth/callback/callback.page').then((m) => m.CallbackPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    data: { mode: 'login' },
    loadComponent: () => import('./pages/auth/auth-form/auth-form.page').then((m) => m.AuthPage),
  },
  {
    path: 'register',
    data: { mode: 'register' },
    loadComponent: () => import('./pages/auth/auth-form/auth-form.page').then((m) => m.AuthPage),
  },
  {
    path: 'display-name',
    loadComponent: () => import('./pages/display-name/display-name.page').then((m) => m.DisplayNamePage),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/auth/reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'password-changed',
    loadComponent: () =>
      import('./pages/auth/password-changed/password-changed.page').then((m) => m.PasswordChangedPage),
  },
  {
    path: 'confirmation-mail',
    loadComponent: () =>
      import('./pages/auth/confirmation-mail/confirmation-mail.page').then((m) => m.ConfirmationMailPage),
  },
];
