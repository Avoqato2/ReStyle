# Captcha in den Auth-Tests – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auth-Tests rufen `signUp`, `signIn`, `requestPasswordReset` mit Captcha-Token auf und prüfen dessen Weitergabe an Supabase.

**Architecture:** Nur Tests und `environment.example.ts` ändern sich. Der Service-Code ist fertig und bleibt unverändert. Unit-Tests nutzen ein Fake-Token, der Integrationstest das offizielle hCaptcha-Testtoken gegen das lokale Supabase mit Test-Secret.

**Tech Stack:** Angular 22, Vitest 4, supabase-js, hCaptcha

**Branch:** `frontend/copilot/feat/scrum-105-authv2`

**Spec:** `docs/features/F00-auth.md`, Abschnitt „Captcha in den Auth-Tests (2026-11-13 …)“

## Global Constraints

- Kein Service-Code, keine Captcha-UI, keine Backend-Config ändern (`backend/` bleibt unberührt).
- Captcha im Test nicht umgehen.
- hCaptcha-Testtoken: `10000000-aaaa-bbbb-cccc-000000000001`. Test-Site-Key: `10000000-ffff-ffff-ffff-000000000001`.
- Kommentare auf Deutsch. Fertig = `npm run lint` + `npx ng test --no-watch` grün (in `frontend/`).
- Nicht pushen.

## Review Focus

1. **Token geht verloren:** Wenn der Service das Token nicht weiterreicht, muss ein Unit-Test rot werden. Das decken die drei `toHaveBeenCalledWith`-Prüfungen in Task 1 ab.
2. **Lokales Secret fehlt oder ist echt:** Der Integrationstest scheitert dann an `signUp`. Ein Kommentar an der Konstante nennt die Ursache (Test-Secret in `.env`, `supabase stop && supabase start`). Das ist nicht automatisch testbar, weil der Test im CI übersprungen wird.
3. **Gemeinsame Mocks:** Die übrigen Aufrufe (Z. ~612 `signIn` im signOut-Kontext, `inFlight`-Tests) brauchen ebenfalls das Token, sonst schlägt die TS-Typprüfung fehl. Abgedeckt, weil Task 1 *alle* Aufrufe umstellt.

---

### Task 1: Unit-Tests `auth.service.spec.ts`

**Files:**
- Modify: `frontend/src/app/supabase/tests/auth.service.spec.ts` (Aufrufe ~Z. 288–362, 445–480, 612, 633–690; Erwartungen Z. 291–295, 446, 634)

**Interfaces:**
- Consumes: `signUp(email, password, captchaToken: string)`, `signIn(email, password, captchaToken: string)`, `requestPasswordReset(email, captchaToken: string)` aus `services/auth/auth.service.ts`
- Produces: –

- [ ] **Step 1: Ist-Zustand prüfen.** `cd frontend && npx ng test --no-watch`. Erwartet: FAIL in `auth.service.spec.ts` (Typfehler wegen fehlender Argumente und/oder abweichendes `toHaveBeenCalledWith`).
- [ ] **Step 2: Konstante oben im File anlegen** `const CAPTCHA_TOKEN = 'captcha-token';` und an **jeden** Aufruf der drei Methoden als letztes Argument hängen.
- [ ] **Step 3: Erwartungen anpassen:**

```ts
// signUp
expect(mock.auth.signUp).toHaveBeenCalledWith({
  email: 'anna@example.com',
  password: 'abcd1234',
  options: { emailRedirectTo: callbackUrl('signup'), captchaToken: CAPTCHA_TOKEN },
});
// signIn
expect(mock.auth.signInWithPassword).toHaveBeenCalledWith({
  email: 'anna@example.com',
  password: 'abcd1234',
  options: { captchaToken: CAPTCHA_TOKEN },
});
// requestPasswordReset
expect(mock.auth.resetPasswordForEmail).toHaveBeenCalledWith('anna@example.com', {
  redirectTo: callbackUrl('recovery'),
  captchaToken: CAPTCHA_TOKEN,
});
```

- [ ] **Step 4: Tests laufen lassen.** `npx ng test --no-watch`. Erwartet: `auth.service.spec.ts` PASS.
- [ ] **Step 5: Commit** `test(auth): Captcha-Token in AuthService-Unit-Tests`

### Task 2: Integrationstest + Environment-Beispiel

**Files:**
- Modify: `frontend/src/app/supabase/supabase.integration.spec.ts` (Aufrufe Z. 38, 117, 122, 219, 229)
- Modify: `frontend/src/environments/environment.example.ts:9`

**Interfaces:**
- Consumes: wie Task 1
- Produces: –

- [ ] **Step 1: Konstante im `describe`-Block** neben `testUser`:

```ts
// Offizielles hCaptcha-Testtoken. Gilt nur, wenn lokal SUPABASE_AUTH_CAPTCHA_SECRET
// das Test-Secret 0x0000000000000000000000000000000000000000 ist (danach supabase stop && start).
const CAPTCHA_TEST_TOKEN = '10000000-aaaa-bbbb-cccc-000000000001';
```

An alle `signUp`/`signIn`-Aufrufe als drittes Argument übergeben.
- [ ] **Step 2: Site-Key korrigieren.** In `environment.example.ts` `hcaptchaSiteKey: '10000000-ffff-ffff-ffff-000000000001'`. Kommentar bleibt.
- [ ] **Step 3: Verifizieren.** In `frontend/`: `npm run lint` und `npx ng test --no-watch`. Erwartet: beides grün. Der Integrationstest läuft lokal mit, wenn Supabase läuft. Erwartet: PASS. Läuft Supabase nicht, im Bericht vermerken und nicht als grün melden.
- [ ] **Step 4: Commit** `test(auth): Captcha-Testtoken im Integrationstest, Site-Key-Beispiel korrigiert`
