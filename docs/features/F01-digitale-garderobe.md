# F01 Digitale Garderobe · SCRUM-35 · MVP
Braucht F00. Basis für F02–F05. User baut eine digitale Kopie seines Kleiderschranks.

## Stories
- Kleidungsstück fotografieren oder aus der Galerie wählen.
- Alle Teile in einer Übersicht sehen.
- Teil bearbeiten oder löschen.

## Akzeptanz
- [ ] Foto via Kamera oder Galerie (Capacitor Camera)
- [ ] Bild komprimiert als Datei in Bucket `garments` (`{user_id}/…`), Datensatz in `garments`
- [ ] Übersicht als Grid mit Bildern (Signed URLs)
- [ ] Detailansicht mit Bearbeiten und Löschen
- [ ] Löschen entfernt auch das Bild aus Storage. Vorher Hinweis, dass betroffene Outfits mitgelöscht werden
- [ ] User sieht nur eigene Teile (RLS)

## Ist-Stand
- `GarmentService` (`frontend/src/app/supabase/services/garment.service.ts`): `getAll`, `getById`, `create`, `createWithImage` (Upload + Insert), `update`, `delete(id, { deleteOutfits })` (RPC `delete_garment` + Bild löschen), `getAffectedOutfitIds`, `getImageUrls` (Signed URLs). Fehlt: Bild austauschen.
- `PhotoService` (`frontend/src/app/services/photo.service.ts`): `Camera.takePhoto` → Hintergrund entfernen (`@imgly/background-removal`) → WebP (Qualität 0.6) → lokal in Filesystem + Preferences. Noch kein Upload, keine Galerie-Auswahl.

## Muster
ID vorher per `crypto.randomUUID()` → Pfad `{user_id}/{id}.webp` → Upload → Insert mit `id` + `image_path` → bei Insert-Fehler Datei löschen.

## Offen
- Grid oder Liste: entscheidet Design-Team. Figma-Links fehlen.
- Edge Cases in Confluence leer.

## Design: Garment löschen mit Outfit-Auswahl (2026-11-18, `backend/claude/feat/SCRUM-124-garment-image-handling`)

Entscheidung: Beim Löschen eines Garments wählt der User für alle betroffenen Outfits gemeinsam:
- **Outfits mitlöschen:** alle Outfits, die das Garment enthalten, werden gelöscht.
- **Nur Garment entfernen:** Outfits bleiben unvollständig bestehen. Outfits, die dadurch leer würden, werden automatisch gelöscht.

Ersetzt die bisherige Regel aus SCRUM-56 („Garment löschen löscht alle Outfits mit diesem Garment“).
Umfang: Migration + `GarmentService`. Buttons/Dialog sind nicht Teil davon.

### Datenbank
- Trigger `garments_delete_outfits` bleibt, Funktion `delete_outfits_with_garment()` löscht nur noch Outfits,
  deren einziges Item das Garment ist. Restliche Items entfernt der bestehende FK `on delete cascade`.
  Gilt für jeden Löschweg, also auch für direktes `delete` auf `garments`.
- Neue RPC `delete_garment(p_garment_id uuid, p_delete_outfits boolean) returns text`
  (`security invoker`, `search_path = ''`, nur `authenticated`):
  bei `true` zuerst alle Outfits mit dem Garment löschen, dann das Garment. Atomar.
  Gibt `image_path` zurück. Garment nicht gefunden (oder fremd, RLS) → Fehler.
- Verworfen: Aufräumen leerer Outfits per Trigger auf `outfit_items`. `save_outfit` löscht zuerst alle Items
  und würde so das Outfit mitlöschen.

### GarmentService
- `getAffectedOutfitIds(garmentId): Promise<string[]>`: Outfits mit diesem Garment, für den Warnhinweis.
- `delete(id, { deleteOutfits })`: ruft `delete_garment`, entfernt danach das Bild aus Storage.
  Fehler beim Bild-Löschen werden ignoriert (Datensatz ist schon weg, übrig bleibt höchstens eine Datei).
- `getImageUrls(paths: string[]): Promise<Record<string, string>>`: Signed URLs (1 h) für Grid/Swiper,
  ein Request per `createSignedUrls`. Leere Liste → `{}` ohne Request.
- Nicht enthalten: Bild eines Garments austauschen (wartet auf Team-Entscheidung, ob „Bearbeiten“ das Bild umfasst).

### Tests
- Vitest für die Service-Methoden.
- Migration: `supabase db reset` + manueller SQL-Check beider Varianten und des Leer-Falls.
