import { Routes } from '@angular/router';

import { guestGuard } from './supabase/services/auth/guards';

export const routes: Routes = [
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
