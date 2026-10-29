# Research: F00 Authentifizierung

Alle offenen Punkte aus dem Technical Context sind entschieden. Punkte mit **Verifizieren** werden
in [quickstart.md](quickstart.md) gegen die echte Supabase-Instanz geprüft.

## R1 – Supabase-Client

- **Decision**: Ein Client in `supabase/supabase.client.ts`: `createClient<Database>` mit
  `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true`,
  `detectSessionInUrl: false` und einem Storage-Adapter auf `@capacitor/preferences`. Bereitstellung
  über ein `InjectionToken` (`SUPABASE_CLIENT`), damit Tests ihn mocken können.
- **Rationale**: `localStorage` im WebView kann iOS bei Speicherdruck leeren; Preferences ist
  dauerhaft (FR-009). URL-Erkennung übernimmt der eigene Callback-Handler (R2), damit Web und
  native Apps denselben Weg nutzen.
- **Alternatives**: Default-`localStorage` (verliert Sitzung), `@capacitor/secure-storage`
  (zusätzliche Abhängigkeit, für Refresh-Token im MVP nicht nötig).

## R2 – Gemeinsamer Callback

- **Decision**: Alle Redirects zeigen auf `restyle://auth/callback?flow=<signup|recovery|google>`.
  `App.addListener('appUrlOpen')` übergibt die URL an `handleCallbackUrl(url)`:
  1. error/error_code in Query oder Fragment → bei signup oder recovery link_invalid, bei google oauth_failed mit error: AuthError und deutscher Meldung. Ein Google-Abbruch führt ohne Fehlermeldung zum Login.
  2. `code` vorhanden → `exchangeCodeForSession(code)`.
     - Erfolg: `signup` → `email_confirmed`, `recovery` → `password_recovery`,
       `google` → `oauth_signed_in`.
     - Fehlschlag bei `flow=signup` (z. B. fehlender PKCE-Verifier, weil Link auf anderem Gerät):
       `email_confirmed_login_required`; die E-Mail ist zu diesem Zeitpunkt bereits bestätigt.
     - Fehlschlag bei flow=recovery → link_invalid; bei flow=google → oauth_failed mit error: AuthError und deutscher Meldung.
  Im Web-Build ruft die Route `/auth/callback` denselben Handler mit `window.location.href` auf.
  Eine bereits eingelöste URL wird ignoriert (Schutz gegen doppeltes `appUrlOpen`).
- **Rationale**: Ein Mechanismus für drei Flows, wie vorgegeben; der `flow`-Parameter ist nötig,
  weil Supabase beim PKCE-Redirect nur `code` anhängt.
- **Alternatives**: `token_hash` + `verifyOtp` mit eigenen Templates (geräteunabhängig, aber
  Custom-Scheme-Links in Mails nicht überall klickbar; verworfen zugunsten der Standard-Links).

## R3 – E-Mail-Links und Ablauf

- **Decision**: Standard-Links (`{{ .ConfirmationURL }}`) in deutschen Templates. `otp_expiry =
  3600` für Bestätigung und Reset (FR-014). Neue Mails ersetzen den Token in `auth.users`, ältere
  Links sind damit ungültig.
- **Konsequenzen** (in der Spec übernommen): Der Link läuft zuerst über den Supabase-Verify-Endpoint,
  der den Token beim Öffnen einlöst. Am Desktop wird eine Bestätigung also wirksam, ein Reset-Link
  verbraucht (FR-013a). Mit PKCE muss ein Reset-Link auf dem Gerät geöffnet werden, auf dem er
  angefordert wurde; sonst `link_invalid` mit Möglichkeit, einen neuen anzufordern.
- **Alternatives**: HTTPS-Weiterleitungsseite (abgelehnt, zusätzlicher Web-Teil), getrennte
  Ablaufzeiten (in Supabase nicht konfigurierbar).

## R4 – Google-Login

- **Decision**: `signInWithOAuth({ provider: 'google', options: { redirectTo:
  'restyle://auth/callback?flow=google', skipBrowserRedirect: true } })`, URL mit
  `Browser.open()` öffnen. Callback schließt den Browser (`Browser.close()`). Endet der Browser
  Endet der Browser (`browserFinished`) ohne Callback, liefert die Anmeldung
  das Contract-Ergebnis `'cancelled'`. Es erscheint keine Fehlermeldung (FR-017a).
- **Rationale**: Kein natives SDK, Custom Tabs/SFSafariViewController sind von Google erlaubt
  (kein eingebettetes WebView).
- **Alternatives**: Natives Google-SDK mit `signInWithIdToken` (ausgeschlossen laut Vorgabe).

## R5 – Kontozusammenführung

- **Decision**: Supabase-Standard „automatic identity linking“: Google-Identität wird an einen
  bestehenden User mit gleicher, bestätigter E-Mail gehängt (FR-017).
- **Verifizieren**: Verhalten bei unbestätigtem E-Mail/Passwort-Account. Erwartung: Supabase
  verknüpft und bestätigt die Adresse, entfernt aber zum Schutz vor Account-Übernahme das bisher
  ungeprüfte Passwort. Der User kann per „Passwort vergessen“ ein neues setzen (deckt sich mit der
  Annahme in der Spec).

## R6 – Passwortregeln

- **Decision**: `minimum_password_length = 8`, `password_requirements = "letters_digits"`.
  Clientseitig spiegelt `password-rules.ts` dieselben Regeln für die Live-Anzeige (FR-003). Fehler
  `weak_password` vom Server wird trotzdem gemappt.

## R7 – Keine E-Mail-Enumeration

- **Decision**:
  - `signUp` mit vorhandener E-Mail: Supabase liefert bei aktiver Bestätigung einen Schein-User
    ohne Identities und keinen Fehler → Service meldet denselben Erfolg (FR-006).
  - `signInWithPassword`: `invalid_credentials` → eine neutrale Meldung (FR-008).
  - `resetPasswordForEmail`: Ergebnis immer als Erfolg an die UI, außer Netzwerk/Rate-Limit (FR-011).
- **Verifizieren**: `email_not_confirmed` darf nur bei korrektem Passwort kommen, sonst würde der
  Status unbestätigter Adressen verraten.

## R8 – Rate-Limit fürs erneute Senden

- **Decision**: `max_frequency = "60s"` (FR-015). Fehler `over_email_send_rate_limit` →
  `rate_limited`; der Service setzt `resendAvailableAt` für den Countdown. `[auth.rate_limit]
  email_sent` wird mit Custom SMTP auf 30/h erhöht (Default 2/h reicht nicht für Tests).

## R9 – Sitzung, Logout, Ablauf

- **Decision**:
  - Start: `status = 'initializing'`, bis `getSession()` fertig ist; App zeigt Startbildschirm,
    Guards warten (FR-009b).
  - Logout: `signOut({ scope: 'local' })`, danach registrierte Cleanup-Hooks (z. B. F01-Cache)
    ausführen und zum Login navigieren (FR-010).
  - Ablauf: `onAuthStateChange('SIGNED_OUT')`, das nicht vom eigenen `signOut()` stammt →
    `signOutReason = 'expired'`, Login mit Hinweis, danach Garderobe (FR-009a).
  - Passwort-Reset: `updateUser({ password })`, dann `signOut({ scope: 'others' })` (Annahme der
    Spec: andere Geräte abmelden).

## R10 – Offline

- **Decision**: `NetworkService` mit Signal `online` aus `@capacitor/network`. `AppComponent`
  legt bei `online() === false` ein Vollbild-Overlay „Keine Verbindung“ mit „Erneut versuchen“
  über die App; die Router-Ansicht bleibt darunter erhalten (Eingaben außer Passwörtern bleiben).
  `supabase-js` löscht die Sitzung bei Netzwerkfehlern beim Refresh nicht (FR-010a).
- **Hinweis**: F01 ist noch nicht fertig spezifiziert und sieht bisher Offline-Lesen vor
  (FR-014a/b); F01 übernimmt FR-010a bei der weiteren Ausarbeitung.

## R11 – Backend-Konfiguration

- **Decision** (`backend/supabase/config.toml`):
  - `[auth] site_url = "restyle://auth/callback"`,
    `additional_redirect_urls = ["restyle://auth/callback**", "http://localhost:8100/**"]`
  - `minimum_password_length = 8`, `password_requirements = "letters_digits"`
  - `[auth.email] enable_confirmations = true`, `max_frequency = "60s"`, `otp_expiry = 3600`
  - `[auth.email.template.confirmation]` / `[auth.email.template.recovery]` mit deutschem Betreff
    und `content_path` auf `backend/supabase/templates/*.html`
  - `[auth.external.google] enabled = true`,
    `client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"`,
    `secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"`, `skip_nonce_check = false`
  - `[auth.email.smtp]` dokumentiert (auskommentiert bis Anbieter gewählt), `pass = "env(SMTP_PASS)"`
- Gehostetes Projekt: dieselben Werte über `supabase config push` bzw. Dashboard; Secrets nur in
  `.env` (gitignored) und Supabase-Dashboard, nie im Repo.
- Google Cloud: OAuth-Client vom Typ „Web“, autorisierte Redirect-URI
  `https://<project-ref>.supabase.co/auth/v1/callback`.

## R12 – Native Konfiguration

- **Decision**: `appId` von `io.ionic.starter` auf eine endgültige ID ändern (Vorschlag
  `com.restyle.app`, Team bestätigt vor erstem Store-Upload, danach nicht mehr änderbar).
  Android: `intent-filter` mit `scheme="restyle" host="auth"` in der `MainActivity`
  (`launchMode="singleTask"`). iOS: URL Type mit Scheme `restyle` in `Info.plist`.

## R13 – Tests

- **Decision**: Vitest mit gemocktem `SUPABASE_CLIENT` und `vi.mock` für `@capacitor/app`,
  `@capacitor/browser`, `@capacitor/network`. Abgedeckt: Fehler-Mapping, Enumeration-Neutralität,
  Callback-Zweige aus R2, Google-Abbruch, Ablauf vs. eigener Logout, Guards inkl. Warten auf
  `initializing`, Passwortregeln.
