import { Injectable, inject } from '@angular/core';

import { SUPABASE_CLIENT } from '../supabase.client';
import type { Tables, TablesUpdate } from '../supabase.types';

type Profile = Tables<'profiles'>;

// Nur diese Spalten darf der User direkt ändern; avatar_path läuft über uploadAvatar/removeAvatar.
type ProfileUpdate = Pick<TablesUpdate<'profiles'>, 'display_name' | 'preferences' | 'clothing_preference'>;

const AVATAR_BUCKET = 'avatars';
const SIGNED_URL_TTL_SECONDS = 3600;

// Muss zu allowed_mime_types des Buckets passen.
const AVATAR_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  // Lädt das Profil des eingeloggten Users.
  async getOwn(): Promise<Profile> {
    const userId = await this.userId();
    const response = await this.supabase.from('profiles').select('*').eq('id', userId).single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }

  // Ändert das eigene Profil und gibt den aktualisierten Datensatz zurück.
  async update(changes: ProfileUpdate): Promise<Profile> {
    return this.updateOwn(changes);
  }

  // Lädt ein neues Profilbild hoch, speichert den Pfad und entfernt das alte Bild.
  async uploadAvatar(file: Blob): Promise<Profile> {
    const extension = AVATAR_EXTENSIONS[file.type];
    if (!extension) {
      throw new Error(`Dateityp nicht erlaubt: ${file.type || 'unbekannt'}`);
    }

    const current = await this.getOwn();
    // Neuer Dateiname pro Upload, damit gecachte Signed URLs nicht das alte Bild zeigen.
    const path = `${current.id}/${crypto.randomUUID()}.${extension}`;
    const bucket = this.supabase.storage.from(AVATAR_BUCKET);

    // Bytes statt Blob hochladen: storage-js macht aus einem Blob FormData, und das schicken
    // nicht alle fetch-Implementierungen korrekt (z. B. Node im Test, React Native).
    const upload = await bucket.upload(path, await file.arrayBuffer(), { contentType: file.type });
    if (upload.error) {
      throw upload.error;
    }

    let updated: Profile;
    try {
      updated = await this.updateOwn({ avatar_path: path });
    } catch (error) {
      // Keine verwaisten Dateien: neues Bild wieder löschen, Profil bleibt beim alten Bild.
      await bucket.remove([path]);
      throw error;
    }

    if (current.avatar_path) {
      // Fehler hier ignorieren: Profil ist schon korrekt, übrig bleibt höchstens eine alte Datei.
      await bucket.remove([current.avatar_path]);
    }

    return updated;
  }

  // Entfernt das Profilbild: erst Pfad im Profil leeren, dann Datei löschen.
  async removeAvatar(): Promise<Profile> {
    const current = await this.getOwn();
    if (!current.avatar_path) {
      return current;
    }

    const updated = await this.updateOwn({ avatar_path: null });
    await this.supabase.storage.from(AVATAR_BUCKET).remove([current.avatar_path]);

    return updated;
  }

  // Liefert eine zeitlich begrenzte URL zum Anzeigen des Profilbilds (Bucket ist privat).
  async getAvatarUrl(path: string): Promise<string> {
    const response = await this.supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (response.error) {
      throw response.error;
    }

    return response.data.signedUrl;
  }

  private async updateOwn(changes: TablesUpdate<'profiles'>): Promise<Profile> {
    const userId = await this.userId();
    const response = await this.supabase.from('profiles').update(changes).eq('id', userId).select().single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }

  private async userId(): Promise<string> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) {
      throw error;
    }
    if (!data.session) {
      throw new Error('Nicht eingeloggt');
    }
    return data.session.user.id;
  }
}
