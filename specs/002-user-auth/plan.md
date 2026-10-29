# Implementation Plan: F00 Authentifizierung

**Branch**: `backend/claude/feat/SCRUM-83-f02-authspec` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-user-auth/spec.md`

## Summary

Registrierung mit E-Mail-Bestätigung, Login, dauerhafte Sitzung, Logout, Passwort-Reset und
Google-Login für die Ionic/Angular-App. Umsetzung mit Supabase Auth über `supabase-js`, gekapselt
in einem typisierten `AuthService` mit Signals. Auth-Flow PKCE; ein gemeinsamer Callback
`restyle://auth/callback` für Bestätigung, Reset und Google, empfangen über `@capacitor/app`
(`appUrlOpen`) und eingelöst mit `exchangeCodeForSession`. Google läuft über `signInWithOAuth` im
In-App-Browser (`@capacitor/browser`), ohne natives SDK. Routen sind per Guards geschützt. Backend
braucht keine Migration (Profil-Trigger existiert), nur Auth-Konfiguration in `config.toml` und
deutsche Mail-Templates.

## Technical Context

**Language/Version**: TypeScript ~6.0 (strict), Angular 22, Ionic 9, Capacitor 8

**Primary Dependencies**: `@supabase/supabase-js` 2.x (neu), `@capacitor/app` (vorhanden),
`@capacitor/browser` (neu), `@capacitor/network` (neu), `@capacitor/preferences` (vorhanden)

**Storage**: Supabase Auth (`auth.users`), `public.profiles` per Trigger `on_auth_user_created`;
Sitzung lokal über `@capacitor/preferences`

**Testing**: Vitest über `@angular/build:unit-test` (jsdom), Supabase und Capacitor gemockt

**Target Platform**: iOS und Android via Capacitor; Web-Build (GitHub Pages) nur für Entwicklung

**Project Type**: Mobile-App + BaaS (Supabase)

**Performance Goals**: Wiederkehrender User in < 2 s in der Garderobe (SC-002)

**Constraints**: Kein natives Google-SDK; Zugangsdaten nur über Secrets/`env()`; offline nur
Seite „Keine Verbindung“ (FR-010a)

**Scale/Scope**: 6 Auth-Screens, 1 Service, 2 Guards, 1 Callback-Handler, Backend-Konfiguration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Prinzip | Prüfung | Status |
|---|---|---|
| I. MVP-Umfang | Auth ist Voraussetzung für alle MVP-Features; Apple, 2FA, Profil out of scope | ✅ |
| II. Architektur/Datenhoheit | Ionic/Angular + Supabase Auth; Zugriff nur über typisierten `AuthService`; keine Schemaänderung, daher keine Migration; RLS auf `profiles` besteht | ✅ |
| III. Codequalität | Strict-Modus, Standalone-Komponenten pro Screen, ESLint/Prettier | ✅ |
| IV. Tests | Unit-Tests für `AuthService`, Guards, Callback-Handling, Fehler-Mapping | ✅ |
| V. Mobile-first | Ionic-Komponenten, Capacitor-Plugins, native Deep-Link-Konfiguration | ✅ |
| VI. Deutsch | Alle Artefakte und Mail-Templates auf Deutsch | ✅ |
| Branch-Trennung | Backend-Konfiguration und Frontend-Umsetzung in getrennten Branches/PRs (siehe unten) | ✅ |

**Re-Check nach Phase 1**: keine neuen Verstöße. Complexity Tracking entfällt.

## Project Structure

### Documentation (this feature)

```text
specs/002-user-auth/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-service.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
backend/supabase/
├── config.toml                      # [auth], [auth.email], [auth.external.google], SMTP-Doku
└── templates/                       # neu: deutsche Mail-Templates
    ├── confirmation.html
    └── recovery.html

frontend/
├── capacitor.config.ts              # appId festlegen
├── android/app/src/main/AndroidManifest.xml   # intent-filter restyle://auth/callback
├── ios/App/App/Info.plist                     # URL Types: restyle
└── src/
    ├── environments/environment*.ts # supabaseUrl, supabaseAnonKey (publishable)
    └── app/
        ├── app.routes.ts            # /auth/* öffentlich, Rest hinter authGuard
        ├── app.component.*          # Startbildschirm, Offline-Overlay, Callback-Listener
        ├── supabase/
        │   ├── supabase.client.ts   # createClient<Database>, PKCE, Preferences-Storage
        │   ├── supabase.types.ts    # verschoben aus src/supabase.types.ts
        │   └── services/
        │       ├── auth.service.ts  # dieses Feature
        │       ├── garment.service.ts   # F01, nicht Teil dieses Features
        │       └── outfit.service.ts    # F04/F05, nicht Teil dieses Features
        ├── auth/
        │   ├── guards.ts            # authGuard, guestGuard
        │   ├── auth-callback.ts     # URL-Parsing + Einlösen (vom Service genutzt)
        │   ├── auth-errors.ts       # Supabase-Fehler → AuthErrorCode
        │   ├── password-rules.ts    # min. 8, Buchstabe + Ziffer
        │   └── pages/               # login, register, check-email, forgot-password,
        │                            # reset-password, callback (Web)
        └── core/
            └── network.service.ts   # online-Signal (@capacitor/network)
```

**Structure Decision**: Supabase-Zugriff zentral unter `frontend/src/app/supabase/` wie vorgegeben
(`auth.sertvice.ts` aus dem Input als `auth.service.ts` korrigiert). Auth-spezifische UI, Guards
und Hilfsfunktionen unter `frontend/src/app/auth/`. `garment.service.ts` und `outfit.service.ts`
werden in F01 bzw. F04/F05 angelegt.

### Aufteilung auf PRs (Constitution: Branch-Trennung)

| PR | Bereich | Inhalt |
|---|---|---|
| 1 | Spec | `specs/002-user-auth/*` (dieser Branch) |
| 2 | backend | `config.toml`, Mail-Templates, SMTP-/Secret-Doku |
| 3 | backend | Supabase-Client, `AuthService`, Guards, Callback, Tests (`[BE]` unter `frontend/`, Constitution 1.3.0) |
| 4 | frontend | Native Konfiguration: `appId`, Android-intent-filter, iOS URL Types |
| 5 | frontend | Auth-Screens gegen [contracts/auth-service.md](contracts/auth-service.md) (parallel zu 3 möglich) |

## Complexity Tracking

Keine Verstöße.
