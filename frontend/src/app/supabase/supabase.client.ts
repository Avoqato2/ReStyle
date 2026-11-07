import { InjectionToken } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';
import type { Database } from './supabase.types';

export type AppSupabaseClient = SupabaseClient<Database>;

// Sitzung dauerhaft in Capacitor Preferences speichern. localStorage im WebView
// kann iOS bei Speicherdruck leeren (research R1, FR-009).
export const preferencesStorage: SupportedStorage = {
  async getItem(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  },
  async setItem(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  },
  async removeItem(key: string): Promise<void> {
    await Preferences.remove({ key });
  },
};

export function createSupabaseClient(): AppSupabaseClient {
  return createClient<Database>(environment.supabaseUrl, environment.supabase_publishable_key, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      // Callback-URLs löst der AuthService selbst ein (research R2).
      detectSessionInUrl: false,
      storage: preferencesStorage,
    },
  });
}

// Einziger Supabase-Client der App. Tests überschreiben den Token mit einem Mock.
export const SUPABASE_CLIENT = new InjectionToken<AppSupabaseClient>('SUPABASE_CLIENT', {
  providedIn: 'root',
  factory: createSupabaseClient,
});
