-- SCRUM-155: Kleidungsstücke als Favorit markieren (Herz-Button).
-- Bestehende Garments sind keine Favoriten. RLS gilt über die bestehende Policy auf garments.
alter table public.garments
  add column favorite boolean not null default false;
