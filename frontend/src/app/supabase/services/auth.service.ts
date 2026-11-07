import { Injectable, computed, inject, signal } from '@angular/core';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { Subject, type Observable } from 'rxjs';

import { parseCallbackUrl, type ParsedCallback } from '../../auth/auth-callback';
import { authError, mapAuthError, type AuthError, type AuthResult } from '../../auth/auth-errors';
import { LOGIN_URL } from '../../auth/auth-urls';
import { SUPABASE_CLIENT } from '../supabase.client';

export type { AuthError, AuthErrorCode, AuthResult } from '../../auth/auth-errors';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

export type SignOutReason = 'user' | 'expired';

export interface AuthUser {
  id: string;
  email: string;
}

export type GoogleSignInOutcome = 'signed_in' | 'cancelled';

export interface ResendState {
  email: string;
  availableAt: Date;
}

export type AuthCallbackEvent =
  | { type: 'email_confirmed' } // Bestätigt + eingeloggt → Garderobe
  | { type: 'email_confirmed_login_required' } // Bestätigt, aber anderes Gerät → Login mit Hinweis
  | { type: 'password_recovery' } // → /auth/reset-password
  | { type: 'oauth_signed_in' } // Google erfolgreich → Garderobe
  | { type: 'oauth_cancelled' } // Google abgebrochen → Login ohne Meldung (FR-017a)
  | { type: 'oauth_failed'; error: AuthError } // → Login mit Fehlermeldung
  | { type: 'link_invalid'; flow: 'signup' | 'recovery' };

// Service und UI vergleichen Adressen für den Countdown mit derselben Normalisierung.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly router = inject(Router);

  private readonly _status = signal<AuthStatus>('initializing');
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _signOutReason = signal<SignOutReason | null>(null);
  private readonly _signupResend = signal<ResendState | null>(null);
  private readonly _recoveryResend = signal<ResendState | null>(null);

  readonly status = this._status.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._status() === 'authenticated');
  readonly signOutReason = this._signOutReason.asReadonly();
  readonly signupResend = this._signupResend.asReadonly();
  readonly recoveryResend = this._recoveryResend.asReadonly();

  private readonly callbackSubject = new Subject<AuthCallbackEvent>();
  // Ein Event pro eingelöstem Link/Google-Redirect. Navigation übernimmt AppComponent.
  readonly callbackEvents: Observable<AuthCallbackEvent> = this.callbackSubject.asObservable();

  // `appUrlOpen` kann dieselbe URL mehrfach liefern; der Code ist aber nur einmal einlösbar.
  private readonly handledCallbacks = new Map<string, Promise<AuthCallbackEvent>>();

  private readonly inFlight = new Map<string, Promise<unknown>>();

  private readonly signOutCleanups: (() => void | Promise<void>)[] = [];
  // Unterscheidet den eigenen Logout von einem SIGNED_OUT durch abgelaufene Sitzung.
  private ownSignOut = false;

  // Wartet auf Google-Callback oder Schließen des In-App-Browsers.
  private pendingGoogle: ((result: AuthResult<GoogleSignInOutcome>) => void) | null = null;
  private googleCallbackArrived = false;

  constructor() {
    this.supabase.auth.onAuthStateChange((event, session) => this.onAuthStateChange(event, session));
    void this.loadStoredSession();
  }

  // Liest die gespeicherte Sitzung beim App-Start. Bis dahin bleibt der Status
  // `initializing`, damit Guards warten und kein Login aufblitzt (FR-009b).
  private async loadStoredSession(): Promise<void> {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      this.applySession(error ? null : data.session);
    } catch {
      this.applySession(null);
    }
  }

  // Wichtig: Hier keine weiteren Supabase-Aufrufe awaiten, sonst blockiert supabase-js.
  private onAuthStateChange(event: AuthChangeEvent, session: Session | null): void {
    // SIGNED_OUT ohne eigenen signOut(): Refresh fehlgeschlagen oder Sitzung serverseitig
    // beendet (z. B. Passwort-Reset auf anderem Gerät) → Login mit Hinweis (FR-009a).
    const expired = event === 'SIGNED_OUT' && !this.ownSignOut && this._status() !== 'unauthenticated';

    this.applySession(session);

    if (expired) {
      this._signOutReason.set('expired');
      this.navigate(LOGIN_URL);
    }
  }

  private applySession(session: Session | null): void {
    this._user.set(session ? toAuthUser(session.user) : null);
    this._status.set(session ? 'authenticated' : 'unauthenticated');
  }

  // Löst Bestätigungs-, Reset- und Google-Redirects ein (research R2). Wird vom
  // `appUrlOpen`-Listener in AppComponent und von der Web-Route `/auth/callback` aufgerufen.
  // Eine bereits verarbeitete URL liefert das erste Ergebnis erneut, ohne neues Event.
  handleCallbackUrl(url: string): Promise<AuthCallbackEvent> {
    const handled = this.handledCallbacks.get(url);
    if (handled) {
      return handled;
    }

    const callback = parseCallbackUrl(url);
    if (callback?.flow === 'google') {
      // Ab hier darf ein gleichzeitiges browserFinished nicht mehr als Abbruch zählen.
      this.googleCallbackArrived = true;
    }
    const result = this.resolveCallback(callback).then(async (event) => {
      if (callback?.flow === 'google') {
        await this.finishGoogle(event);
      }
      this.callbackSubject.next(event);
      return event;
    });
    this.handledCallbacks.set(url, result);
    return result;
  }

  // Google-Login im In-App-Browser (research R4). Resolved erst nach dem Callback
  // (`signed_in`, Fehler) oder wenn der User den Browser schließt (`cancelled`, FR-017a).
  signInWithGoogle(): Promise<AuthResult<GoogleSignInOutcome>> {
    return this.once('signInWithGoogle', async () => {
      let url: string;
      try {
        const { data, error } = await this.supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: GOOGLE_REDIRECT, skipBrowserRedirect: true },
        });
        if (error || !data.url) {
          return { ok: false, error: googleError(error) };
        }
        url = data.url;
      } catch (error) {
        return { ok: false, error: googleError(error) };
      }

      this.googleCallbackArrived = false;
      const outcome = new Promise<AuthResult<GoogleSignInOutcome>>((resolve) => (this.pendingGoogle = resolve));
      const finished = await Browser.addListener('browserFinished', () => {
        // Auf Android kann browserFinished vor appUrlOpen ankommen, wenn der Redirect
        // die App nach vorne holt. Deshalb kurz auf einen Callback warten.
        setTimeout(() => {
          if (!this.googleCallbackArrived) {
            this.settleGoogle({ ok: true, data: 'cancelled' });
          }
        }, GOOGLE_CANCEL_GRACE_MS);
      });

      try {
        await Browser.open({ url });
      } catch (error) {
        this.settleGoogle({ ok: false, error: googleError(error) });
      }

      const result = await outcome;
      await finished.remove();
      return result;
    });
  }

  // Erst das Ergebnis festlegen, dann den Browser schließen: close() kann selbst
  // browserFinished auslösen.
  private async finishGoogle(event: AuthCallbackEvent): Promise<void> {
    switch (event.type) {
      case 'oauth_signed_in':
        this.settleGoogle({ ok: true, data: 'signed_in' });
        break;
      case 'oauth_cancelled':
        this.settleGoogle({ ok: true, data: 'cancelled' });
        break;
      case 'oauth_failed':
        this.settleGoogle({ ok: false, error: event.error });
        break;
    }

    try {
      await Browser.close();
    } catch {
      // Auf manchen Plattformen ist der Browser schon geschlossen.
    }
  }

  private settleGoogle(result: AuthResult<GoogleSignInOutcome>): void {
    const resolve = this.pendingGoogle;
    this.pendingGoogle = null;
    resolve?.(result);
  }

  private async resolveCallback(callback: ParsedCallback | null): Promise<AuthCallbackEvent> {
    // Ohne gültigen flow lässt sich der Link keinem Ablauf zuordnen.
    if (!callback) {
      return { type: 'link_invalid', flow: 'signup' };
    }

    const { flow } = callback;

    if (callback.error) {
      if (flow !== 'google') {
        return { type: 'link_invalid', flow };
      }
      // Google meldet einen Abbruch im Zustimmungsdialog als `access_denied`.
      return callback.error.name === 'access_denied'
        ? { type: 'oauth_cancelled' }
        : { type: 'oauth_failed', error: authError('oauth_failed') };
    }

    const exchange = callback.code ? await this.exchangeCode(callback.code) : { ok: false as const };

    if (exchange.ok) {
      switch (flow) {
        case 'signup':
          return { type: 'email_confirmed' };
        case 'recovery':
          return { type: 'password_recovery' };
        case 'google':
          return { type: 'oauth_signed_in' };
      }
    }

    switch (flow) {
      // Supabase bestätigt die Adresse schon beim Öffnen des Links. Scheitert nur der
      // Code-Tausch (z. B. Link auf anderem Gerät, PKCE-Verifier fehlt), ist sie trotzdem bestätigt.
      case 'signup':
        return callback.code ? { type: 'email_confirmed_login_required' } : { type: 'link_invalid', flow };
      case 'recovery':
        return { type: 'link_invalid', flow };
      case 'google':
        return {
          type: 'oauth_failed',
          error: exchange.error?.code === 'network' ? exchange.error : authError('oauth_failed'),
        };
    }
  }

  private async exchangeCode(code: string): Promise<{ ok: boolean; error?: AuthError }> {
    try {
      const { data, error } = await this.supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) {
        return { ok: false, error: mapAuthError(error) };
      }
      this.applySession(data.session);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: mapAuthError(error) };
    }
  }

  // Registriert mit E-Mail und Passwort und verschickt die Bestätigungsmail.
  // Eine bereits registrierte Adresse liefert denselben Erfolg (FR-006, research R7):
  // Supabase gibt dann einen User ohne Identities und keinen Fehler zurück.
  signUp(email: string, password: string): Promise<AuthResult> {
    return this.once('signUp', () =>
      this.call(() =>
        this.supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: SIGNUP_REDIRECT } }),
      ),
    );
  }

  // Sendet die Bestätigungsmail erneut. `signupResend` startet bei Erfolg und bei
  // `rate_limited` den Countdown für diese Adresse (FR-015, research R8).
  resendConfirmation(email: string): Promise<AuthResult> {
    return this.once('resendConfirmation', async () => {
      const result = await this.call(() =>
        this.supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: SIGNUP_REDIRECT } }),
      );
      if (result.ok || result.error.code === 'rate_limited') {
        this._signupResend.set(nextResend(email));
      }
      return result;
    });
  }

  // Fordert einen Reset-Link an. Unbekannte Adressen und alle anderen Fehler außer
  // Netzwerk und Rate-Limit liefern Erfolg, damit nichts über Accounts verraten wird (FR-011).
  requestPasswordReset(email: string): Promise<AuthResult> {
    return this.once('requestPasswordReset', async () => {
      const result = await this.call(() =>
        this.supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: RECOVERY_REDIRECT }),
      );
      if (!result.ok && result.error.code === 'network') {
        return result;
      }
      // Auch bei verschluckten Fehlern startet der Countdown, sonst wäre der Unterschied sichtbar.
      this._recoveryResend.set(nextResend(email));
      return result.ok || result.error.code === 'rate_limited' ? result : OK;
    });
  }

  // Setzt nach `password_recovery` ein neues Passwort und meldet andere Geräte ab
  // (FR-012, research R9). Die Sitzung auf diesem Gerät bleibt bestehen.
  updatePassword(newPassword: string): Promise<AuthResult> {
    return this.once('updatePassword', async () => {
      const result = await this.call(() => this.supabase.auth.updateUser({ password: newPassword }));
      if (!result.ok) {
        return result;
      }

      try {
        await this.supabase.auth.signOut({ scope: 'others' });
      } catch {
        // Das neue Passwort gilt bereits; andere Sitzungen laufen spätestens beim nächsten Refresh ab.
      }
      return OK;
    });
  }

  // Führt einen Supabase-Auth-Aufruf aus und wandelt Fehler (zurückgegeben oder geworfen) in AuthResult.
  private async call(run: () => Promise<{ error: unknown }>): Promise<AuthResult> {
    try {
      const { error } = await run();
      return error ? fail(error) : OK;
    } catch (error) {
      return fail(error);
    }
  }

  // Mehrfachaufrufe derselben Methode während eines laufenden Aufrufs teilen sich
  // ein Promise (contracts/auth-service.md, FR-009b).
  private once<T>(method: string, run: () => Promise<T>): Promise<T> {
    const running = this.inFlight.get(method) as Promise<T> | undefined;
    if (running) {
      return running;
    }

    const promise = run().finally(() => this.inFlight.delete(method));
    this.inFlight.set(method, promise);
    return promise;
  }

  // Login mit E-Mail und Passwort. Falsche Daten und unbekannte Adresse liefern
  // dieselbe neutrale Meldung (FR-008).
  signIn(email: string, password: string): Promise<AuthResult> {
    return this.once('signIn', async () => {
      try {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          return fail(error);
        }
        this.applySession(data.session);
        this._signOutReason.set(null);
        return OK;
      } catch (error) {
        return fail(error);
      }
    });
  }

  // Logout nur auf diesem Gerät, danach Cleanup-Hooks und Login (FR-010, research R9).
  signOut(): Promise<void> {
    return this.once('signOut', async () => {
      this.ownSignOut = true;
      try {
        await this.supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Lokal trotzdem abmelden; der Server-Logout ist für scope 'local' nicht entscheidend.
      } finally {
        this.ownSignOut = false;
      }

      this.applySession(null);
      this._signOutReason.set('user');
      await this.runSignOutCleanups();
      this.navigate(LOGIN_URL);
    });
  }

  // Features mit lokalen Daten (z. B. F01-Garderobe-Cache) räumen nach dem Logout auf.
  registerSignOutCleanup(fn: () => void | Promise<void>): void {
    this.signOutCleanups.push(fn);
  }

  private async runSignOutCleanups(): Promise<void> {
    for (const cleanup of this.signOutCleanups) {
      try {
        await cleanup();
      } catch (error) {
        console.error('Sign-out-Cleanup fehlgeschlagen', error);
      }
    }
  }

  private navigate(url: string): void {
    this.router.navigateByUrl(url).catch((error: unknown) => {
      console.error(`Navigation nach ${url} fehlgeschlagen`, error);
    });
  }
}

const CALLBACK_URL = 'restyle://auth/callback';
export const SIGNUP_REDIRECT = `${CALLBACK_URL}?flow=signup`;
export const RECOVERY_REDIRECT = `${CALLBACK_URL}?flow=recovery`;
export const GOOGLE_REDIRECT = `${CALLBACK_URL}?flow=google`;

// Wartezeit nach browserFinished, bevor die Google-Anmeldung als abgebrochen gilt.
export const GOOGLE_CANCEL_GRACE_MS = 1000;

function googleError(error: unknown): AuthError {
  const mapped = mapAuthError(error);
  return mapped.code === 'network' ? mapped : authError('oauth_failed');
}

const OK: AuthResult = { ok: true, data: undefined };

// Mindestabstand zwischen zwei Mails an dieselbe Adresse (`max_frequency = "60s"`).
export const RESEND_COOLDOWN_MS = 60_000;

function nextResend(email: string): ResendState {
  return { email: normalizeEmail(email), availableAt: new Date(Date.now() + RESEND_COOLDOWN_MS) };
}

function fail(error: unknown): { ok: false; error: AuthError } {
  return { ok: false, error: mapAuthError(error) };
}

function toAuthUser(user: User): AuthUser {
  return { id: user.id, email: user.email ?? '' };
}
