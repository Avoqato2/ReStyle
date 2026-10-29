create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',   -- euer Email-Signup
      new.raw_user_meta_data->>'full_name',       -- Google
      new.raw_user_meta_data->>'name',            -- Google-Fallback
      split_part(new.email, '@', 1)               -- Notnagel: Teil vor dem @
    )
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
  