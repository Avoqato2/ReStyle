import { Routes } from '@angular/router';
import { TabsPage } from './pages/tabs/tabs.page';

export const routes: Routes = [
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
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  }
];
