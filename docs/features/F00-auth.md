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

## Offen
- Display-Name-Screen: Route und „nur einmal“-Logik nicht im Contract.
- Confluence will Hinweis „Account existiert bereits“. `signUp` antwortet laut Contract bewusst neutral (`ok: true`).
- Figma-Links fehlen in Confluence.
