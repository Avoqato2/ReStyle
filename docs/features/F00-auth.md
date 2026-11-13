# F00 Authentication · SCRUM-85 · MVP
Basis für alles (ohne Login liefert RLS nichts). API-Contract: `specs/002-user-auth/contracts/auth-service.md` (Dateipfade dort veraltet, echte Pfade unten).

## Regeln
- Login: E-Mail + Passwort, Google (OAuth über Supabase). Kein Login per Username, kein Apple/Facebook.
- Passwort: min. 8 Zeichen, ≥1 Buchstabe (nur A–Z, Umlaute zählen nicht), ≥1 Ziffer.
- Nach Registrierung Bestätigungsmail, erneut senden mit Countdown, eigener Bestätigungsscreen.
- Passwort vergessen → Link per Mail → eigener Screen „Neues Passwort“.
- Session bleibt nach App-Neustart (PKCE, Storage in Capacitor Preferences).
- Nach erster Registrierung (E-Mail oder Google) einmalig Screen „Display Name anlegen“, danach nie wieder.
- Fehlertexte deutsch und verständlich. Screens zeigen `AuthError.message`.
- Screens bauen nur gegen `AuthService`, nie `supabase-js` direkt.

## Ist-Stand
- `frontend/src/app/supabase/services/auth/`: `auth.service.ts`, `guards.ts` (`authGuard`, `guestGuard`), `auth-callback.ts`, `auth-errors.ts`, `auth-urls.ts`, `password-rules.ts`. Tests: `frontend/src/app/supabase/tests/`.
- Routen: nur `/home` und `/auth/callback` (Web). Guards noch nicht in den Routen.
- Fehlen: Screens `/auth/login`, `/auth/register`, `/auth/check-email`, `/auth/forgot-password`, `/auth/reset-password`, Display-Name-Screen. Routen + Navigation nach Callback-Events: siehe Contract.

## Auth-Mails (Templates, SMTP)
- Templates: `backend/supabase/templates/confirmation.html` (Registrierung), `recovery.html` (Passwort vergessen). Lokal per `config.toml` `[auth.email.template.*]`, aktiv erst nach `supabase stop && supabase start`.
- Link immer `{{ .ConfirmationURL }}` → `redirectTo` des AuthService (App `restyle://auth/callback`, Browser `<Adresse>/auth/callback`).
- Gehostet: Dashboard › Authentication › Email Templates, Betreff + HTML 1:1 aus den Dateien. Änderungen an beiden Stellen.
- Einstellungen lokal = Dashboard: Confirm email an, Passwort min. 8, Mail-Mindestabstand 60 s.
- SMTP lokal: keiner nötig, Mails in Mailpit `http://127.0.0.1:54324`.
- SMTP gehostet: Der eingebaute Mailer ist nur zum Testen (niedriges Stundenlimit, nur Team-Adressen). Für echte Nutzer eigenes SMTP unter Dashboard › Authentication › SMTP Settings, danach Rate Limits anpassen. Den Anbieter wählt das Team. Zugangsdaten nie ins Repo.

## Offen
- Display-Name-Screen: Route und „nur einmal“-Logik nicht im Contract.
- Confluence will Hinweis „Account existiert bereits“. `signUp` antwortet laut Contract bewusst neutral (`ok: true`).
- Figma-Links fehlen in Confluence.

---

## Captcha in den Auth-Tests (2026-11-13 · Branch `frontend/copilot/feat/scrum-105-authv2`)

**Warum:** `signUp`, `signIn` und `requestPasswordReset` verlangen seit dem hCaptcha-Einbau ein `captchaToken` und reichen es an Supabase weiter. Die Tests rufen sie noch ohne Token auf und passen deshalb nicht mehr.

**Ziele:** Unit- und Integrationstests decken das Token ab, Lint + Tests grün. **Nicht-Ziel:** Service-Code, Captcha-UI oder Backend-Config ändern. **Anti-Ziel:** Captcha im Test umgehen (z. B. in `config.toml` abschalten).

**Ansätze:**
- **A (gewählt):** Offizielle hCaptcha-Testschlüssel. Lokales Secret `0x0000000000000000000000000000000000000000` in `.env` (`SUPABASE_AUTH_CAPTCHA_SECRET`), Integrationstest schickt Token `10000000-aaaa-bbbb-cccc-000000000001`. Echter Ablauf mit Captcha-Prüfung, braucht Internet.
- B: Captcha lokal abschalten. Verworfen: testet nichts mehr, wäre Backend-Änderung auf Frontend-Branch.

**Umsetzung:**
1. `tests/auth.service.spec.ts`: Konstante `CAPTCHA_TOKEN = 'captcha-token'` an alle Aufrufe von `signUp`, `signIn`, `requestPasswordReset`. Die `toHaveBeenCalledWith`-Erwartungen prüfen das Token mit:
   - `signUp`: `options: { emailRedirectTo, captchaToken }`
   - `signIn`: `{ email, password, options: { captchaToken } }`
   - `requestPasswordReset`: `{ redirectTo, captchaToken }`
2. `supabase.integration.spec.ts`: Konstante mit dem hCaptcha-Testtoken (Kommentar: nur mit Test-Secret gültig), an `signUp`/`signIn` übergeben.
3. `environment.example.ts`: Tippfehler im Site-Key → `10000000-ffff-ffff-ffff-000000000001`.

**Dem Umsetzer überlassen:** Name/Position der Konstanten, Kommentartexte.
