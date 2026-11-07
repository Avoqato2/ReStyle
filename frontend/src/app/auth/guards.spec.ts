import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  Router,
  provideRouter,
  type ActivatedRouteSnapshot,
  type CanActivateFn,
  type RouterStateSnapshot,
  type UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService, type AuthStatus } from '../supabase/services/auth.service';
import { authGuard, guestGuard, recoveryGuard } from './guards';

describe('guards', () => {
  let status: ReturnType<typeof signal<AuthStatus>>;

  beforeEach(() => {
    status = signal<AuthStatus>('initializing');
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { status: status.asReadonly() } }],
    });
  });

  // Führt den Guard aus und sammelt das (asynchrone) Ergebnis.
  function run(guard: CanActivateFn): { result: () => boolean | UrlTree | undefined } {
    let value: boolean | UrlTree | undefined;
    const output = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<boolean | UrlTree>;
    output.subscribe((v) => (value = v));
    TestBed.tick();
    return { result: () => value };
  }

  const url = (tree: unknown) => TestBed.inject(Router).serializeUrl(tree as UrlTree);

  describe('authGuard', () => {
    it('waits while the session is initializing', () => {
      const guard = run(authGuard);

      expect(guard.result()).toBeUndefined();

      status.set('authenticated');
      TestBed.tick();
      expect(guard.result()).toBe(true);
    });

    it('allows access with a session', () => {
      status.set('authenticated');

      expect(run(authGuard).result()).toBe(true);
    });

    it('redirects to the login without a session', () => {
      status.set('unauthenticated');

      expect(url(run(authGuard).result())).toBe('/auth/login');
    });

    it('redirects to the login once initialisation finds no session', () => {
      const guard = run(authGuard);

      status.set('unauthenticated');
      TestBed.tick();

      expect(url(guard.result())).toBe('/auth/login');
    });
  });

  describe('recoveryGuard', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideRouter([
            { path: 'auth/reset-password', canActivate: [recoveryGuard], children: [] },
            { path: 'auth/login', children: [] },
          ]),
          { provide: AuthService, useValue: { status: status.asReadonly() } },
        ],
      });
    });

    async function navigate(state?: Record<string, unknown>): Promise<string> {
      const router = TestBed.inject(Router);
      const navigation = router.navigateByUrl('/auth/reset-password', state ? { state } : undefined);
      TestBed.tick();
      await navigation;
      return router.url;
    }

    it('allows the reset page right after password_recovery', async () => {
      status.set('authenticated');

      expect(await navigate({ passwordRecovery: true })).toBe('/auth/reset-password');
    });

    it('redirects to the login without the recovery state', async () => {
      status.set('authenticated');

      expect(await navigate()).toBe('/auth/login');
    });

    it('redirects to the login without a session', async () => {
      status.set('unauthenticated');

      expect(await navigate({ passwordRecovery: true })).toBe('/auth/login');
    });
  });

  describe('guestGuard', () => {
    it('waits while the session is initializing', () => {
      const guard = run(guestGuard);

      expect(guard.result()).toBeUndefined();

      status.set('unauthenticated');
      TestBed.tick();
      expect(guard.result()).toBe(true);
    });

    it('redirects to home with a session', () => {
      status.set('authenticated');

      expect(url(run(guestGuard).result())).toBe('/home');
    });

    it('allows access without a session', () => {
      status.set('unauthenticated');

      expect(run(guestGuard).result()).toBe(true);
    });
  });
});
