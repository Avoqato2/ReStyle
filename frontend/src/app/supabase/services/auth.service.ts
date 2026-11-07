import { Injectable, computed, inject, signal } from '@angular/core';
import type { AuthChangeEvent, AuthResponse, Session, User } from '@supabase/supabase-js';

import { mapAuthError, type AuthError, type AuthResult } from '../../auth/auth-errors';
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

  // --- Übergang: Die folgenden Methoden werden in T024, T029 und T030 durch die
  // Contract-Methoden ersetzt und nur noch vom Integrationstest genutzt. ---

  async signUp(email: string, password: string, displayName?: string): Promise<AuthResult<AuthResponse['data']>> {
    const response = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: displayName ? { display_name: displayName } : undefined },
    });

    if (response.error) {
      return { ok: false, error: this.toError(response.error) };
    }

    return { ok: true, data: response.data };
  }

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

function toAuthUser(user: User): AuthUser {
  return { id: user.id, email: user.email ?? '' };
}
