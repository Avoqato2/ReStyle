-- Bugfix: Signup scheitert, wenn der Name länger als 50 Zeichen ist (Check auf profiles.display_name).
-- Die Version aus 20261029161533_display_name_trigger.sql hat das left(…, 50) aus mvp_schema verloren.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        new.raw_user_meta_data->>'display_name',   -- Email-Signup
        new.raw_user_meta_data->>'full_name',      -- Google
        new.raw_user_meta_data->>'name',           -- Google-Fallback
        split_part(new.email, '@', 1)              -- Notnagel: Teil vor dem @
      ),
      50
    )
  );
  return new;
end; $$;
