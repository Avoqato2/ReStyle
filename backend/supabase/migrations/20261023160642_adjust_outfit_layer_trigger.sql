-- Erlaubt den direkten Wechsel zwischen full_body und top/bottom.
--
-- Die ursprüngliche Funktion hat beim UPDATE auch die gerade geänderte,
-- alte Zeile als vorhandenen Konflikt betrachtet. Dadurch konnte ein
-- full_body-Eintrag nicht direkt auf top oder bottom geändert werden.
--
-- Diese Migration ersetzt nur die Funktion. Der bereits vorhandene Trigger
-- "outfit_items_check_layers" bleibt bestehen und verwendet automatisch
-- die aktualisierte Funktion.

create or replace function public.check_outfit_layers()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- NEW ist bei INSERT der neue Eintrag und bei UPDATE
  -- der geplante neue Zustand des Eintrags.
  --
  -- Ein Outfit darf entweder full_body oder top/bottom enthalten,
  -- aber niemals full_body zusammen mit top oder bottom.
  if exists (
    select 1
    from public.outfit_items i
    where i.outfit_id = new.outfit_id
      -- Ungültig ist nur full_body zusammen mit top oder bottom.
      and (
        (new.layer = 'full_body' and i.layer in ('top', 'bottom'))
        or
        (new.layer in ('top', 'bottom') and i.layer = 'full_body')
      )
  ) then
    raise exception
      'Outfit kann nicht full_body und top/bottom gleichzeitig enthalten';
  end if;

  -- Die geprüfte Zeile wird an INSERT oder UPDATE zurückgegeben.
  return new;
end;
$$;