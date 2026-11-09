# F04 Outfit-Swiper · SCRUM-44 · MVP
Braucht F01 + F02. Basis für F05. User kombiniert Outfits über übereinanderliegende horizontale Karussells, jede Ebene unabhängig swipebar.

## Stories
- Oberteile, Hosen, Schuhe getrennt durchswipen.
- Eine Ebene fixieren, während die anderen weiterlaufen.
- Aktuelle Kombination direkt speichern.

## Akzeptanz
- [ ] Ebenen top, bottom, shoes
- [ ] Jede Ebene zeigt nur Garments mit passendem `layer`
- [ ] Ebenen unabhängig swipebar
- [ ] Ebene fixieren (Lock)
- [ ] Button „Speichern“ → F05
- [ ] Leere Ebene: Hinweis + Teil hinzufügen

## Technik
- Liest `garments` nach `layer`. F03-Filter optional anwendbar.
- Bilder lazy laden, Signed URLs cachen.
- Auswahl lokal halten, erst bei „Speichern“ in die DB (`save_outfit`).
- Confluence nennt Swiper.js: nicht installiert → Lib-Wahl vorher klären.
- DB-Konzept (Kommentar in `20261021120000_mvp_schema.sql`): `outer` als Chip „+ Jacke“ über Top, animiert ein-/ausblendbar. `full_body` ersetzt top + bottom.

## Offen
- UI für `outer` und `full_body` (DB kann beides).
- Shuffle-Button.
- Figma-Links fehlen.
