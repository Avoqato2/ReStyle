import { Injectable } from '@angular/core';

import { supabaseClient } from '../supabase.client';
import type { Tables, TablesInsert, TablesUpdate } from '../supabase.types';

// Dieser Typ beschreibt ein Outfit, wie es aus der Datenbank gelesen wird.
type Outfit = Tables<'outfits'>;

// Dieser Typ beschreibt eine Kleidungsstück-Zuordnung innerhalb eines Outfits.
type OutfitItem = Tables<'outfit_items'>;

// Dieser Typ beschreibt die Daten, die beim Anlegen eines Outfits erlaubt sind.
type OutfitInsert = TablesInsert<'outfits'>;

// Dieser Typ beschreibt die Daten, die beim Ändern eines Outfits erlaubt sind.
type OutfitUpdate = TablesUpdate<'outfits'>;

// Beim Speichern werden nur Layer und Kleidungsstück an die Datenbankfunktion übergeben.
type OutfitItemInput = {
  layer: OutfitItem['layer'];
  garment_id: OutfitItem['garment_id'];
};

@Injectable({
  providedIn: 'root',
})
export class OutfitService {
  // Auch die Outfit-Abfragen verwenden denselben zentralen Client.
  private readonly supabase = supabaseClient;

  // Lädt alle Outfits des aktuell berechtigten Benutzers.
  async getAll(): Promise<Outfit[]> {
    const response = await this.supabase.from('outfits').select('*');

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }

  // Lädt ein einzelnes Outfit über seine ID.
  async getById(id: string): Promise<Outfit | null> {
    const response = await this.supabase.from('outfits').select('*').eq('id', id).maybeSingle();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }

  // Lädt die Kleidungsstücke, die einem Outfit zugeordnet sind.
  async getItems(outfitId: string): Promise<OutfitItem[]> {
    const response = await this.supabase.from('outfit_items').select('*').eq('outfit_id', outfitId);

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }

  // Legt ein neues Outfit an und gibt den erzeugten Datensatz zurück.
  async create(outfit: OutfitInsert): Promise<Outfit> {
    const response = await this.supabase.from('outfits').insert(outfit).select().single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }

  // Speichert alle Kleidungsstück-Zuordnungen eines Outfits atomar.
  async saveItems(outfitId: string, items: OutfitItemInput[]): Promise<void> {
    // Die Datenbankfunktion löscht zuerst die alten Zuordnungen und fügt
    // anschließend die neue Auswahl ein. RLS und Datenbank-Trigger prüfen
    // dabei automatisch Benutzer, Layer und full_body-Regeln.
    const response = await this.supabase.rpc('save_outfit', {
      p_outfit_id: outfitId,
      p_outfit_items: items,
    });

    if (response.error) {
      throw response.error;
    }
  }

  // Ändert ein Outfit und gibt den aktualisierten Datensatz zurück.
  async update(id: string, changes: OutfitUpdate): Promise<Outfit> {
    const response = await this.supabase.from('outfits').update(changes).eq('id', id).select().single();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }

  // Löscht ein Outfit anhand seiner ID.
  async delete(id: string): Promise<void> {
    const response = await this.supabase.from('outfits').delete().eq('id', id);

    if (response.error) {
      throw response.error;
    }
  }
}