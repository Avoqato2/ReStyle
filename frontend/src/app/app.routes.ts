import { Routes } from '@angular/router';

import { guestGuard } from './supabase/services/auth/guards';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('../home/home.page').then((m) => m.HomePage),
  },
  {
    // Nur Web: Ziel der Mail- und Google-Links im Browser (T048), ohne Guard.
    path: 'auth/callback',
    loadComponent: () => import('./auth/pages/callback/callback.page').then((m) => m.CallbackPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
{
  path: 'login',
  data: { mode: 'login' },
  loadComponent: () =>
    import('./auth/pages/auth-form/auth-form.page').then((m) => m.AuthPage),
},
{
  path: 'register',
  data: { mode: 'register' },
  loadComponent: () =>
    import('./auth/pages/auth-form/auth-form.page').then((m) => m.AuthPage),
},
  {
    path: 'display-name',
    loadComponent: () => import('./auth/pages/display-name/display-name.page').then((m) => m.DisplayNamePage),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/pages/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/pages/reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'password-changed',
    loadComponent: () =>
      import('./auth/pages/password-changed/password-changed.page').then((m) => m.PasswordChangedPage),
  },
];
