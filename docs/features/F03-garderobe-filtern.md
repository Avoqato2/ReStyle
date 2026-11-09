# F03 Garderobe filtern · SCRUM-43 · MVP
Braucht F02. Filterlogik so bauen, dass F04 sie wiederverwendet.

## Stories
- Nur Winterjacken sehen. Alle blauen Oberteile sehen.
- Nach Kleidungsstücken suchen.
- Mehrere Filter kombinieren und zurücksetzen.

## Akzeptanz
- [ ] Filter: Kategorie, Layer, Farbe, Saison, Marke, Material, Favoriten
- [ ] Mehrere Filter kombinierbar (UND)
- [ ] Aktive Filter sichtbar, einzeln und gesamt entfernbar
- [ ] Suche
- [ ] Leerzustand mit Hinweis, wenn nichts passt

## Technik
- Serverseitig über Supabase: `.eq()` für Skalare. Arrays (`colors`, `seasons`): `.contains()` = alle Werte, `.overlaps()` = mind. einer. GIN-Indizes vorhanden.
- Marke/Material: Auswahl nur aus Werten, die der User schon verwendet.

## Offen
- `favorite` fehlt im Schema → Favoriten-Filter blockiert.
- Mehrfachauswahl in einem Filter (blau + schwarz): ODER (`overlaps`) oder UND (`contains`)?
- Suche: über welche Felder?
- Figma-Links fehlen.
