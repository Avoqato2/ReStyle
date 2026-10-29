# Feature Specification: F01 Digitale Garderobe

**Feature Branch**: `backend/claude/feat/SCRUM-82-f01-spec`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "F01 Digitale Garderobe – Kleidungsstücke per Kamera oder Galerie
erfassen (Foto, Layer, Kategorie), als Bildergrid anzeigen sowie in einer Detailansicht ansehen,
bearbeiten und löschen. Basis für alle weiteren Features."

## Clarifications

### Session 2026-10-28

- Q: Wie wird eine Layer-Änderung bei Teilen behandelt, die in Outfits verwendet werden? → A:
  Warnen und nach Bestätigung die betroffenen Outfits mitlöschen (analog zum Löschen).
- Q: Was sieht der User, wenn er die Garderobe ohne Internetverbindung öffnet? → A: Die zuletzt
  geladene Garderobe wird nur lesend angezeigt; Anlegen, Bearbeiten und Löschen sind deaktiviert.
- Q: Was passiert, wenn der User den Anlege-Vorgang nach ersten Eingaben abbricht? → A:
  Rückfrage „Änderungen verwerfen?“ nur, wenn bereits Foto, Layer oder Kategorie gesetzt ist;
  sonst Schließen ohne Rückfrage.
- Q: Bleibt der User beim Speichern im Dialog oder kehrt er sofort zum Grid zurück? → A: Der
  Dialog bleibt mit Ladeanzeige gesperrt offen; bei Erfolg zurück zum Grid, bei Fehler bleibt er
  mit Meldung offen.
- Q: Wie sind die Kleidungsstücke im Grid angeordnet? → A: Nach Layer gruppiert mit
  Abschnittsüberschriften, innerhalb der Gruppe neueste zuerst; leere Gruppen ausgeblendet.
- Q: Was sieht der User, während die Garderobe beim Öffnen geladen wird? → A: Die zuletzt
  geladene Garderobe sofort, still im Hintergrund aktualisiert; Platzhalter-Kacheln nur beim
  ersten Laden ohne lokale Kopie.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Kleidungsstück erfassen (Priority: P1)

Ein eingeloggter User fotografiert ein Kleidungsstück mit der Kamera oder wählt ein vorhandenes
Foto aus der Galerie. Anschließend wählt er den Layer (Jacke/Überteil, Oberteil, Unterteil,
Ganzkörper, Schuhe) und eine Kategorie aus einer festen Liste und speichert. Das Kleidungsstück
ist danach Teil seiner digitalen Garderobe.

**Why this priority**: Ohne erfasste Kleidungsstücke gibt es keine Garderobe und keine Grundlage
für Filter, Swiper oder Outfits. Diese Story ist der Einstieg in die gesamte App.

**Independent Test**: Ein User legt ein Kleidungsstück mit Foto, Layer und Kategorie an; nach
dem Speichern ist es dauerhaft vorhanden (auch nach Neustart der App) und gehört nur diesem User.

**Acceptance Scenarios**:

1. **Given** ein eingeloggter User, **When** er ein Foto mit der Kamera aufnimmt, Layer und
   Kategorie wählt und speichert, **Then** ist das Kleidungsstück in seiner Garderobe gespeichert
   und er erhält eine Bestätigung. Während des Speicherns sieht er eine Ladeanzeige und der
   Dialog ist gesperrt; danach kehrt er zum Grid zurück.
2. **Given** ein eingeloggter User, **When** er ein Foto aus der Galerie wählt, Layer und
   Kategorie wählt und speichert, **Then** ist das Kleidungsstück in seiner Garderobe gespeichert.
3. **Given** der Erfassungsdialog ist geöffnet, **When** Foto, Layer oder Kategorie fehlt,
   **Then** ist Speichern nicht möglich und dem User wird angezeigt, welche Angabe fehlt.
4. **Given** der User wählt ein Bild in einem nicht unterstützten Format, **When** er es
   übernehmen will, **Then** wird es abgelehnt und ein verständlicher Hinweis nennt die
   erlaubten Formate (JPEG, PNG, WebP).
5. **Given** der User hat alle Angaben gemacht, **When** das Speichern fehlschlägt (z. B. keine
   Verbindung), **Then** erhält er eine Fehlermeldung, seine Eingaben bleiben im Dialog erhalten
   und es existiert kein teilweise angelegtes Kleidungsstück.
6. **Given** der User hat der App den Kamerazugriff verweigert, **When** er die Kamera nutzen
   will, **Then** erhält er einen Hinweis und kann weiterhin ein Foto aus der Galerie wählen.
7. **Given** der User hat bereits ein Foto aufgenommen oder Layer/Kategorie gewählt, **When** er
   die Erfassung abbricht, **Then** wird er gefragt, ob die Eingaben verworfen werden sollen;
   nur nach Bestätigung wird der Dialog ohne Speichern geschlossen.
8. **Given** der Erfassungsdialog ist ohne Eingaben geöffnet, **When** der User abbricht,
   **Then** schließt der Dialog sofort ohne Rückfrage.

---

### User Story 2 - Garderobe als Bildergrid ansehen (Priority: P1)

Ein eingeloggter User öffnet seine Garderobe und sieht alle eigenen Kleidungsstücke als Raster
aus Vorschaubildern, nach Layer gruppiert. Ist die Garderobe leer, sieht er einen Hinweis mit einer Aktion, um das
erste Kleidungsstück hinzuzufügen.

**Why this priority**: Der Überblick über die eigene Garderobe ist der zentrale Nutzen von F01
und der Ausgangspunkt für Detailansicht, Filter (F03) und Outfits (F04/F05).

**Independent Test**: Mit vorbereiteten Kleidungsstücken zweier User wird geprüft, dass jeder
User genau seine eigenen Teile im Grid sieht und eine leere Garderobe den Hinweis zeigt.

**Acceptance Scenarios**:

1. **Given** ein User mit mehreren Kleidungsstücken, **When** er die Garderobe öffnet, **Then**
   sieht er alle seine Kleidungsstücke als Vorschaubilder im Grid, nach Layer gruppiert und
   innerhalb jeder Gruppe neueste zuerst; Layer ohne Teile erscheinen nicht.
2. **Given** ein User ohne Kleidungsstücke, **When** er die Garderobe öffnet, **Then** sieht er
   einen Hinweis auf die leere Garderobe und eine Aktion, die direkt zur Erfassung führt.
3. **Given** zwei User mit jeweils eigenen Kleidungsstücken, **When** einer von ihnen die
   Garderobe öffnet, **Then** sieht er keine Kleidungsstücke des anderen Users.
4. **Given** der User hat gerade ein Kleidungsstück gespeichert, **When** er zur Garderobe
   zurückkehrt, **Then** ist das neue Teil ohne manuelles Aktualisieren sichtbar.
5. **Given** die Garderobe kann nicht geladen werden und es gibt keine zuletzt geladene
   Garderobe auf dem Gerät, **When** der User sie öffnet, **Then** sieht er eine Fehlermeldung
   mit der Möglichkeit, das Laden erneut zu versuchen.
6. **Given** der User hat keine Internetverbindung und die Garderobe wurde zuvor geladen,
   **When** er sie öffnet, **Then** sieht er die zuletzt geladenen Kleidungsstücke mit einem
   Offline-Hinweis, und Anlegen, Bearbeiten und Löschen sind deaktiviert.
7. **Given** der User öffnet die Garderobe zum ersten Mal auf diesem Gerät, **When** die Daten
   noch geladen werden, **Then** sieht er Platzhalter-Kacheln und noch keinen Leer-Hinweis.
8. **Given** die Garderobe wurde auf dem Gerät schon einmal geladen, **When** der User sie
   erneut öffnet, **Then** sieht er sofort die zuletzt geladenen Teile, und Änderungen aus der
   Aktualisierung erscheinen ohne manuelles Neuladen.

---

### User Story 3 - Kleidungsstück ansehen, bearbeiten und löschen (Priority: P2)

Ein User tippt im Grid auf ein Kleidungsstück und sieht es in einer Detailansicht mit großem
Foto, Layer und Kategorie. Dort kann er Foto, Layer und Kategorie ändern oder das
Kleidungsstück löschen. Ist das Teil in gespeicherten Outfits enthalten, wird er vor dem Löschen
gewarnt, dass diese Outfits mitgelöscht werden, und muss bestätigen.

**Why this priority**: Pflege und Korrektur der Garderobe sind wichtig, aber erst sinnvoll,
wenn Erfassen und Anzeigen funktionieren.

**Independent Test**: Ein vorhandenes Kleidungsstück wird geöffnet, geändert und gespeichert;
ein anderes, in einem Outfit verwendetes Teil wird nach Warnung gelöscht; anschließend sind Teil,
Foto und betroffenes Outfit nicht mehr vorhanden.

**Acceptance Scenarios**:

1. **Given** ein User mit Kleidungsstücken, **When** er ein Teil im Grid antippt, **Then** sieht
   er die Detailansicht mit Foto, Layer und Kategorie.
2. **Given** die Detailansicht, **When** der User Layer, Kategorie oder Foto ändert und speichert,
   **Then** sind die Änderungen in Detailansicht und Grid sichtbar.
3. **Given** die Bearbeitung, **When** der User eine Pflichtangabe entfernt, **Then** ist
   Speichern nicht möglich.
4. **Given** ein Kleidungsstück, das in keinem Outfit enthalten ist, **When** der User Löschen
   wählt und bestätigt, **Then** sind das Kleidungsstück und sein Foto vollständig entfernt.
5. **Given** ein Kleidungsstück, das in einem oder mehreren gespeicherten Outfits enthalten ist,
   **When** der User Löschen wählt, **Then** wird er gewarnt, wie viele Outfits mitgelöscht
   werden, und erst nach ausdrücklicher Bestätigung werden Kleidungsstück, Foto und diese Outfits
   entfernt.
6. **Given** die Löschwarnung, **When** der User abbricht, **Then** bleiben Kleidungsstück und
   Outfits unverändert.
7. **Given** ein Kleidungsstück, das in gespeicherten Outfits enthalten ist, **When** der User
   dessen Layer ändern und speichern will, **Then** wird er gewarnt, wie viele Outfits
   mitgelöscht werden, und erst nach ausdrücklicher Bestätigung werden die Änderung gespeichert
   und diese Outfits gelöscht; bei Abbruch bleiben Kleidungsstück und Outfits unverändert.

---

### Edge Cases

- Der User bricht die Erfassung nach Aufnahme des Fotos ab: Nach Bestätigung der Rückfrage
  (FR-010a) wird nichts gespeichert und die Eingaben werden verworfen.
- Der User bricht die Bearbeitung eines Kleidungsstücks mit ungespeicherten Änderungen ab: Es
  gilt dieselbe Rückfrage; nach Bestätigung bleibt das Kleidungsstück unverändert.
- Das gewählte Foto ist sehr groß (z. B. hochauflösendes Kamerafoto): Es wird vor dem Speichern
  verkleinert; ist es danach weiterhin größer als 5 MB, wird es mit Hinweis abgelehnt.
- Verbindungsabbruch während des Speicherns oder Löschens: Es bleibt kein halb angelegtes oder
  halb gelöschtes Kleidungsstück und kein verwaistes Foto zurück; der User wird informiert.
- Der User tippt mehrfach schnell auf „Speichern“: Es entsteht nur ein Kleidungsstück.
- Das Foto eines Kleidungsstücks kann nicht geladen werden: Im Grid erscheint ein Platzhalter,
  die übrigen Teile werden normal angezeigt.
- Ein User versucht über einen direkten Verweis, ein fremdes Kleidungsstück zu öffnen, zu ändern
  oder zu löschen: Der Zugriff wird verweigert, als existiere das Teil nicht.
- Beim Ersetzen des Fotos in der Bearbeitung schlägt das Speichern fehl: Das bisherige Foto
  bleibt erhalten.
- Das Löschen des letzten Kleidungsstücks führt zur leeren Garderobe mit Hinweis und Aktion.
- Das letzte Teil eines Layers wird gelöscht oder einem anderen Layer zugeordnet: Die nun leere
  Gruppe verschwindet aus dem Grid, das Teil erscheint in seiner neuen Gruppe.
- Die Hintergrund-Aktualisierung schlägt fehl, obwohl eine zuletzt geladene Garderobe angezeigt
  wird: Die angezeigten Teile bleiben sichtbar und ein dezenter Hinweis bietet einen erneuten
  Versuch an; der Vollbild-Fehler aus FR-014 erscheint nicht.
- Die Verbindung bricht ab, während der User die Garderobe ansieht: Die angezeigten Teile
  bleiben sichtbar, Bearbeitungsaktionen werden deaktiviert und ein Offline-Hinweis erscheint.

## Requirements *(mandatory)*

### Functional Requirements

**Erfassen**

- **FR-001**: Users MUST be able to ein Foto für ein neues Kleidungsstück direkt mit der Kamera
  aufnehmen oder aus der Galerie des Geräts wählen.
- **FR-002**: Users MUST für jedes Kleidungsstück genau einen Layer aus der festen Liste wählen:
  Jacke/Überteil, Oberteil, Unterteil, Ganzkörper, Schuhe.
- **FR-003**: Users MUST für jedes Kleidungsstück genau eine Kategorie aus der festen
  Kategorienliste (siehe Key Entities) wählen.
- **FR-004**: System MUST das Speichern verhindern, solange Foto, Layer oder Kategorie fehlt,
  und die fehlende Angabe kenntlich machen.
- **FR-005**: System MUST bei der Erfassung keine weiteren Angaben verlangen; optionale Merkmale
  gehören zu F02.
- **FR-006**: System MUST nur Fotos in den Formaten JPEG, PNG oder WebP akzeptieren und andere
  Formate mit einem Hinweis auf die erlaubten Formate ablehnen.
- **FR-007**: System MUST Fotos vor dem Speichern verkleinern; ein gespeichertes Foto MUST
  höchstens 5 MB groß sein.
- **FR-008**: System MUST ein Kleidungsstück entweder vollständig (Foto und Angaben) oder gar
  nicht speichern; nach einem Fehlschlag darf weder ein Datensatz ohne Foto noch ein Foto ohne
  Datensatz zurückbleiben.
- **FR-008a**: System MUST während des Speicherns eine Ladeanzeige im Dialog zeigen und den
  Dialog bis zum Abschluss für Eingaben, Speichern und Abbrechen sperren. Erst nach
  erfolgreichem Speichern kehrt der User zum Grid zurück, in dem das neue Teil bereits sichtbar
  ist. Dasselbe gilt für das Speichern von Änderungen und für das Löschen.
- **FR-009**: System MUST bei einem fehlgeschlagenen Speichern den Dialog offen lassen, dort eine
  verständliche Fehlermeldung anzeigen und die Eingaben des Users für einen erneuten Versuch
  erhalten.
- **FR-010**: System MUST verhindern, dass mehrfaches Auslösen von „Speichern“ mehrere
  Kleidungsstücke anlegt.
- **FR-010a**: System MUST beim Abbrechen der Erfassung nachfragen, ob die Eingaben verworfen
  werden sollen, sofern bereits Foto, Layer oder Kategorie gesetzt ist; ohne Eingaben MUST der
  Dialog ohne Rückfrage schließen. Wählt der User „Weiter bearbeiten“, bleiben alle Eingaben
  erhalten. Entwürfe werden nicht gespeichert. Dieselbe Regel gilt für ungespeicherte Änderungen
  in der Bearbeitung.

**Anzeigen**

- **FR-011**: System MUST alle Kleidungsstücke des eingeloggten Users als Grid aus
  Vorschaubildern anzeigen, gruppiert nach Layer in der festen Reihenfolge Jacke/Überteil,
  Oberteil, Unterteil, Ganzkörper, Schuhe. Jede Gruppe hat eine Abschnittsüberschrift mit dem
  Layer-Namen; innerhalb einer Gruppe sind die Teile nach Erfassungszeitpunkt sortiert, neueste
  zuerst. Gruppen ohne Kleidungsstücke werden nicht angezeigt.
- **FR-011a**: System MUST beim Öffnen der Garderobe die zuletzt geladene Garderobe des Users
  sofort anzeigen und sie ohne Unterbrechung der Ansicht im Hintergrund aktualisieren. Liegt
  noch keine zuletzt geladene Garderobe auf dem Gerät vor, MUST das Grid bis zum Abschluss des
  Ladens Platzhalter-Kacheln zeigen. Der Hinweis auf eine leere Garderobe (FR-012) erscheint erst,
  wenn das Laden abgeschlossen ist.
- **FR-012**: System MUST bei leerer Garderobe einen Hinweis und eine Aktion anzeigen, die
  direkt zur Erfassung des ersten Kleidungsstücks führt.
- **FR-013**: System MUST neu angelegte, geänderte und gelöschte Kleidungsstücke ohne manuelles
  Aktualisieren im Grid widerspiegeln.
- **FR-014**: System MUST einen Ladefehler der Garderobe als Fehlermeldung mit erneutem Versuch
  anzeigen, wenn keine zuletzt geladene Garderobe auf dem Gerät vorliegt; andernfalls bleiben die
  zuletzt geladenen Teile sichtbar und ein dezenter Hinweis bietet einen erneuten Versuch an.
- **FR-014a**: System MUST ohne Internetverbindung die zuletzt geladene Garderobe des Users
  (Grid und Detailansicht) nur lesend anzeigen und dabei kenntlich machen, dass keine Verbindung
  besteht. Anlegen, Bearbeiten und Löschen MUST offline deaktiviert sein und auf die fehlende
  Verbindung hinweisen. Wurde die Garderobe auf dem Gerät noch nie geladen, gilt FR-014.
- **FR-014b**: System MUST nach Wiederherstellung der Verbindung die Garderobe aktualisieren und
  die Bearbeitungsfunktionen wieder freigeben.

**Detailansicht, Bearbeiten, Löschen**

- **FR-015**: Users MUST be able to ein Kleidungsstück aus dem Grid in einer Detailansicht mit
  Foto, Layer und Kategorie öffnen.
- **FR-016**: Users MUST be able to Foto, Layer und Kategorie eines Kleidungsstücks ändern; für
  die Bearbeitung gelten dieselben Pflicht-, Format- und Größenregeln wie beim Erfassen.
- **FR-016a**: Nach einer Layer-Änderung MUST das System prüfen, ob die
  gewählte Kategorie zum neuen Layer gehört oder „Sonstiges“ ist.
  Bei einer ungültigen Kategorie MUST das System eine neue Auswahl verlangen
  und das Speichern bis zur Auswahl einer gültigen Kategorie verhindern.
- **FR-017**: System MUST beim Ersetzen eines Fotos das alte Foto erst entfernen, wenn die
  Änderung vollständig gespeichert ist.
- **FR-018**: Users MUST be able to ein Kleidungsstück löschen; vor dem Löschen MUST eine
  Bestätigung eingeholt werden.
- **FR-019**: System MUST beim Löschen das Kleidungsstück einschließlich seines Fotos vollständig
  entfernen.
- **FR-020**: System MUST vor dem Löschen eines Kleidungsstücks, das in gespeicherten Outfits
  enthalten ist, warnen und die Anzahl der betroffenen Outfits nennen; erst nach ausdrücklicher
  Bestätigung werden Kleidungsstück, Foto und alle betroffenen Outfits gelöscht.
- **FR-021**: System MUST beim Abbrechen der Löschbestätigung Kleidungsstück und Outfits
  unverändert lassen.
- **FR-022**: System MUST vor dem Speichern einer Layer-Änderung an einem Kleidungsstück, das in
  gespeicherten Outfits enthalten ist, warnen und die Anzahl der betroffenen Outfits nennen; erst
  nach ausdrücklicher Bestätigung werden die Änderung gespeichert und alle betroffenen Outfits
  gelöscht. Bei Abbruch bleiben Kleidungsstück und Outfits unverändert. Änderungen an Foto oder
  Kategorie lösen keine Warnung aus.

**Datenhoheit**

- **FR-023**: System MUST sicherstellen, dass User ausschließlich ihre eigenen Kleidungsstücke
  und Fotos sehen, ändern und löschen können; Zugriffe auf fremde Kleidungsstücke MUST
  verweigert werden.
- **FR-024**: System MUST die Funktionen dieses Features nur eingeloggten Usern zur Verfügung
  stellen.

### Key Entities *(include if feature involves data)*

- **Kleidungsstück**: Ein reales Kleidungsstück eines Users. Pflichtangaben: Foto, Layer,
  Kategorie. Gehört genau einem User und besitzt einen Erfassungszeitpunkt. Weitere Merkmale
  folgen in F02.
- **Foto**: Bild eines Kleidungsstücks (JPEG, PNG oder WebP, höchstens 5 MB nach Verkleinerung).
  Gehört genau zu einem Kleidungsstück und wird mit ihm gelöscht.
- **Layer**: Feste Liste von fünf Ebenen, die bestimmt, wo ein Teil in Outfits eingesetzt wird:
  Jacke/Überteil, Oberteil, Unterteil, Ganzkörper, Schuhe.
- **Kategorie**: Feste Liste, gruppiert nach Layer:
  - Jacke/Überteil: Jacke, Blazer, Mantel
  - Oberteil: T-Shirt, Hemd, Bluse, Polo, Top, Pullover, Hoodie, Cardigan
  - Unterteil: Jeans, Hose, Shorts, Rock, Leggings, Jogginghose
  - Ganzkörper: Kleid, Jumpsuit
  - Schuhe: Sneaker, Stiefel, Sandalen, High Heels, Anzugschuhe
  - Layer-unabhängig: Sonstiges
- **Outfit** (Bezug): Gespeicherte Kombination aus Kleidungsstücken (F04/F05). Für F01 relevant,
  weil das Löschen eines enthaltenen Kleidungsstücks das Outfit mitlöscht.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ein User kann ein neues Kleidungsstück vom Öffnen der Erfassung bis zur
  Speicherbestätigung in unter 60 Sekunden anlegen.
- **SC-002**: Mindestens 90 % der Test-User legen ihr erstes Kleidungsstück beim ersten Versuch
  ohne Hilfe erfolgreich an.
- **SC-003**: Eine Garderobe mit 200 Kleidungsstücken zeigt beim ersten Laden die ersten
  Vorschaubilder innerhalb von 2 Sekunden nach dem Öffnen bei üblicher mobiler Verbindung; bei
  jedem weiteren Öffnen sind die zuletzt geladenen Teile innerhalb von 1 Sekunde sichtbar.
- **SC-004**: In 100 % der getesteten Fehlschläge beim Speichern oder Löschen bleibt kein halb
  angelegtes Kleidungsstück und kein verwaistes Foto zurück.
- **SC-005**: In 100 % der getesteten Zugriffsversuche auf fremde Kleidungsstücke wird der
  Zugriff verweigert.
- **SC-006**: Kein gespeichertes Foto überschreitet 5 MB.

## Assumptions

- Login und Registrierung sind als eigene Story umgesetzt; F01 setzt einen eingeloggten User
  voraus.
- Die Kategorienliste übernimmt den bereits abgestimmten Stand des Datenmodells. Bei der
  Erfassung werden die zum gewählten Layer passenden Kategorien sowie „Sonstiges“ angeboten.
- Die 5-MB-Grenze bezieht sich auf das gespeicherte Foto nach der Verkleinerung. Größere
  Ausgangsbilder werden verkleinert statt abgelehnt.
- Fotos, die die Kamera oder Galerie in einem anderen Format liefert, werden nur akzeptiert,
  wenn sie vor dem Speichern in ein erlaubtes Format überführt werden können; sonst greift FR-006.
- Für Erfassen, Bearbeiten und Löschen ist eine Internetverbindung nötig; offline ist nur das
  Ansehen der zuletzt geladenen Garderobe möglich (FR-014a). Eine Offline-Synchronisierung von
  Änderungen ist nicht Teil von F01.
- Die lokal vorgehaltene Garderobe gehört zum eingeloggten User und wird beim Logout vom Gerät
  entfernt.
- Ein Kleidungsstück hat genau ein Foto; mehrere Fotos pro Teil sind nicht vorgesehen.
- Das Grid zeigt bei großen Garderoben alle Teile, ggf. schrittweise nachgeladen; eine
  Obergrenze für die Anzahl der Kleidungsstücke gibt es in F01 nicht.
- Nicht Teil von F01: optionale Merkmale und automatische Layer-Vorbelegung (F02), Filter (F03),
  Outfits erstellen und verwalten (F04/F05), Hintergrund freistellen und KI-Erkennung (F12).
