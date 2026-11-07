import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, type CanActivateFn } from '@angular/router';
import { filter, map, take, type Observable } from 'rxjs';

import { AuthService, type AuthStatus } from '../supabase/services/auth.service';
import { HOME_URL, LOGIN_URL } from './auth-urls';

// Wartet, bis die gespeicherte Sitzung geladen ist (FR-009b). Muss im
// Injection-Context laufen, was in Guards gegeben ist.
function settledStatus(auth: AuthService): Observable<Exclude<AuthStatus, 'initializing'>> {
  return toObservable(auth.status).pipe(
    filter((status): status is Exclude<AuthStatus, 'initializing'> => status !== 'initializing'),
    take(1),
  );
}

// Geschützte Bereiche: ohne Sitzung → Login.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return settledStatus(auth).pipe(map((status) => (status === 'authenticated' ? true : router.parseUrl(LOGIN_URL))));
};

// Login, Registrierung, Passwort vergessen: mit Sitzung → Garderobe.
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return settledStatus(auth).pipe(map((status) => (status === 'authenticated' ? router.parseUrl(HOME_URL) : true)));
};
