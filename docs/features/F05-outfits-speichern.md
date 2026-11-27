# F05 Outfits speichern · SCRUM-45 · MVP
Braucht F04. Basis für spätere Empfehlungen und Social.

## Stories
- Aktuelles Swiper-Outfit unter einem Namen speichern.
- Gespeicherte Outfits als Liste sehen und öffnen.
- Outfit umbenennen oder löschen.

## Akzeptanz
- [ ] Speichern aus dem Swiper mit Namensdialog (`name` in DB optional)
- [ ] Genau ein Teil je Layer (PK erzwingt)
- [ ] Liste aller Outfits mit Bildvorschau
- [ ] Outfit öffnen lädt die Kombination in den Swiper
- [ ] Umbenennen, Löschen
- [ ] Favoriten, Sortierung
- [ ] Enthaltenes Garment gelöscht → Outfit weg (Trigger), vorher Alert

## Ist-Stand
- `OutfitService` (`frontend/src/app/supabase/services/outfit.service.ts`): `getAll`, `getById`, `getItems`, `create`, `saveItems` (RPC `save_outfit`), `update`, `setFavorite`, `delete`.
- `getAll` sortiert Favoriten zuerst, danach neueste zuerst.
- Neues Outfit = `create` + `saveItems`. Nicht atomar: schlägt `saveItems` fehl, Outfit wieder löschen.
- Liste inkl. Teile in einem Request: `.select('id, name, created_at, outfit_items(layer, garments(*))')`
- `outfits.favorite` (bool, Default `false`) und `outfits.notes` (≤1000) seit SCRUM-156. UI fehlt noch.

## Offen
- Vorschau laut Confluence 3 Bilder, mit `outer`/`full_body` sind es 2–4.
- Figma-Links fehlen.
