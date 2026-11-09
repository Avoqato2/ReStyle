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
- `GarmentService` (`frontend/src/app/supabase/services/garment.service.ts`): `getAll`, `getById`, `create`, `update`, `delete`. Fehlt: Storage-Upload, Storage-Delete, Signed URLs.
- `PhotoService` (`frontend/src/app/services/photo.service.ts`): `Camera.takePhoto` → Hintergrund entfernen (`@imgly/background-removal`) → WebP (Qualität 0.6) → lokal in Filesystem + Preferences. Noch kein Upload, keine Galerie-Auswahl.

## Muster
ID vorher per `crypto.randomUUID()` → Pfad `{user_id}/{id}.webp` → Upload → Insert mit `id` + `image_path` → bei Insert-Fehler Datei löschen.

## Offen
- Grid oder Liste: entscheidet Design-Team. Figma-Links fehlen.
- Edge Cases in Confluence leer.
