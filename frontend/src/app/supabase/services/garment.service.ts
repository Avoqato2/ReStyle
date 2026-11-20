import { Injectable, inject } from '@angular/core';

import { SUPABASE_CLIENT } from '../supabase.client';
import type { Tables, TablesInsert, TablesUpdate } from '../supabase.types';

// Dieser Typ beschreibt ein Kleidungsstück, wie es aus der Datenbank gelesen wird.
export type Garment = Tables<'garments'>;

// Dieser Typ beschreibt die Daten, die beim Anlegen eines Kleidungsstücks erlaubt sind.
export type GarmentInsert = TablesInsert<'garments'>;

// Dieser Typ beschreibt die Daten, die beim Ändern eines Kleidungsstücks erlaubt sind.
type GarmentUpdate = TablesUpdate<'garments'>;

// id und image_path vergibt createWithImage selbst, user_id setzt die DB.
export type GarmentInput = Omit<GarmentInsert, 'id' | 'image_path' | 'user_id'>;

const GARMENT_BUCKET = 'garments';
const SIGNED_URL_TTL_SECONDS = 3600;

// Muss zu allowed_mime_types des Buckets passen.
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable({
  providedIn: 'root',
})
export class GarmentService {
  // Die UI kennt nur diesen Service und muss den Supabase-Client nicht direkt verwenden.
  private readonly supabase = inject(SUPABASE_CLIENT);

  // Lädt alle Kleidungsstücke des aktuell berechtigten Benutzers.
  async getAll(): Promise<Garment[]> {
    const response = await this.supabase.from('garments').select('*');

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }

  // Lädt ein einzelnes Kleidungsstück über seine ID.
  async getById(id: string): Promise<Garment | null> {
    const response = await this.supabase.from('garments').select('*').eq('id', id).maybeSingle();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }

  // Legt ein neues Kleidungsstück an und gibt den erzeugten Datensatz zurück.
  async create(garment: GarmentInsert): Promise<Garment> {
    const response = await this.supabase.from('garments').insert(garment).select().single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }

  // Lädt das Bild nach {user_id}/{id}.{ext} hoch und legt danach den Datensatz an.
  async createWithImage(image: Blob, garment: GarmentInput): Promise<Garment> {
    const extension = IMAGE_EXTENSIONS[image.type];
    if (!extension) {
      throw new Error(`Dateityp nicht erlaubt: ${image.type || 'unbekannt'}`);
    }

    const userId = await this.userId();
    const id = crypto.randomUUID();
    const path = `${userId}/${id}.${extension}`;
    const bucket = this.supabase.storage.from(GARMENT_BUCKET);

    // Bytes statt Blob: storage-js macht aus einem Blob FormData (siehe ProfileService.uploadAvatar).
    const upload = await bucket.upload(path, await image.arrayBuffer(), { contentType: image.type });
    if (upload.error) {
      throw upload.error;
    }

    try {
      return await this.create({ ...garment, id, image_path: path });
    } catch (error) {
      // Keine verwaisten Dateien im Storage.
      await bucket.remove([path]);
      throw error;
    }
  }

  // Ändert ein Kleidungsstück und gibt den aktualisierten Datensatz zurück.
  async update(id: string, changes: GarmentUpdate): Promise<Garment> {
    const response = await this.supabase.from('garments').update(changes).eq('id', id).select().single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }

  // Liefert zeitlich begrenzte URLs für mehrere Bilder in einem Request (Bucket ist privat).
  // Key = image_path. Pfade ohne URL (z. B. Datei fehlt) fehlen im Ergebnis.
  async getImageUrls(paths: string[]): Promise<Record<string, string>> {
    if (paths.length === 0) {
      return {};
    }

    const response = await this.supabase.storage
      .from(GARMENT_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

    if (response.error) {
      throw response.error;
    }

    const urls: Record<string, string> = {};
    for (const entry of response.data) {
      if (entry.path && entry.signedUrl) {
        urls[entry.path] = entry.signedUrl;
      }
    }
    return urls;
  }

  // Liefert die Outfits, die das Kleidungsstück enthalten (für den Hinweis vor dem Löschen).
  async getAffectedOutfitIds(garmentId: string): Promise<string[]> {
    const response = await this.supabase.from('outfit_items').select('outfit_id').eq('garment_id', garmentId);

    if (response.error) {
      throw response.error;
    }

    return response.data.map((item) => item.outfit_id);
  }

  // Löscht ein Kleidungsstück und sein Bild.
  // deleteOutfits = true: alle Outfits damit löschen. false: nur aus den Outfits entfernen,
  // leer gewordene Outfits löscht die DB.
  async delete(id: string, options: { deleteOutfits: boolean }): Promise<void> {
    const response = await this.supabase.rpc('delete_garment', {
      p_garment_id: id,
      p_delete_outfits: options.deleteOutfits,
    });

    if (response.error) {
      throw response.error;
    }

    try {
      await this.supabase.storage.from(GARMENT_BUCKET).remove([response.data]);
    } catch {
      // Datensatz ist schon weg, übrig bleibt höchstens eine verwaiste Datei.
    }
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