import { Injectable } from '@angular/core';

import { supabaseClient } from '../supabase.client';
import type { Tables, TablesInsert, TablesUpdate } from '../supabase.types';

// Dieser Typ beschreibt ein Kleidungsstück, wie es aus der Datenbank gelesen wird.
type Garment = Tables<'garments'>;

// Dieser Typ beschreibt die Daten, die beim Anlegen eines Kleidungsstücks erlaubt sind.
type GarmentInsert = TablesInsert<'garments'>;

// Dieser Typ beschreibt die Daten, die beim Ändern eines Kleidungsstücks erlaubt sind.
type GarmentUpdate = TablesUpdate<'garments'>;

@Injectable({
  providedIn: 'root',
})
export class GarmentService {
  // Die UI kennt nur diesen Service und muss den Supabase-Client nicht direkt verwenden.
  private readonly supabase = supabaseClient;

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
}