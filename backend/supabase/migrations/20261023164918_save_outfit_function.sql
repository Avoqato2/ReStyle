-- Speichert den lokalen Outfit-Entwurf in einem einzigen Datenbankaufruf.
--
-- Das Frontend kann während der Auswahl lokal arbeiten. Erst beim Klick
-- auf "Speichern" werden die ausgewählten garment_id-Werte übergeben.
-- Die Datenbank ersetzt dann alle outfit_items dieses Outfits atomar.

create or replace function public.save_outfit(
  p_outfit_id uuid,
  p_outfit_items jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Alle bisherigen Zuordnungen entfernen. Die Tabelle speichert nur
  -- die Verbindung outfit_id + layer + garment_id, nicht die Kleidungsdaten.
  delete from public.outfit_items
  where outfit_id = p_outfit_id;

  -- p_outfit_items erwartet ein JSON-Array wie:
  -- [
  --   {"layer": "top", "garment_id": "uuid"},
  --   {"layer": "bottom", "garment_id": "uuid"}
  -- ]
  --
  -- Der Trigger prüft jede eingefügte Zeile. RLS prüft zusätzlich,
  -- ob das Outfit und alle Kleidungsstücke dem eingeloggten User gehören.
  insert into public.outfit_items (outfit_id, layer, garment_id)
  select
    p_outfit_id,
    outfit_item.layer,
    outfit_item.garment_id
  from jsonb_to_recordset(p_outfit_items) as outfit_item(
    layer public.garment_layer,
    garment_id uuid
  );
end;
$$;

-- Nur eingeloggte Benutzer dürfen diese Funktion über die API aufrufen.
grant execute on function public.save_outfit(
  uuid,
  jsonb
) to authenticated;