-- New Column for notes and favorite TICKET-156
alter table public.outfits
    add COLUMN favorite boolean not null default false,
    add COlUMN notes text check (char_length(notes) <= 1000);