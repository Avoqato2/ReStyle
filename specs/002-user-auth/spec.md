# Feature Specification: F00 Authentifizierung

**Feature Branch**: `backend/claude/feat/SCRUM-83-f02-authspec`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "Auth: Registrierung, Login, E-Mail-Bestätigung, Passwort vergessen,
Google-Login (SCRUM-37). Alle Daten sind userbezogen, ohne Login sieht man nichts.
Voraussetzung für F01."

## Clarifications

### Session 2026-10-29

- Q: Welche Passwortregeln gelten? → A: Mindestens 8 Zeichen, davon mindestens ein Buchstabe und
  eine Ziffer; erfüllte Regeln werden beim Tippen angezeigt.
- Q: Was passiert, wenn ein Bestätigungs- oder Reset-Link am Desktop geöffnet wird? → A: Beides
  nur am Handy; am Desktop erscheint nur ein Hinweis, den Link auf dem Gerät mit der App zu öffnen.
- Q: Wie reagieren Links bei Mehrfachnutzung und erneutem Anfordern? → A: Nur der zuletzt
  gesendete Link gilt; ein bereits genutzter Bestätigungslink zeigt „E-Mail bereits bestätigt“
  und führt zum Login.
- Q: Wie verhält sich die App ohne Internet? → A: Ohne Verbindung zeigt die App nur eine Seite
  „Keine Verbindung“ mit erneutem Versuch, auch für eingeloggte User; die Sitzung bleibt erhalten.
- Q: Was erlebt der User bei abgelaufener oder ungültiger Sitzung? → A: Login mit Hinweis
  „Sitzung abgelaufen, bitte erneut einloggen“; nach dem Login landet er in der Garderobe.
- Q (Planung): Wie lange gelten Bestätigungs- und Reset-Links, wenn nur eine gemeinsame
  Ablaufzeit möglich ist? → A: Beide 1 Stunde.
- Q (Planung): Wie werden Mail-Links technisch zugestellt? → A: Standard-Links des Auth-Anbieters.
  Folge: Am Desktop geöffnet wird ein Bestätigungslink trotzdem wirksam, ein Reset-Link
  verbraucht; ein Hinweis am Desktop ist nicht möglich. Ersetzt die Desktop-Antwort oben.
- Q (Planung): Was zeigt ein ungültiger Bestätigungslink, wenn nicht unterscheidbar ist, ob er
  abgelaufen oder die E-Mail schon bestätigt ist? → A: Kombinierte Meldung „Link ungültig oder
  E-Mail bereits bestätigt“ mit den Aktionen Einloggen und Neue Mail anfordern.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrieren und E-Mail bestätigen (Priority: P1)

Ein neuer User registriert sich mit E-Mail und Passwort. Er sieht einen Hinweis, dass eine
Bestätigungsmail unterwegs ist, und kann sie erneut anfordern. Der Link in der Mail öffnet die
App und bestätigt die Adresse; erst danach kann er sich einloggen.

**Why this priority**: Ohne Account gibt es keine userbezogenen Daten und damit keine Garderobe.

**Independent Test**: Registrierung mit einer neuen Adresse, Login vor Bestätigung schlägt fehl,
nach Antippen des Links ist der User bestätigt und kann sich einloggen.

**Acceptance Scenarios**:

1. **Given** der Registrierungsbildschirm, **When** der User eine gültige E-Mail und ein
   zulässiges Passwort eingibt, **Then** sieht er den Hinweis „Bestätigungsmail unterwegs“ mit
   der Möglichkeit, sie erneut zu senden.
2. **Given** eine ungültige E-Mail oder ein Passwort, das die Regeln aus FR-003 nicht erfüllt, **When** der User registrieren
   will, **Then** ist das nicht möglich und das betroffene Feld wird mit Hinweis markiert.
3. **Given** ein registrierter, unbestätigter User, **When** er sich einloggen will, **Then**
   wird der Login verweigert und er kann die Bestätigungsmail erneut anfordern.
4. **Given** die Bestätigungsmail, **When** der User den Link auf seinem Gerät antippt, **Then**
   öffnet sich die App, die Adresse ist bestätigt und er ist eingeloggt.
5. **Given** ein abgelaufener, durch eine neuere Mail ersetzter oder bereits verwendeter
   Bestätigungslink, **When** der User ihn öffnet, **Then** sieht er „Link ungültig oder E-Mail
   bereits bestätigt“ und kann sich einloggen oder eine neue Mail anfordern.

---

### User Story 2 - Einloggen, eingeloggt bleiben, ausloggen (Priority: P1)

Ein bestätigter User loggt sich mit E-Mail und Passwort ein und bleibt auch nach einem
App-Neustart eingeloggt, bis er sich ausloggt. Nach dem Logout landet er im Login und sieht
keine Daten mehr.

**Why this priority**: Login ist der Zugang zu allen Funktionen; ohne dauerhafte Sitzung müsste
sich der User bei jedem Start neu anmelden.

**Independent Test**: Login, App beenden und neu starten (weiterhin eingeloggt), Logout, App
neu starten (Login-Bildschirm, keine Daten sichtbar).

**Acceptance Scenarios**:

1. **Given** ein bestätigter User, **When** er korrekte Zugangsdaten eingibt, **Then** ist er
   eingeloggt und sieht seine Garderobe.
2. **Given** falsche Zugangsdaten oder eine nicht registrierte E-Mail, **When** der User sich
   einloggen will, **Then** erhält er in beiden Fällen dieselbe neutrale Fehlermeldung.
3. **Given** ein eingeloggter User, **When** er die App schließt und neu startet, **Then** ist er
   ohne erneute Eingabe eingeloggt.
4. **Given** ein eingeloggter User, **When** er sich ausloggt, **Then** landet er im Login, und
   weder über Zurück-Navigation noch nach Neustart sind seine Daten sichtbar.
5. **Given** kein eingeloggter User, **When** die App einen Bereich außerhalb von Login,
   Registrierung oder Passwort vergessen öffnen will, **Then** wird er zum Login geleitet.

---

### User Story 3 - Passwort zurücksetzen (Priority: P2)

Ein User, der sein Passwort vergessen hat, fordert über „Passwort vergessen“ einen Link per
E-Mail an. Der Link öffnet die App direkt beim Schritt „Neues Passwort festlegen“.

**Why this priority**: Wichtig, damit User ihren Account nicht verlieren, aber nicht nötig für
den ersten Zugang.

**Independent Test**: Reset anfordern, Link antippen, neues Passwort setzen, mit dem neuen
Passwort einloggen; das alte funktioniert nicht mehr.

**Acceptance Scenarios**:

1. **Given** „Passwort vergessen“, **When** der User eine E-Mail eingibt, **Then** sieht er
   unabhängig davon, ob die Adresse registriert ist, dieselbe Bestätigung „Falls ein Account
   existiert, wurde eine Mail gesendet“.
2. **Given** die Reset-Mail, **When** der User den Link antippt, **Then** öffnet sich die App
   beim Schritt „Neues Passwort festlegen“.
3. **Given** dieser Schritt, **When** der User ein zulässiges neues Passwort speichert, **Then**
   ist er eingeloggt und das alte Passwort ist ungültig.
4. **Given** ein abgelaufener oder bereits verwendeter Reset-Link, **When** der User ihn öffnet,
   **Then** erhält er einen Hinweis und kann einen neuen Link anfordern.

---

### User Story 4 - Mit Google anmelden (Priority: P3)

Ein User meldet sich mit seinem Google-Konto an, ohne ein Passwort anzulegen. Existiert zu
dieser E-Mail bereits ein Account, landet er in diesem Account.

**Why this priority**: Komfortfunktion; E-Mail/Passwort deckt den Zugang bereits ab.

**Independent Test**: Google-Login mit neuer Adresse legt einen Account an; Google-Login mit
einer Adresse, die bereits als E-Mail/Passwort-Account existiert, zeigt dessen Daten.

**Acceptance Scenarios**:

1. **Given** ein User ohne Account, **When** er sich mit Google anmeldet, **Then** wird ein
   Account angelegt und er ist eingeloggt, ohne eine Bestätigungsmail zu benötigen.
2. **Given** ein bestehender E-Mail/Passwort-Account mit derselben E-Mail, **When** sich der
   User mit Google anmeldet, **Then** landet er im selben Account mit allen bisherigen Daten,
   und der Login mit E-Mail und Passwort funktioniert weiterhin.
3. **Given** der Google-Dialog, **When** der User ihn abbricht, **Then** bleibt er im Login
   ohne Fehlermeldung.

---

### Edge Cases

- Registrierung mit einer bereits registrierten E-Mail: Der User sieht denselben Hinweis wie bei
  einer Neuregistrierung; es wird kein zweiter Account angelegt.
- Mehrfaches Anfordern der Bestätigungs- oder Reset-Mail: Erneutes Senden ist erst nach einer
  kurzen Wartezeit möglich; die verbleibende Zeit wird angezeigt.
- Bestätigungs- oder Reset-Link wird am Desktop oder auf einem Gerät ohne App geöffnet: Siehe
  FR-013a.
- Bestätigungslink wird auf einem anderen Handy als bei der Registrierung geöffnet: Die E-Mail
  ist bestätigt; der User sieht „E-Mail bestätigt, bitte einloggen“ und landet im Login.
- Google-Login mit einer E-Mail, deren E-Mail/Passwort-Registrierung noch unbestätigt ist: Der
  User landet in diesem Account; die Adresse gilt als bestätigt.
- App-Start ohne Internetverbindung: Siehe FR-010a; nach Wiederherstellung der Verbindung landet
  ein eingeloggter User ohne erneuten Login in der App, ein nicht eingeloggter im Login.
- Verbindung bricht während Login, Registrierung oder Reset ab: Die Seite „Keine Verbindung“
  erscheint; bereits eingegebene Daten außer Passwörtern bleiben nach dem erneuten Versuch
  erhalten.
- Sitzung wird ungültig (z. B. nach Passwort-Reset auf einem anderen Gerät): Siehe FR-009a;
  nicht gespeicherte Eingaben gehen verloren.
- Mehrfaches Antippen von „Einloggen“ oder „Registrieren“: Siehe FR-009b.

## Requirements *(mandatory)*

### Functional Requirements

**Zugang**

- **FR-001**: System MUST ohne Login ausschließlich Login, Registrierung und Passwort vergessen
  zugänglich machen; alle anderen Bereiche leiten zum Login.
- **FR-002**: System MUST alle Daten ausschließlich dem eingeloggten User zugänglich machen.

**Registrierung und Bestätigung**

- **FR-003**: Users MUST be able to sich mit E-Mail und Passwort registrieren. Ein Passwort MUST
  mindestens 8 Zeichen lang sein und mindestens einen Buchstaben und eine Ziffer enthalten; die
  Regeln und ihr Erfüllungsstand werden beim Tippen angezeigt. Dieselben Regeln gelten beim
  Zurücksetzen.
- **FR-004**: System MUST nach der Registrierung eine Bestätigungsmail senden und einen Hinweis
  mit der Möglichkeit zum erneuten Senden anzeigen.
- **FR-005**: System MUST den Login mit E-Mail und Passwort verweigern, solange die E-Mail nicht
  bestätigt ist, und dabei das erneute Senden der Bestätigungsmail anbieten.
- **FR-006**: System MUST bei Registrierung mit einer bereits registrierten E-Mail keinen
  weiteren Account anlegen und nicht offenlegen, dass die Adresse existiert.

**Login und Sitzung**

- **FR-007**: Users MUST be able to sich mit E-Mail und Passwort einloggen.
- **FR-008**: System MUST bei fehlgeschlagenem Login eine neutrale Meldung zeigen, die nicht
  verrät, ob die E-Mail registriert ist.
- **FR-009**: System MUST den User über App-Neustarts hinweg eingeloggt halten, bis er sich
  ausloggt oder die Sitzung ungültig wird.
- **FR-009a**: System MUST bei abgelaufener oder ungültiger Sitzung zum Login wechseln und den
  Hinweis „Sitzung abgelaufen, bitte erneut einloggen“ zeigen; nach erneutem Login landet der
  User in der Garderobe.
- **FR-009b**: System MUST während Login, Registrierung, Google-Anmeldung, Mailversand und
  Passwort-Speichern eine Ladeanzeige zeigen und das Formular bis zum Abschluss sperren; ein
  Vorgang wird auch bei mehrfachem Antippen nur einmal ausgelöst. Beim App-Start wird bis zur
  Prüfung der gespeicherten Sitzung ein Startbildschirm gezeigt, ohne dass Login oder Daten
  kurz aufblitzen.
- **FR-010**: Users MUST be able to sich ausloggen; danach MUST der Login angezeigt werden und
  keine Daten des Users mehr auf dem Gerät sichtbar oder gespeichert sein.

**Ohne Internet**

- **FR-010a**: System MUST ohne Internetverbindung, unabhängig vom Login-Status, ausschließlich
  eine Seite „Keine Verbindung“ mit der Möglichkeit zum erneuten Versuch anzeigen. Eine
  gespeicherte Sitzung MUST dabei erhalten bleiben.

**Passwort vergessen**

- **FR-011**: Users MUST be able to einen Link zum Zurücksetzen des Passworts per E-Mail
  anfordern; die Rückmeldung MUST unabhängig davon gleich sein, ob die E-Mail registriert ist.
- **FR-012**: Users MUST be able to über den Link ein neues Passwort festlegen; danach ist das
  alte Passwort ungültig.

**Links**

- **FR-013**: Bestätigungs- und Reset-Links MUST die App öffnen und direkt zum passenden
  Schritt führen.
- **FR-013a**: Das Festlegen eines neuen Passworts MUST ausschließlich in der App möglich sein.
  Wird ein Link am Desktop geöffnet, wird ein Bestätigungslink trotzdem wirksam (der User loggt
  sich danach in der App ein) und ein Reset-Link verbraucht (der User fordert in der App einen
  neuen an). Eine eigene Hinweisseite für den Desktop gibt es nicht.
- **FR-014**: Links MUST nur einmal verwendbar sein und nach 1 Stunde ablaufen. Ein neu
  angeforderter Link MUST alle älteren Links derselben Art entwerten. Ein ungültiger Reset-Link
  führt zu einem Hinweis mit der Möglichkeit, einen neuen Link anzufordern; ein ungültiger
  Bestätigungslink zeigt „Link ungültig oder E-Mail bereits bestätigt“ mit den Aktionen
  Einloggen und Neue Mail anfordern.
- **FR-015**: System MUST das erneute Senden von Mails zeitlich begrenzen (höchstens eine Mail
  pro Minute und Adresse).

**Google**

- **FR-016**: Users MUST be able to sich mit ihrem Google-Konto anmelden, ohne ein Passwort
  anzulegen; eine Bestätigungsmail ist dafür nicht nötig.
- **FR-017**: System MUST einen Google-Login, dessen E-Mail bereits einem Account gehört, diesem
  Account zuordnen; es entsteht kein zweiter Account.
- **FR-017a**: System MUST beim Abbruch des Google-Dialogs ohne Fehlermeldung im Login bleiben;
  schlägt die Google-Anmeldung aus anderen Gründen fehl, erscheint eine verständliche Meldung.

### Key Entities

- **Account**: Ein User der App, eindeutig über seine E-Mail. Status bestätigt/unbestätigt.
  Kann sich per Passwort, per Google oder beidem anmelden. Alle Garderobe- und Outfitdaten
  gehören genau einem Account.
- **Sitzung**: Eingeloggter Zustand auf einem Gerät; bleibt über Neustarts erhalten und endet
  mit Logout oder Ungültigwerden.
- **Bestätigungs-/Reset-Link**: Einmalig verwendbarer, zeitlich begrenzter Link an die E-Mail
  des Accounts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ein neuer User schafft Registrierung, Bestätigung und ersten Login in unter
  3 Minuten.
- **SC-002**: Ein wiederkehrender User ist nach App-Start in unter 2 Sekunden in seiner
  Garderobe, ohne Zugangsdaten einzugeben.
- **SC-003**: In 100 % der Tests sind ohne Login und nach Logout keine Userdaten erreichbar.
- **SC-004**: In 100 % der Tests sind die Meldungen bei Login, Registrierung und Passwort
  vergessen für registrierte und nicht registrierte E-Mails identisch.
- **SC-005**: Mindestens 90 % der Test-User setzen ihr Passwort beim ersten Versuch ohne Hilfe
  zurück.

## Assumptions

- Die Offline-Regel FR-010a gilt app-weit. F01 (noch in Arbeit) sieht bisher Offline-Lesen vor
  (FR-014a, FR-014b) und muss FR-010a bei der weiteren Ausarbeitung übernehmen.
- Die Wartezeit fürs erneute Senden (1 Minute) folgt gängigen Standards.
- Google-User ohne Passwort können über „Passwort vergessen“ nachträglich ein Passwort setzen.
- Ein Passwort-Reset beendet bestehende Sitzungen auf anderen Geräten.
- Beim Logout werden lokal vorgehaltene Daten (z. B. die zuletzt geladene Garderobe aus F01)
  vom Gerät entfernt.
- Der Versand der Mails erfolgt in deutscher Sprache.
- Nicht Teil dieses Features: Apple-Login und weitere Social Logins, Profil bearbeiten,
  E-Mail ändern, Account löschen, Zwei-Faktor-Authentifizierung.
