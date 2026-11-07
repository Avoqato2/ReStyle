import { Injectable, inject } from '@angular/core';
import type { AuthResponse, Session } from '@supabase/supabase-js';

import { SUPABASE_CLIENT } from '../supabase.client';

// Einheitliche Fehlercodes für die UI. Weitere Fälle aus dem Auth-Spec
// können später ergänzt werden, ohne dass Komponenten Supabase-Fehler kennen.
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'weak_password'
  | 'rate_limited'
  | 'network'
  | 'unknown';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

// Erfolgreiche und fehlgeschlagene Auth-Aufrufe haben immer dieselbe Struktur.
export type AuthResult<T = void> = { ok: true; data: T } | { ok: false; error: AuthError };

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Alle Auth-Aufrufe laufen über denselben zentral erstellten Supabase-Client.
  private readonly supabase = inject(SUPABASE_CLIENT);

  // Ordnet einen Supabase-Fehler einem einfachen UI-Fehler zu.
  private mapError(error: { message: string; code?: string }): AuthError {
    if (error.code === 'invalid_credentials') {
      return { code: 'invalid_credentials', message: 'E-Mail-Adresse oder Passwort ist falsch.' };
    }

    if (error.code === 'email_not_confirmed') {
      return { code: 'email_not_confirmed', message: 'Bitte bestätige zuerst deine E-Mail-Adresse.' };
    }

    if (error.code === 'over_email_send_rate_limit') {
      return { code: 'rate_limited', message: 'Zu viele Versuche. Bitte warte kurz.' };
    }

    if (error.message.toLowerCase().includes('password')) {
      return { code: 'weak_password', message: 'Das Passwort erfüllt die Anforderungen nicht.' };
    }

    if (error.message.toLowerCase().includes('fetch')) {
      return { code: 'network', message: 'Keine Verbindung zum Backend.' };
    }

    return { code: 'unknown', message: 'Die Anmeldung konnte nicht verarbeitet werden.' };
  }

  // Eine vorhandene E-Mail darf bei der Registrierung nicht erkennbar sein.
  private isAlreadyRegisteredError(error: { message: string; code?: string }): boolean {
    const message = error.message.toLowerCase();

    return (
      error.code === 'user_already_exists' ||
      message.includes('already registered') ||
      message.includes('already been registered') ||
      message.includes('user already exists')
    );
  }

  // Registriert einen neuen Benutzer und gibt Fehler als AuthResult zurück.
  async signUp(email: string, password: string, displayName?: string): Promise<AuthResult<AuthResponse['data']>> {
    // Supabase erstellt den Benutzer und liefert bei aktivierter Bestätigung
    // zunächst eventuell noch keine aktive Session zurück.
    const response = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        // Der Datenbank-Trigger übernimmt diesen Wert in public.profiles.
        data: displayName ? { display_name: displayName } : undefined,
      },
    });

    if (response.error) {
      // Laut Auth-Spec wird eine bereits registrierte E-Mail absichtlich
      // genauso behandelt wie eine erfolgreiche Registrierung.
      if (this.isAlreadyRegisteredError(response.error)) {
        return {
          ok: true,
          data: {
            user: null,
            session: null,
          },
        };
      }

      return { ok: false, error: this.mapError(response.error) };
    }

    return { ok: true, data: response.data };
  }

  // Meldet einen bestehenden Benutzer an und gibt Fehler als AuthResult zurück.
  async signIn(email: string, password: string): Promise<AuthResult<AuthResponse['data']>> {
    // Der Supabase-Client speichert die Session lokal und erneuert sie bei Bedarf.
    const response = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (response.error) {
      return { ok: false, error: this.mapError(response.error) };
    }

    return { ok: true, data: response.data };
  }

  // Übergangsmethode für bereits vorhandene Aufrufer.
  // Zukünftig soll die UI direkt signUp() verwenden.
  async register(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    const result = await this.signUp(email, password, displayName);

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    return { data: result.data, error: null };
  }

  // Übergangsmethode für bereits vorhandene Aufrufer.
  // Zukünftig soll die UI direkt signIn() verwenden.
  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await this.signIn(email, password);

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    return { data: result.data, error: null };
  }

  // Prüft, ob noch ein Benutzer eingeloggt ist, zum Beispiel nach einem
  // Seiten-Reload oder bevor ein geschützter Bereich angezeigt wird.
  async getSession(): Promise<Session | null> {
    const response = await this.supabase.auth.getSession();

    if (response.error) {
      throw response.error;
    }

    return response.data.session;
  }

  // Meldet den aktuell angemeldeten Benutzer ab und entfernt die lokale Session.
  async logout(): Promise<void> {
    const response = await this.supabase.auth.signOut();

    if (response.error) {
      throw response.error;
    }
  }
}