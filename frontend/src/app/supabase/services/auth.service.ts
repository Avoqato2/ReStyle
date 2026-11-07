import { Injectable, computed, inject, signal } from '@angular/core';
import type { AuthChangeEvent, AuthResponse, Session, User } from '@supabase/supabase-js';
import { Subject, type Observable } from 'rxjs';

import { parseCallbackUrl, type ParsedCallback } from '../../auth/auth-callback';
import { authError, mapAuthError, type AuthError, type AuthResult } from '../../auth/auth-errors';
import { SUPABASE_CLIENT } from '../supabase.client';

export type { AuthError, AuthErrorCode, AuthResult } from '../../auth/auth-errors';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

export type SignOutReason = 'user' | 'expired';

export interface AuthUser {
  id: string;
  email: string;
}

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
  private onAuthStateChange(_event: AuthChangeEvent, session: Session | null): void {
    this.applySession(session);
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

    const result = this.resolveCallback(parseCallbackUrl(url)).then((event) => {
      this.callbackSubject.next(event);
      return event;
    });
    this.handledCallbacks.set(url, result);
    return result;
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
    return this.once('signUp', async () => {
      try {
        const { error } = await this.supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: SIGNUP_REDIRECT },
        });
        return error ? fail(error) : OK;
      } catch (error) {
        return fail(error);
      }
    });
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

  // --- Übergang: Die folgenden Methoden werden in T029 und T030 durch die
  // Contract-Methoden ersetzt und nur noch vom Integrationstest genutzt. ---

  async signIn(email: string, password: string): Promise<AuthResult<AuthResponse['data']>> {
    const response = await this.supabase.auth.signInWithPassword({ email, password });

    if (response.error) {
      return { ok: false, error: this.toError(response.error) };
    }

    return { ok: true, data: response.data };
  }

  async getSession(): Promise<Session | null> {
    const response = await this.supabase.auth.getSession();

    if (response.error) {
      throw response.error;
    }

    return response.data.session;
  }

  async logout(): Promise<void> {
    const response = await this.supabase.auth.signOut();

    if (response.error) {
      throw response.error;
    }
  }

  private toError(error: unknown): AuthError {
    return mapAuthError(error);
  }
}

const CALLBACK_URL = 'restyle://auth/callback';
export const SIGNUP_REDIRECT = `${CALLBACK_URL}?flow=signup`;

const OK: AuthResult = { ok: true, data: undefined };

function fail(error: unknown): { ok: false; error: AuthError } {
  return { ok: false, error: mapAuthError(error) };
}

function toAuthUser(user: User): AuthUser {
  return { id: user.id, email: user.email ?? '' };
}
