-- Check for garment_Seasons & garment_Color added
-- so Seasons & Colors has to be one of the available enums

alter table public.garments
    alter column colors drop default,
    add constraint garments_colors_not_empty
        check (cardinality(colors) > 0),
    alter column seasons drop default,
    add constraint garments_seasons_not_empty
        check (cardinality(seasons) > 0);