-- seed.sql - Testdaten fuer die lokale Entwicklung.
-- Laeuft automatisch bei jedem 'supabase db reset', nach allen Migrations.
-- NUR lokal, nie in Produktion. Die Daten dienen zum Entwickeln und Testen der RLS.
--
-- Inhalt: zwei Test-User (Anna mit voller Garderobe, Ben mit wenigen Teilen),
-- damit man sieht, dass die RLS greift (Ben darf Annas Sachen nicht sehen).
-- Beide User-Passwoerter: password123

-- pgcrypto liefert crypt()/gen_salt() zum Hashen der Passwoerter.
-- 'if not exists', damit ein erneutes Ausfuehren nicht fehlschlaegt.
create extension if not exists pgcrypto;

-- ===========================================================================
-- TEST-USER (auth.users)
-- ===========================================================================
-- Wir schreiben direkt in auth.users. Das ist normalerweise tabu (das auth-Schema
-- gehoert Supabase), im lokalen Seed als Superuser aber ok und der uebliche Weg,
-- um Test-User mit bekanntem Passwort anzulegen.
--
-- Wichtig:
--  - encrypted_password: crypt('password123', gen_salt('bf')) hasht mit bcrypt.
--    Klartext steht nie in der DB; beim Login hasht Supabase die Eingabe und vergleicht.
--  - email_confirmed_at = now(): markiert die Mail als bestaetigt, sonst kein Login lokal.
--  - raw_user_meta_data.display_name: wird vom handle_new_user-Trigger ausgelesen
--    und ins profiles.display_name geschrieben. Deshalb legen wir profiles NICHT
--    manuell an - der Trigger macht das automatisch bei diesem Insert.
--  - die *_token-Spalten auf '' (leer) statt null, weil manche GoTrue-Versionen
--    bei null hier Fehler werfen.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000',
   'a0000000-0000-0000-0000-000000000001',
   'authenticated','authenticated','anna@test.local',
   crypt('password123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}','{"display_name":"Anna"}','','','',''),
  ('00000000-0000-0000-0000-000000000000',
   'b0000000-0000-0000-0000-000000000001',
   'authenticated','authenticated','ben@test.local',
   crypt('password123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}','{"display_name":"Ben"}','','','','');

-- ===========================================================================
-- LOGIN-IDENTITIES (auth.identities)
-- ===========================================================================
-- Fuer E-Mail/Passwort-Login braucht jeder User zusaetzlich eine Identity.
-- Ohne diesen Eintrag schlaegt der Login fehl, obwohl der User in auth.users steht.
--  - identity_data muss 'sub' (= user_id) und 'email' enthalten, das erwartet GoTrue.
--  - provider 'email' = Login per E-Mail/Passwort.
insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values
  (gen_random_uuid(),'a0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   jsonb_build_object('sub','a0000000-0000-0000-0000-000000000001','email','anna@test.local'),
   'email', now(), now(), now()),
  (gen_random_uuid(),'b0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   jsonb_build_object('sub','b0000000-0000-0000-0000-000000000001','email','ben@test.local'),
   'email', now(), now(), now());

-- ===========================================================================
-- ANNAS GARDEROBE
-- ===========================================================================
-- 19 Teile ueber alle 5 Layer (outer, top, bottom, full_body, shoes),
-- verschiedene Farben/Saisons, ein paar Teile bewusst ohne Farbe (leeres Array '{}')
-- oder ohne Marke (null), um diese Faelle im Frontend testen zu koennen.
--
-- Feste UUIDs statt gen_random_uuid(), weil die Outfits weiter unten per ID
-- auf genau diese Garments verweisen muessen (zufaellige IDs waeren nicht referenzierbar).
-- Werte sind englisch, passend zu den Enums (z.B. 'white', nicht 'weiss').
-- image_path sind Fake-Pfade; echte Bilder liegen (noch) nicht im Storage,
-- das Frontend zeigt dann einen Platzhalter.
insert into public.garments (id, user_id, image_path, layer, category, name, colors, seasons, brand, material, size_label) values
  -- OUTER (Jacken/Blazer - optionaler zweiter Top-Layer im Swiper)
  ('a1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','seed/anna/jeansjacke.png','outer','jacket','Jeansjacke','{blue}','{spring,autumn}','Levis','denim','M'),
  ('a1000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','seed/anna/blazer.png','outer','blazer','Schwarzer Blazer','{black}','{autumn,winter}',null,'polyester','M'),
  -- TOP
  ('a1000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001','seed/anna/shirt-weiss.png','top','t_shirt','Weisses Basic-Shirt','{white}','{spring,summer}','Muji','cotton','M'),
  ('a1000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001','seed/anna/shirt-schwarz.png','top','t_shirt','Schwarzes Shirt','{black}','{summer}',null,'cotton','M'), -- ohne Marke
  ('a1000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000001','seed/anna/hemd-blau.png','top','shirt','Blaues Hemd','{blue}','{spring,autumn}','COS','cotton','M'),
  ('a1000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000001','seed/anna/pulli-grau.png','top','sweater','Grauer Pulli','{grey}','{autumn,winter}','Uniqlo','wool','L'),
  ('a1000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000001','seed/anna/bluse-rosa.png','top','blouse','Rosa Bluse','{pink}','{spring,summer}',null,'viscose','S'),
  -- BOTTOM (Teil ..0008 ist die Lieblingsjeans, wird in zwei Outfits genutzt)
  ('a1000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000001','seed/anna/jeans-blau.png','bottom','jeans','Blaue Lieblingsjeans','{blue}','{spring,autumn,winter}','Levis','denim','29'),
  ('a1000000-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000001','seed/anna/jeans-schwarz.png','bottom','jeans','Schwarze Jeans','{black}','{autumn,winter}','Weekday','denim','29'),
  ('a1000000-0000-0000-0000-00000000000a','a0000000-0000-0000-0000-000000000001','seed/anna/chino.png','bottom','trousers','Beige Chino','{beige}','{spring,summer}',null,'cotton','S'),
  ('a1000000-0000-0000-0000-00000000000b','a0000000-0000-0000-0000-000000000001','seed/anna/rock.png','bottom','skirt','Schwarzer Rock','{black}','{summer}','Zara','viscose','S'),
  ('a1000000-0000-0000-0000-00000000000c','a0000000-0000-0000-0000-000000000001','seed/anna/shorts.png','bottom','shorts','Jeansshorts','{blue}','{summer}',null,'denim','29'),
  -- FULL_BODY (Kleid/Overall - belegt top+bottom gleichzeitig)
  ('a1000000-0000-0000-0000-00000000000d','a0000000-0000-0000-0000-000000000001','seed/anna/kleid.png','full_body','dress','Sommerkleid','{}','{summer}',null,'linen','S'), -- ohne Farbe
  ('a1000000-0000-0000-0000-00000000000e','a0000000-0000-0000-0000-000000000001','seed/anna/jumpsuit.png','full_body','jumpsuit','Schwarzer Jumpsuit','{black}','{spring,autumn}','Zara',null,'S'),
  -- SHOES
  ('a1000000-0000-0000-0000-00000000000f','a0000000-0000-0000-0000-000000000001','seed/anna/sneaker-weiss.png','shoes','sneakers','Weisse Sneaker','{white}','{spring,summer,autumn}','Adidas',null,'39'),
  ('a1000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000001','seed/anna/sneaker-schwarz.png','shoes','sneakers','Schwarze Sneaker','{black}','{spring,autumn}',null,null,'39'),
  ('a1000000-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000001','seed/anna/stiefel.png','shoes','boots','Braune Stiefel','{brown}','{autumn,winter}',null,'leather','39'),
  ('a1000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000001','seed/anna/boots.png','shoes','boots','Schwarze Boots','{}','{winter}','Dr Martens','leather','39'), -- ohne Farbe
  ('a1000000-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000001','seed/anna/sneaker-bunt.png','shoes','sneakers','Bunte Sneaker','{red,blue,yellow}','{summer}',null,null,'39');

-- ===========================================================================
-- ANNAS OUTFITS
-- ===========================================================================
-- Drei Outfits. Outfit 1 und 2 nutzen beide die Lieblingsjeans (..0008),
-- um den Mehrfach-Einsatz eines Garments zu testen.
insert into public.outfits (id, user_id, name) values
  ('a2000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','Casual Freitag'),
  ('a2000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','Buero Look'),
  ('a2000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001','Sommer mit Kleid');

-- outfit_items: pro Zeile ein Teil in einem Outfit, zugeordnet ueber den Layer.
-- WICHTIG: der 'layer' hier muss exakt dem Layer des Garments entsprechen,
-- sonst blockt der zusammengesetzte FK (garment_id, layer) -> garments(id, layer).
insert into public.outfit_items (outfit_id, layer, garment_id) values
  -- Outfit 1: klassisch top/bottom/shoes, nutzt die Lieblingsjeans
  ('a2000000-0000-0000-0000-000000000001','top','a1000000-0000-0000-0000-000000000003'),
  ('a2000000-0000-0000-0000-000000000001','bottom','a1000000-0000-0000-0000-000000000008'),
  ('a2000000-0000-0000-0000-000000000001','shoes','a1000000-0000-0000-0000-00000000000f'),
  -- Outfit 2: mit Blazer (outer), DIESELBE Lieblingsjeans
  ('a2000000-0000-0000-0000-000000000002','outer','a1000000-0000-0000-0000-000000000002'),
  ('a2000000-0000-0000-0000-000000000002','top','a1000000-0000-0000-0000-000000000005'),
  ('a2000000-0000-0000-0000-000000000002','bottom','a1000000-0000-0000-0000-000000000008'),
  ('a2000000-0000-0000-0000-000000000002','shoes','a1000000-0000-0000-0000-000000000011'),
  -- Outfit 3: full_body (Kleid) statt top/bottom, plus outer + shoes.
  -- Testet den check_outfit_layers-Trigger (full_body ohne top/bottom ist erlaubt).
  ('a2000000-0000-0000-0000-000000000003','outer','a1000000-0000-0000-0000-000000000001'),
  ('a2000000-0000-0000-0000-000000000003','full_body','a1000000-0000-0000-0000-00000000000d'),
  ('a2000000-0000-0000-0000-000000000003','shoes','a1000000-0000-0000-0000-000000000013');

-- ===========================================================================
-- BENS GARDEROBE
-- ===========================================================================
-- Nur 3 Teile, keine Outfits. Zweck: pruefen, dass Ben per RLS wirklich NUR
-- seine eigenen Teile sieht und nicht Annas 19. Login: ben@test.local / password123
insert into public.garments (id, user_id, image_path, layer, category, name, colors, seasons, brand, material, size_label) values
  ('b1000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','seed/ben/shirt.png','top','t_shirt','Graues Shirt','{grey}','{summer}',null,'cotton','L'),
  ('b1000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','seed/ben/jeans.png','bottom','jeans','Dunkle Jeans','{blue}','{autumn,winter}','Nudie','denim','32'),
  ('b1000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000001','seed/ben/sneaker.png','shoes','sneakers','Weisse Sneaker','{white}','{spring,summer}',null,null,'44');