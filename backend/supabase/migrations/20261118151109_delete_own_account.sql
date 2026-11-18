-- SCRUM-136: User löscht das eigene Konto.
-- security definer nötig, weil authenticated keine Rechte auf auth.users hat.
-- Daten verschwinden per FK-Cascade: auth.users → profiles → garments/outfits → outfit_items.
-- Storage-Dateien löscht das Frontend vorher (SQL darf storage.objects nicht direkt löschen).
create function public.delete_own_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
