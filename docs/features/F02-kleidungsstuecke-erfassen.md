# F02 Kleidungsstücke erfassen · SCRUM-42 · MVP
Braucht F01. Merkmale sind Basis für F03, F04 und spätere Empfehlungen. MVP: manuell per Formular.

## Stories
- Beim Anlegen Art des Teils angeben (z. B. Hemd), damit es im richtigen Swiper-Layer landet.
- Farbe, Saison, Marke, Material eintragen, um später zu filtern.
- Default-Name automatisch, damit nicht jedes Teil benannt werden muss.
- Nur das Nötigste ausfüllen, Rest später ergänzen.

## Akzeptanz
- [ ] Pflicht: Bild, Layer, Kategorie. Speichern ohne Pflichtfelder nicht möglich
- [ ] Optional: Name, Farben (mehrere), Saisons (mehrere), Marke (Freitext), Material, Größe (`size_label`), Notiz
- [ ] Kategorie bestimmt den Layer
- [ ] Kategorie, Farbe, Saison, Material nur aus fester Liste (Enums in AGENTS.md)
- [ ] Ohne Namen: `<Marke> <Farbe> <Kategorie> <Nummer>`, bei mehreren Farben die erste. Name später editierbar

## UI-Labels
Layer: outer Jacken & Mäntel · top Oberteile · bottom Unterteile · full_body Einteiler · shoes Schuhe
Kategorie: t_shirt T-Shirt · shirt Hemd · blouse Bluse · polo Poloshirt · tank_top Tanktop · sweater Pullover · hoodie Hoodie · cardigan Strickjacke · jeans Jeans · trousers Hose · shorts Shorts · skirt Rock · leggings Leggings · sweatpants Jogginghose · sneakers Sneaker · boots Stiefel · sandals Sandalen · heels Schuhe mit Absatz · dress_shoes Elegante Schuhe · jacket Jacke · blazer Blazer · coat Mantel · dress Kleid · jumpsuit Jumpsuit/Overall · other Sonstiges
Saison: `transitional_season` = Übergangszeit (z. B. dünne Jacke)

## Offen
- Confluence: Layer überschreibbar. DB-Check erzwingt Kategorie↔Layer, frei nur bei `other`.
- `all_year` fehlt im Enum, `favorite` fehlt in `garments` (Confluence will beides).
- Default-Name: Verhalten ohne Marke/Farbe und Bedeutung von `<Nummer>` unklar.
- Figma-Links fehlen.
