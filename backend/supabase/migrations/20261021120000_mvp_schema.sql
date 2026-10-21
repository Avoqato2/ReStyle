-- Schema: profiles, garments, outfits, outfit_items + Storage-Bucket für Kleidungsfotos.
-- Jede Tabelle ist per RLS auf den eingeloggten User begrenzt; anon hat keinen Zugriff.

-- top | bottom | shoes + optionaler zweiter Top-Layer 'outer' (Jacke, Blazer, Mantel über dem Top).
-- Meeting-Entscheidung war "Kategorie Jacke -> zweiter top-Layer". Geht so nicht direkt, weil outfit_items
-- nur ein Garment pro Layer erlaubt (PK outfit_id, layer) und zwei 'top'-Einträge kollidieren würden.
-- Deshalb bekommt die Jacke einen eigenen Layer 'outer'; im Swiper erscheint er trotzdem als zweite Top-Reihe. (oder wie frontend das dann halt macht)
-- 'full_body' (Kleid, Overall) laut Meeting am Montag 19.10.: belegt top + bottom gleichzeitig,
-- ein Outfit hat also entweder full_body oder top/bottom (Trigger bei outfit_items). outer geht mit beiden.
-- Weitere Layer: 'alter type public.garment_layer add value ...' in einer neuen Migration.
-- lieber ergänzen als entfernen, da das Entfernen von Enum-Werten in Postgres nicht so einfach ist.

create type public.garment_layer as enum ('outer', 'top', 'bottom', 'full_body', 'shoes');

-- hoffentlich alles drin, was man so braucht. Wenn nicht, kann man später weitere Kategorien ergänzen.
create type public.garment_category as enum (
  -- outer
  'jacket', 'blazer', 'coat',
  -- top
  't_shirt', 'shirt', 'blouse', 'polo', 'tank_top', 'sweater', 'hoodie', 'cardigan',
  -- bottom
  'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'sweatpants',
  -- full_body
  'dress', 'jumpsuit',
  -- shoes
  'sneakers', 'boots', 'sandals', 'heels', 'dress_shoes',
  'other'
);

-- ungefähr wie zalando lol
create type public.garment_color as enum (
  'black', 'white', 'grey', 'beige', 'brown', 'red', 'pink', 'orange',
  'yellow', 'green', 'blue', 'purple', 'gold', 'silver', 'multicolor'
);

-- eh klar seasons sind drin
create type public.garment_season as enum ('spring', 'summer', 'autumn', 'winter');

-- ungefähr wie zalando aber nicht so viele. Wenn man später weitere Materialien braucht, kann man die Enum ergänzen.
create type public.garment_material as enum (
  'cotton', 'linen', 'wool', 'cashmere', 'silk', 'denim', 'leather', 'faux_leather',
  'suede', 'polyester', 'viscose', 'nylon', 'other'
);


-- profiles (1:1 zu auth.users, wird per Trigger beim Signup angelegt)
-- Eigene Tabelle statt auth.users erweitern: das auth-Schema gehört Supabase, ist nicht über die API
-- erreichbar und soll nicht verändert werden. App-Daten zum User kommen daher in public.profiles.


-- users tabelle
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 50),
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS für unsere User, damit sie nur ihre eigenen Daten sehen und ändern können.
alter table public.profiles enable row level security;

create policy "Users read own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "Users update own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- User darf nur display_name und preferences ändern (SCRUM-62). Supabase gibt authenticated
-- volle Tabellenrechte, daher Update komplett entziehen und nur diese Spalten freigeben.
revoke update on public.profiles from authenticated;
grant update (display_name, preferences) on public.profiles to authenticated;

-- supabase auth trigger - macht man so, damit man beim Signup automatisch ein Profil anlegt.
-- Trigger auf auth.users (Supabase-Tabelle), schreibt nach jedem Signup eine Zeile in profiles.
-- security definer, damit der Trigger trotz RLS in profiles schreiben darf
-- Leerer search_path verhindert search_path-Hijacking.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(new.raw_user_meta_data ->> 'display_name', 50));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Bereits existierende User bekommen ebenfalls ein Profil.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- garments tabelle (einzelne Kleidungsstücke, die der User hochlädt und in Outfits zusammenstellt)
create table public.garments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  image_path text not null,
  layer public.garment_layer not null,
  category public.garment_category not null,
  -- Laut Meeting am Montag 19.10.: Pflicht sind nur Bild, Layer, Kategorie. Rest optional (SCRUM-48/49).
  -- Leeres Array statt null, damit das Frontend keine Null-Checks braucht.
  name text check (char_length(name) <= 100),
  colors public.garment_color[] not null default '{}',
  seasons public.garment_season[] not null default '{}',
  brand text check (char_length(brand) <= 100),
  material public.garment_material,
  size_label text check (char_length(size_label) <= 20),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  -- Ziel für den zusammengesetzten FK aus outfit_items (Layer muss passen)
  unique (id, layer)
);

-- Index für Performance: RLS filtert bei jeder Query nach user_id.
create index garments_user_id_idx on public.garments (user_id);

-- RLS ist wichtig
alter table public.garments enable row level security;

create policy "Users manage own garments"
on public.garments for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- outfits tabelle (Outfits bestehen aus mehreren Garments, die in Outfit_Items zusammengefügt werden)
create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text check (char_length(name) <= 100),
  created_at timestamptz not null default now()
);

-- Index für Performance: RLS filtert bei jeder Query nach user_id.
create index outfits_user_id_idx on public.outfits (user_id);

alter table public.outfits enable row level security;

create policy "Users manage own outfits"
on public.outfits for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- outfit_items (max. ein Garment pro Layer und Outfit, 'outer' ist optional, full_body ersetzt top + bottom)
-- ---------------------------------------------------------------------------

-- Swiper-Konzept: Top und Jacke liegen in getrennten Layern, daher passen beide in ein Outfit.
--
--┌─────────────────────┐
--│  [+ Jacke]           │  ← Chip, nur sichtbar wenn User Jacken hat
--│  ◀  T-Shirt   ▶     │  Top
--│  ◀  Jeans     ▶     │  Bottom
--│  ◀  Sneaker   ▶     │  Shoes (darf kleiner sein)
--│     [Speichern]      │
--└─────────────────────┘
--        ↓ Tap auf "+ Jacke"
--┌─────────────────────┐
--│  ◀  Blazer    ▶  ✕  │  Outer (animiert eingeblendet)
--│  ◀  T-Shirt   ▶     │
--│  ◀  Jeans     ▶     │
--│  ◀ Sneaker ▶        │  Schuhe schrumpfen
--└─────────────────────┘
-- im normalfall bleiben 3 layers, der vierte wird sichtbar wenn man jacke oder so wählt.
-- Wenn man den Layer wieder entfernt ✕ , verschwindet er wieder. (animiert)

create table public.outfit_items (
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  layer public.garment_layer not null,
  garment_id uuid not null,
  primary key (outfit_id, layer),
  -- Garment muss zum Layer passen (Layer eines Garments in einem Outfit ist damit nicht änderbar).
  foreign key (garment_id, layer) references public.garments (id, layer) on delete cascade
);

create index outfit_items_garment_id_idx on public.outfit_items (garment_id);

alter table public.outfit_items enable row level security;

-- Lesen/Ändern/Löschen: Outfit gehört dem User.
-- Schreiben: zusätzlich muss das Garment dem User gehören.
create policy "Users manage items of own outfits"
on public.outfit_items for all
to authenticated
using (
  exists (
    select 1 from public.outfits o
    where o.id = outfit_id and o.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.outfits o
    where o.id = outfit_id and o.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.garments g
    where g.id = garment_id and g.user_id = (select auth.uid())
  )
);

-- full_body schließt top und bottom aus (Meeting am Montag 19.10.).
create function public.check_outfit_layers()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.outfit_items i
    where i.outfit_id = new.outfit_id
      and i.layer <> new.layer
      and (
        (new.layer = 'full_body' and i.layer in ('top', 'bottom'))
        or (new.layer in ('top', 'bottom') and i.layer = 'full_body')
      )
  ) then
    raise exception 'Outfit kann nicht full_body und top/bottom gleichzeitig enthalten';
  end if;
  return new;
end;
$$;

create trigger outfit_items_check_layers
before insert or update on public.outfit_items
for each row execute function public.check_outfit_layers();

-- Wird ein Garment gelöscht, werden alle Outfits mit diesem Garment entfernt (SCRUM-56).
-- Den Hinweis an den User zeigt das Frontend vorher an.
create function public.delete_outfits_with_garment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.outfits o
  using public.outfit_items i
  where i.outfit_id = o.id and i.garment_id = old.id;
  return old;
end;
$$;

create trigger garments_delete_outfits
before delete on public.garments
for each row execute function public.delete_outfits_with_garment();

-- ---------------------------------------------------------------------------
-- Storage: privater Bucket, Dateien liegen unter {user_id}/...
-- ---------------------------------------------------------------------------

-- max. 5 MB pro Bild (SCRUM-63), Fotos werden im Frontend komprimiert (SCRUM-39)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('garments', 'garments', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Users manage own garment images"
on storage.objects for all
to authenticated
using (
  bucket_id = 'garments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'garments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
