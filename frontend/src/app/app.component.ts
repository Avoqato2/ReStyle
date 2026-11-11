import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, type NavigationBehaviorOptions } from '@angular/router';
import { App } from '@capacitor/app';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

import { AuthService, type AuthCallbackEvent } from './supabase/services/auth/auth.service';

interface CallbackTarget {
  url: string;
  extras?: NavigationBehaviorOptions;
}

// Navigation nach Callback-Events (contracts/auth-service.md).
// - `passwordRecovery` im Navigation-State schaltet den recoveryGuard frei.
// - `authError` trägt die fertige Meldung für den Login-Screen.
export function callbackTarget(event: AuthCallbackEvent): CallbackTarget {
  switch (event.type) {
    case 'email_confirmed':
    case 'oauth_signed_in':
      return { url: '/home' };
    case 'email_confirmed_login_required':
      return { url: '/login?hint=confirmed' };
    case 'password_recovery':
      return { url: '/reset-password', extras: { state: { passwordRecovery: true } } };
    case 'oauth_cancelled':
      return { url: '/login' };
    case 'oauth_failed':
      return { url: '/login', extras: { state: { authError: event.error } } };
    case 'link_invalid':
      return event.flow === 'signup'
        ? { url: '/login?hint=link_invalid' }
        : { url: '/auth/forgot-password?hint=link_invalid' };
  }
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    // Einziger appUrlOpen-Listener der App: Deep Links (restyle://auth/callback…)
    // gehen an den AuthService, der den Link einlöst.
    const listener = App.addListener('appUrlOpen', ({ url }) => {
      void this.auth.handleCallbackUrl(url);
    });

    inject(DestroyRef).onDestroy(() => {
      void listener.then((handle) => handle.remove());
    });

    this.auth.callbackEvents.pipe(takeUntilDestroyed()).subscribe((event) => {
      const { url, extras } = callbackTarget(event);
      this.router.navigateByUrl(url, extras).catch((error: unknown) => {
        console.error('Navigation nach Auth-Callback fehlgeschlagen', error);
      });
    });
  }
}