-- Die fehlenden Farben die auch bei dem Zalando Colorpicker dabei sind, jetzt auch da
alter type public.garment_color add value if not exists 'petrol' before 'multicolor';
alter type public.garment_color add value if not exists 'turquoise' before 'multicolor';
alter type public.garment_color add value if not exists 'olive' before 'multicolor';

-- Für eine schnellere Suche nach Farben und Seasons, die in den Arrays gespeichert sind, werden GIN Indizes erstellt.
-- Die Operationen, die dafür sind, lauten wie folgt:
-- any: ein Wert ist im Arry enthalten zb.: select * from garments where 'black' = any(colors);
--           kommt zurück, wenn das Array colors den Wert 'black' enthält
-- && Überlappungen zwischen zwei Arrays zb.: select * from garments where colors && '{black, white}';
--          kommt zurück, wenn das Array colors mindestens einen Wert aus dem Array '{black, white}' enthält
-- @> Ein Array enthält ein anderes Array zb.: select * from garments where colors @> '{black, white}';
--          kommt zurück, wenn das Array colors alle Werte aus dem Array '{black, white}' enthält

create index garments_colors_idx on public.garments using gin (colors);

alter type public.garment_season add value 'transitional_season';

create index garments_seasons_idx on public.garments using gin (seasons);




-- Die folgende Constraints stellen sicher, dass die Kategorie eines Kleidungsstücks mit dem Layer übereinstimmt.
alter table public.garments
add constraint garments_category_layer_check
check (
  (layer = 'outer' and category in ('jacket', 'blazer', 'coat'))
  or (layer = 'top' and category in ('t_shirt', 'shirt', 'blouse', 'polo', 'tank_top', 'sweater', 'hoodie', 'cardigan'))
  or (layer = 'bottom' and category in ('jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'sweatpants'))
  or (layer = 'full_body' and category in ('dress', 'jumpsuit'))
  or (layer = 'shoes' and category in ('sneakers', 'boots', 'sandals', 'heels', 'dress_shoes'))
  or category = 'other'  -- 'other' darf zu jedem Layer passen
);