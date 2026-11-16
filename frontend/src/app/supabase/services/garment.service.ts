import { Injectable, inject } from '@angular/core';

import { SUPABASE_CLIENT } from '../supabase.client';
import type { Tables, TablesInsert, TablesUpdate } from '../supabase.types';

// Dieser Typ beschreibt ein Kleidungsstück, wie es aus der Datenbank gelesen wird.
type Garment = Tables<'garments'>;

// Dieser Typ beschreibt die Daten, die beim Anlegen eines Kleidungsstücks erlaubt sind.
type GarmentInsert = TablesInsert<'garments'>;

// Dieser Typ beschreibt die Daten, die beim Ändern eines Kleidungsstücks erlaubt sind.
type GarmentUpdate = TablesUpdate<'garments'>;

// id und image_path vergibt createWithImage selbst, user_id setzt die DB.
type GarmentInput = Omit<GarmentInsert, 'id' | 'image_path' | 'user_id'>;

const GARMENT_BUCKET = 'garments';

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

  // Löscht ein Kleidungsstück anhand seiner ID.
  async delete(id: string): Promise<void> {
    const response = await this.supabase.from('garments').delete().eq('id', id);

    if (response.error) {
      throw response.error;
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