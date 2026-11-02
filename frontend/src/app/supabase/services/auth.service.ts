import { Injectable } from '@angular/core';
import type { AuthResponse, Session } from '@supabase/supabase-js';

import { supabaseClient } from '../supabase.client';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Alle Auth-Aufrufe laufen über denselben zentral erstellten Supabase-Client.
  private readonly supabase = supabaseClient;

  // Registriert einen neuen Benutzer mit E-Mail-Adresse und Passwort.
  async register(email: string, password: string, displayName?: string): Promise<AuthResponse> {
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

    // Fehler werden bewusst weitergegeben, damit die aufrufende UI reagieren kann.
    if (response.error) {
      throw response.error;
    }

    return response;
  }

  // Meldet einen bestehenden Benutzer mit E-Mail-Adresse und Passwort an.
  async login(email: string, password: string): Promise<AuthResponse> {
    // Der Supabase-Client speichert die Session lokal und erneuert sie bei Bedarf.
    const response = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (response.error) {
      throw response.error;
    }

    return response;
  }

  // Liest die aktuell lokal gespeicherte Session aus.
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