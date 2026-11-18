-- SCRUM-124: Garment löschen mit Outfit-Auswahl (Design: docs/features/F01-digitale-garderobe.md).
-- Ersetzt die Regel aus SCRUM-56 ("Garment löschen löscht alle Outfits mit diesem Garment").

-- Trigger garments_delete_outfits bleibt, nur die Funktion ändert sich:
-- Gelöscht werden nur Outfits, die ohne das Garment leer wären.
-- Bei allen anderen Outfits entfernt der FK (on delete cascade) nur das eine Item.
create or replace function public.delete_outfits_with_garment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.outfits o
  where exists (
      select 1 from public.outfit_items i
      where i.outfit_id = o.id and i.garment_id = old.id
    )
    and not exists (
      select 1 from public.outfit_items j
      where j.outfit_id = o.id and j.garment_id <> old.id
    );
  return old;
end;
$$;

-- Löscht ein Garment. p_delete_outfits = true löscht vorher alle Outfits, die es enthalten.
-- Läuft als eine Transaktion. Gibt image_path zurück, damit der Client das Bild aus Storage löschen kann.
create function public.delete_garment(p_garment_id uuid, p_delete_outfits boolean)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_image_path text;
begin
  if p_delete_outfits then
    delete from public.outfits o
    using public.outfit_items i
    where i.outfit_id = o.id and i.garment_id = p_garment_id;
  end if;

  delete from public.garments
  where id = p_garment_id
  returning image_path into v_image_path;

  -- Nicht vorhanden oder fremd (RLS): Exception rollt auch das Outfit-Löschen zurück.
  if v_image_path is null then
    raise exception 'Garment nicht gefunden' using errcode = 'P0002';
  end if;

  return v_image_path;
end;
$$;

revoke execute on function public.delete_garment(uuid, boolean) from public, anon;
grant execute on function public.delete_garment(uuid, boolean) to authenticated;
