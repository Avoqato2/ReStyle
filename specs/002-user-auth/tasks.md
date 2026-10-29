---
description: "Aufgabenliste für F00 Authentifizierung"
---

# Tasks: F00 Authentifizierung

**Input**: Design-Dokumente aus `specs/002-user-auth/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/auth-service.md](contracts/auth-service.md),
[quickstart.md](quickstart.md)

**Tests**: Gefordert (Constitution IV, plan.md). Unit-Tests mit Vitest, Supabase und Capacitor
gemockt. Test und Implementierung stehen in einer Task, damit jede Task ein grüner Commit ist.

**Organisation**: Nach User Story, P1 zuerst. Jede Task = ein Commit.

## Format: `[ID] [P?] [Story?] [BE|FE] Beschreibung`

- **[P]**: Parallel möglich (andere Datei, keine offene Abhängigkeit)
- **[US1]–[US4]**: User Story aus spec.md (Input-Story 1 = US1, 2–4 = US2, 5 = US3, 6 = US4)
- **[BE]**: AuthService, Guards, Callback-Handling, Tests, `config.toml`
- **[FE]**: Screens nach Figma, Formulare, Fehleranzeigen, Capacitor-/native Konfiguration
- Kurz: `T0xx` = Task, `spec.ts` = zugehöriger Vitest-Test, der in derselben Task grün sein muss

---

## Phase 1: Setup

**Purpose**: Abhängigkeiten, Typen, Umgebung, native Plattformen

- [ ] T001 [BE] `@supabase/supabase-js@^2`, `@capacitor/browser@^8`, `@capacitor/network@^8` installieren in frontend/package.json
- [ ] T002 [BE] frontend/src/supabase.types.ts nach frontend/src/app/supabase/supabase.types.ts verschieben (keine Importe vorhanden)
- [ ] T003 [P] [BE] `supabaseUrl` und `supabaseAnonKey` (publishable) ergänzen in frontend/src/environments/environment.ts und frontend/src/environments/environment.prod.ts
- [ ] T004 [P] [FE] `appId` von `io.ionic.starter` auf die vom Team bestätigte ID (Vorschlag `com.restyle.app`, research R12) ändern in frontend/capacitor.config.ts
- [ ] T005 [FE] Android-Plattform anlegen mit `npx cap add android` → frontend/android/ (nach T004)
- [ ] T006 [P] [FE] iOS-Plattform anlegen mit `npx cap add ios` → frontend/ios/ (nach T004, macOS nötig)

---

## Phase 2: Fundament (blockiert US1, US3, US4)

**Purpose**: Auth-Konfiguration, Supabase-Client, AuthService-Grundgerüst, gemeinsamer Callback,
Deep Links, Guards

### Backend-Konfiguration

- [ ] T007 [BE] `[auth]`: `site_url = "restyle://auth/callback"`, `additional_redirect_urls = ["restyle://auth/callback**", "http://localhost:8100/**"]`, `minimum_password_length = 8`, `password_requirements = "letters_digits"` in backend/supabase/config.toml
- [ ] T008 [BE] `[auth.email]`: `enable_confirmations = true`, `max_frequency = "60s"`, `otp_expiry = 3600` in backend/supabase/config.toml
- [ ] T009 [P] [BE] Deutsche Mail-Templates mit `{{ .ConfirmationURL }}` anlegen: backend/supabase/templates/confirmation.html, backend/supabase/templates/recovery.html
- [ ] T010 [BE] `[auth.email.template.confirmation]` und `[auth.email.template.recovery]` mit deutschem Betreff und `content_path` auf die Templates aus T009 in backend/supabase/config.toml
- [ ] T011 [BE] `[auth.email.smtp]` auskommentiert dokumentieren (`pass = "env(SMTP_PASS)"`), `[auth.rate_limit] email_sent = 30` mit Hinweis „erst mit Custom SMTP wirksam“ in backend/supabase/config.toml
- [ ] T012 [P] [BE] backend/supabase/.env.example mit `SMTP_PASS`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` (leer) anlegen; prüfen, dass `.env` in backend/supabase/.gitignore steht

### Supabase-Client und AuthService-Grundgerüst

- [ ] T013 [BE] `SUPABASE_CLIENT`-InjectionToken und `createClient<Database>` mit `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false` und Storage-Adapter auf `@capacitor/preferences` in frontend/src/app/supabase/supabase.client.ts; Provider in frontend/src/main.ts registrieren
- [ ] T014 [P] [BE] `AuthErrorCode`, `AuthError`, `AuthResult` aus dem Contract und `mapAuthError()` (Supabase-Codes `invalid_credentials`, `email_not_confirmed`, `weak_password`, `over_email_send_rate_limit`, Netzwerkfehler → Contract-Codes, deutsche Meldungen) in frontend/src/app/auth/auth-errors.ts + frontend/src/app/auth/auth-errors.spec.ts
- [ ] T015 [P] [BE] Reine Funktion `parseCallbackUrl(url)` → `{ flow, code?, error? }` (Query und Fragment, `flow` = `signup|recovery|google`) in frontend/src/app/auth/auth-callback.ts + frontend/src/app/auth/auth-callback.spec.ts
- [ ] T016 [BE] `AuthService` mit Signals `status` (Start `initializing`), `user`, `isAuthenticated`, `signOutReason`, `resendAvailableAt`; Init über `getSession()` und `onAuthStateChange` in frontend/src/app/supabase/services/auth.service.ts + frontend/src/app/supabase/services/auth.service.spec.ts
- [ ] T017 [BE] `handleCallbackUrl(url)` und `callbackEvents` nach research R2 (Fehler → `link_invalid`, `exchangeCodeForSession`, Fehlschlag bei `signup` → `email_confirmed_login_required`, doppelte URL ignorieren) in frontend/src/app/supabase/services/auth.service.ts + Tests aller Zweige in auth.service.spec.ts
- [ ] T018 [BE] `App.addListener('appUrlOpen')` im AuthService-Init registrieren und an `handleCallbackUrl` übergeben (`@capacitor/app` gemockt) in frontend/src/app/supabase/services/auth.service.ts + auth.service.spec.ts
- [ ] T019 [BE] `authGuard` (wartet bis `status !== 'initializing'`, sonst `/auth/login`) und `guestGuard` (mit Sitzung → `/home`) in frontend/src/app/auth/guards.ts + frontend/src/app/auth/guards.spec.ts
- [ ] T020 [BE] Navigation nach `callbackEvents` gemäß Contract-Tabelle „Navigation nach Callback-Events“ in frontend/src/app/app.component.ts + frontend/src/app/app.component.spec.ts

### Native Deep Links

- [ ] T021 [P] [FE] `intent-filter` (`VIEW`, `DEFAULT`, `BROWSABLE`, `scheme="restyle"`, `host="auth"`) und `launchMode="singleTask"` an der MainActivity in frontend/android/app/src/main/AndroidManifest.xml
- [ ] T022 [P] [FE] URL Type mit Scheme `restyle` in frontend/ios/App/App/Info.plist

**Checkpoint Fundament (Android-Emulator)**: `supabase start`, App mit `npx cap run android`
starten, dann `adb shell am start -a android.intent.action.VIEW -d
"restyle://auth/callback?flow=signup&error=otp_expired"` → App kommt in den Vordergrund und
navigiert zu `/auth/login?hint=link_invalid` (Route darf noch leer sein). `npx ng test --no-watch`
grün.

---

## Phase 3: User Story 1 – Registrieren und E-Mail bestätigen (P1) 🎯 MVP

**Goal**: Neuer User registriert sich, bekommt eine Bestätigungsmail, kann sie erneut anfordern
und ist nach Antippen des Links eingeloggt.

**Independent Test**: Registrierung → Hinweis „Mail unterwegs“ → erneut senden mit Countdown →
Link im Emulator öffnen → eingeloggt.

- [ ] T023 [P] [US1] [BE] `checkPasswordRules()` und `isPasswordValid()` („mindestens 8 Zeichen, mindestens ein Buchstabe und eine Ziffer“) in frontend/src/app/auth/password-rules.ts + frontend/src/app/auth/password-rules.spec.ts
- [ ] T024 [US1] [BE] `signUp(email, password)` mit `emailRedirectTo: 'restyle://auth/callback?flow=signup'`; bereits registrierte E-Mail (leere Identities) liefert `ok: true` (FR-006); In-Flight-Promise wiederverwenden in auth.service.ts + auth.service.spec.ts
- [ ] T025 [US1] [BE] `resendConfirmation(email)` mit `resend({ type: 'signup' })`; setzt `resendAvailableAt` (+60 s) bei Erfolg und bei `rate_limited` in auth.service.ts + auth.service.spec.ts
- [ ] T026 [US1] [BE] Routen `/auth/register` und `/auth/check-email` mit `guestGuard` in frontend/src/app/app.routes.ts
- [ ] T027 [P] [US1] [FE] Registrierungs-Screen nach Figma: E-Mail, Passwort mit Live-Regelanzeige (`checkPasswordRules`), Feldfehler, Ladeanzeige und gesperrtes Formular während `signUp`, Link zum Login in frontend/src/app/auth/pages/register/register.page.ts|html|scss
- [ ] T028 [P] [US1] [FE] „Bestätigungsmail unterwegs“-Screen nach Figma mit „Erneut senden“ und Countdown aus `resendAvailableAt`, Fehleranzeige für `network` in frontend/src/app/auth/pages/check-email/check-email.page.ts|html|scss

**Checkpoint US1 (Emulator/Gerät)**: Quickstart-Szenarien 1, 3, 4 und 6. Mail aus dem lokalen
Testpostfach im Emulator-Browser öffnen → App öffnet sich eingeloggt auf `/home`.

---

## Phase 4: User Story 2 – Einloggen, eingeloggt bleiben, ausloggen (P1)

**Goal**: Bestätigter User loggt sich ein, bleibt über Neustarts eingeloggt, kann sich ausloggen;
abgelaufene Sitzung und fehlende Verbindung werden sauber behandelt.

**Independent Test**: Login → App neu starten (eingeloggt) → Logout → Neustart (Login, keine
Daten) → Flugmodus (Seite „Keine Verbindung“).

- [ ] T029 [US2] [BE] `signIn(email, password)`: `invalid_credentials` neutral (FR-008), `email_not_confirmed`, setzt `signOutReason` auf `null` in auth.service.ts + auth.service.spec.ts
- [ ] T030 [US2] [BE] `signOut()` mit `scope: 'local'`, `registerSignOutCleanup(fn)`, Cleanup-Hooks nach Logout ausführen, Navigation `/auth/login` in auth.service.ts + auth.service.spec.ts
- [ ] T031 [US2] [BE] `SIGNED_OUT` ohne eigenen `signOut()` → `signOutReason = 'expired'` und Navigation `/auth/login` (FR-009a) in auth.service.ts + auth.service.spec.ts
- [ ] T032 [P] [US2] [BE] `NetworkService` mit Signal `online` aus `@capacitor/network` in frontend/src/app/core/network.service.ts + frontend/src/app/core/network.service.spec.ts
- [ ] T033 [US2] [BE] Routen: `/auth/login` mit `guestGuard`, `/home` mit `authGuard`, Default-Redirect `''` → `/home` in frontend/src/app/app.routes.ts
- [ ] T034 [P] [US2] [FE] Login-Screen nach Figma: E-Mail, Passwort, neutrale Fehlermeldung, bei `email_not_confirmed` „Mail erneut senden“, Hinweise für `signOutReason === 'expired'`, `?hint=confirmed` und `?hint=link_invalid` (inkl. „Neue Mail anfordern“), Ladeanzeige + Sperre, Links zu Registrierung und Passwort vergessen in frontend/src/app/auth/pages/login/login.page.ts|html|scss
- [ ] T035 [P] [US2] [FE] Startbildschirm nach Figma, solange `status() === 'initializing'` (kein Aufblitzen von Login oder Daten) in frontend/src/app/app.component.html|scss
- [ ] T036 [P] [US2] [FE] Vollbild-Overlay „Keine Verbindung“ mit „Erneut versuchen“, eingeblendet bei `online() === false`, Router-Ansicht bleibt darunter erhalten, in frontend/src/app/core/offline-overlay/offline-overlay.component.ts|html|scss und frontend/src/app/app.component.html
- [ ] T037 [US2] [FE] Logout-Button (vorläufig bis zur F01-Navigation) in frontend/src/app/home/home.page.html|ts

**Checkpoint US2 (Emulator/Gerät)**: Quickstart-Szenarien 2, 7, 8, 9, 14, 15.

---

## Phase 5: User Story 3 – Passwort zurücksetzen (P2)

**Goal**: User fordert einen Reset-Link an, öffnet ihn in der App, setzt ein neues Passwort und
ist eingeloggt; andere Geräte werden abgemeldet.

**Independent Test**: Reset anfordern → Link im Emulator öffnen → neues Passwort → eingeloggt;
altes Passwort ungültig.

- [ ] T038 [US3] [BE] `requestPasswordReset(email)` mit `redirectTo: 'restyle://auth/callback?flow=recovery'`; unbekannte E-Mail → `ok: true` (FR-011); `rate_limited` setzt `resendAvailableAt` in auth.service.ts + auth.service.spec.ts
- [ ] T039 [US3] [BE] `updatePassword(newPassword)` mit `updateUser({ password })`, danach `signOut({ scope: 'others' })` in auth.service.ts + auth.service.spec.ts
- [ ] T040 [US3] [BE] `recoveryGuard`: `/auth/reset-password` nur nach Event `password_recovery`, sonst `/auth/login` in frontend/src/app/auth/guards.ts + guards.spec.ts
- [ ] T041 [US3] [BE] Routen `/auth/forgot-password` (`guestGuard`) und `/auth/reset-password` (`recoveryGuard`) in frontend/src/app/app.routes.ts
- [ ] T042 [P] [US3] [FE] „Passwort vergessen“-Screen nach Figma: E-Mail, neutrale Bestätigung „Falls ein Account existiert, wurde eine Mail gesendet“, Countdown, Hinweis bei `?hint=link_invalid` in frontend/src/app/auth/pages/forgot-password/forgot-password.page.ts|html|scss
- [ ] T043 [P] [US3] [FE] „Neues Passwort festlegen“-Screen nach Figma mit Live-Regelanzeige, Ladeanzeige + Sperre, Fehleranzeige in frontend/src/app/auth/pages/reset-password/reset-password.page.ts|html|scss

**Checkpoint US3 (Emulator/Gerät)**: Quickstart-Szenarien 10 und 11; abgelaufenen bzw. zweimal
geöffneten Reset-Link → „Link ungültig oder abgelaufen“.

---

## Phase 6: User Story 4 – Mit Google anmelden (P3)

**Goal**: Anmeldung mit Google im In-App-Browser; gleiche E-Mail landet im bestehenden Account;
Abbruch ohne Fehlermeldung.

**Independent Test**: Google-Login mit neuer Adresse → eingeloggt; mit Adresse eines bestehenden
Accounts → gleiche User-ID; Browser schließen → im Login ohne Meldung.

- [ ] T044 [US4] [BE] `[auth.external.google]`: `enabled = true`, `client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"`, `secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"`, `skip_nonce_check = false` in backend/supabase/config.toml
- [ ] T045 [P] [US4] [BE] Einrichtung dokumentieren (Google-Cloud-OAuth-Client Typ „Web“, Redirect-URI `https://<project-ref>.supabase.co/auth/v1/callback`, Secrets im Dashboard, `supabase config push`, SMTP-Hinweis) in backend/supabase/AUTH.md
- [ ] T046 [US4] [BE] `signInWithGoogle()`: `signInWithOAuth` mit `redirectTo: 'restyle://auth/callback?flow=google'` und `skipBrowserRedirect: true`, `Browser.open()`, bei Callback `Browser.close()` → `'signed_in'`, `browserFinished` ohne Callback → `'cancelled'`, sonst `oauth_failed` (`@capacitor/browser` gemockt) in auth.service.ts + auth.service.spec.ts
- [ ] T047 [US4] [FE] Google-Button nach Figma im Login-Screen: Ladeanzeige, bei `'cancelled'` keine Meldung, bei `oauth_failed` Fehleranzeige in frontend/src/app/auth/pages/login/login.page.ts|html|scss

**Checkpoint US4 (Gerät mit Google-Konto)**: Quickstart-Szenarien 12 und 13 sowie Prüfpunkt R5
(Google auf unbestätigten Account).

---

## Phase 7: Polish & Querschnitt

- [ ] T048 [BE] Web-Route `/auth/callback` ruft `handleCallbackUrl(window.location.href)` auf (nur Web-Entwicklung) in frontend/src/app/auth/pages/callback/callback.page.ts und frontend/src/app/app.routes.ts
- [ ] T049 [BE] Prüfpunkte R5 und R7 aus quickstart.md gegen die lokale Instanz ausführen; Ergebnis als Kommentar im PR festhalten (Spec-Änderungen nur per separatem Spec-PR)
- [ ] T050 [BE] Vollständigen Quickstart (Szenarien 1–15) auf Android-Gerät durchlaufen, `npm run lint` und `npx ng test --no-watch` grün

---

## Dependencies & Execution Order

```text
Setup (T001–T006)
  └─► Fundament (T007–T022)
        ├─► US1 (T023–T028) ─┐
        ├─► US2 (T029–T037) ─┤  US2 nutzt Login-Screen auch für US1-Hinweise
        ├─► US3 (T038–T043)  │  T038–T043 brauchen T034 (Link „Passwort vergessen“) nur für den Checkpoint
        └─► US4 (T044–T047)  │  T047 erweitert den Login-Screen aus T034
                             └─► Polish (T048–T050)
```

- Innerhalb einer Story: [BE]-Service-Tasks vor Routen, Screens ([FE]) parallel gegen den
  Contract möglich.
- Tasks in derselben Datei (`auth.service.ts`, `config.toml`, `app.routes.ts`) laufen nacheinander.
- US1-Szenario 3 (Login vor Bestätigung) wird im US2-Checkpoint geprüft, weil der Login-Screen
  erst dort entsteht.

## Parallel Examples

```text
Fundament:  T009 Templates  |  T012 .env.example  |  T014 auth-errors  |  T015 parseCallbackUrl  |  T021 Android  |  T022 iOS
US1:        T023 password-rules  |  T027 Register-Screen  |  T028 Check-Email-Screen
US2:        T032 NetworkService  |  T034 Login-Screen  |  T035 Startbildschirm  |  T036 Offline-Overlay
US3:        T042 Forgot-Screen   |  T043 Reset-Screen
```

## Implementation Strategy

1. **MVP**: Setup + Fundament + US1 + US2 → Registrieren, Bestätigen, Login, Sitzung, Logout.
   Damit ist F01 entsperrt.
2. US3 (Passwort-Reset) als nächstes Inkrement.
3. US4 (Google) zuletzt; braucht Google-Cloud-Zugang.
4. Nach jeder Phase Checkpoint auf Emulator/Gerät, erst dann nächste Phase.
