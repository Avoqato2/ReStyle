import { Routes } from '@angular/router';
import { TabsPage } from './pages/tabs/tabs.page';
//import { guestGuard } from './supabase/services/auth/guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login', // Oder '/tabs/home', falls man ohne Login starten soll
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'styling',
        loadComponent: () => import('./pages/styling/styling.page').then((m) => m.StylingPage),
      },
      {
        path: 'garderobe',
        loadComponent: () => import('./pages/garderobe/garderobe.page').then((m) => m.GarderobePage),
      },
      {
        path: 'looks',
        loadComponent: () => import('./pages/looks/looks.page').then((m) => m.LooksPage),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    // Nur Web: Ziel der Mail- und Google-Links im Browser (T048), ohne Guard.
    path: 'auth/callback',
    loadComponent: () => import('./pages/auth/callback/callback.page').then((m) => m.CallbackPage),
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
