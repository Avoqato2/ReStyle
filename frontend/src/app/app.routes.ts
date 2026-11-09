import { Routes } from '@angular/router';

import { guestGuard } from './supabase/services/auth/guards';

export const routes: Routes = [
  {
    path: 'auth/register',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'auth/check-email',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/pages/check-email/check-email.page').then((m) => m.CheckEmailPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    // Nur Web: Ziel der Mail- und Google-Links im Browser (T048), ohne Guard.
    path: 'auth/callback',
    loadComponent: () => import('./auth/pages/callback/callback.page').then((m) => m.CallbackPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
