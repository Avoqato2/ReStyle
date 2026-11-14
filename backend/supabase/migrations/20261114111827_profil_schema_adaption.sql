-- SCRUM-124: Profilbild + Kleidungsart-Präferenz in profiles.

create type public.clothing_preference as enum ('womenswear', 'menswear', 'unisex');

-- beide optional: bleiben leer, bis der User sie setzt (Signup-Trigger bleibt unverändert)
alter table public.profiles
  add column avatar_path text,
  add column clothing_preference public.clothing_preference;

-- Spalten-Grant aus mvp_schema erweitern, sonst darf authenticated die neuen Spalten nicht ändern
grant update (avatar_path, clothing_preference) on public.profiles to authenticated;

-- Storage: privater Bucket für Profilbilder, gleiche Regeln wie 'garments', Pfad {user_id}/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Users manage own avatar images"
on storage.objects for all
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
