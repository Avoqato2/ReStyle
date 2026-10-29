# Quickstart: F00 Authentifizierung prüfen

## Voraussetzungen

- Supabase CLI, lokaler Stack: `cd backend && supabase start`
- `backend/supabase/.env` (nicht committen) mit `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`,
  `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`
- `frontend/src/environments/environment.ts` mit `supabaseUrl` und Anon-Key aus `supabase status`
- Lokale Mails im Mail-Testpostfach (Inbucket/Mailpit, URL aus `supabase status`)
- Für Deep Links: Android-Emulator oder Gerät, `npx cap sync && npx cap run android`

## Automatisierte Prüfung

```bash
cd frontend
npm run lint
npx ng test --no-watch     # AuthService, Guards, Callback, Passwortregeln
```

Erwartet: alle Tests grün.

## Manuelle Szenarien

| # | Schritt | Erwartet | Bezug |
|---|---|---|---|
| 1 | Registrieren mit `test@example.com` / `abc12345` | Hinweis „Mail unterwegs“; Mail im Testpostfach | US1, FR-004 |
| 2 | Vor Bestätigung einloggen | Verweigert, „Mail erneut senden“ angeboten | FR-005 |
| 3 | Sofort erneut senden | Countdown, kein zweiter Versand < 60 s | FR-015 |
| 4 | Link aus Mail am Gerät öffnen | App öffnet, eingeloggt, Garderobe | US1-4 |
| 5 | Denselben Link erneut öffnen | „Link ungültig oder E-Mail bereits bestätigt“ | FR-014 |
| 6 | Registrierung mit derselben E-Mail wiederholen | Gleicher Hinweis wie bei 1, kein zweiter Account | FR-006 |
| 7 | Login mit falschem Passwort und mit unbekannter E-Mail | Identische Meldung | FR-008 |
| 8 | App beenden und neu starten | Startbildschirm, dann direkt Garderobe | FR-009, SC-002 |
| 9 | Logout, Zurück-Taste, Neustart | Login, keine Daten | FR-010 |
| 10 | Passwort vergessen mit registrierter und unbekannter E-Mail | Identische Bestätigung | FR-011 |
| 11 | Reset-Link öffnen, `neu12345` setzen | Eingeloggt; altes Passwort ungültig; zweites Gerät abgemeldet | FR-012 |
| 12 | Google-Login, Browser schließen | Im Login, keine Fehlermeldung | FR-017a |
| 13 | Google-Login mit E-Mail aus 1 | Selber Account (gleiche User-ID in `auth.users`) | FR-017 |
| 14 | Flugmodus an | Seite „Keine Verbindung“; nach Flugmodus aus weiter eingeloggt | FR-010a |
| 15 | Sitzung im Dashboard widerrufen, App nutzen | Login mit „Sitzung abgelaufen“ | FR-009a |

## Zu verifizieren (Research)

- **R5**: Google-Login auf unbestätigten E-Mail/Passwort-Account → gleiche User-ID, Adresse
  bestätigt; prüfen, ob altes Passwort danach noch gilt.
- **R7**: Login mit **falschem** Passwort auf unbestätigtem Account liefert
  `invalid_credentials`, nicht `email_not_confirmed`.

Abweichungen in `research.md` nachtragen und ggf. Spec per Spec-PR anpassen.
