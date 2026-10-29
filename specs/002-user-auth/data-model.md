# Data Model: F00 Authentifizierung

Keine Schemaänderung, keine Migration. Bestehende Strukturen werden genutzt.

## Persistente Daten (Supabase)

| Entität | Ort | Relevante Felder | Hinweis |
|---|---|---|---|
| Account | `auth.users` (Supabase) | `id`, `email`, `email_confirmed_at`, Identities (`email`, `google`) | Wird von Supabase Auth verwaltet, nicht direkt beschrieben |
| Profil | `public.profiles` | `id` (= `auth.users.id`), `display_name`, `preferences` | Per Trigger `on_auth_user_created` angelegt, RLS auf eigenen User ([mvp_schema](../../backend/supabase/migrations/20261021120000_mvp_schema.sql)) |

Google-Login mit vorhandener E-Mail erzeugt keinen neuen `auth.users`-Eintrag, sondern eine
zusätzliche Identity am bestehenden Account (FR-017); daher auch kein zweites Profil.

## Client-Zustand (AuthService)

### AuthStatus

```text
initializing ──getSession()──► authenticated
      │                            │  signOut() / Ablauf
      └────────────► unauthenticated ◄┘
                          │ signIn / Callback / Google
                          └──────────────► authenticated
```

| Zustand | Bedeutung | UI |
|---|---|---|
| `initializing` | Gespeicherte Sitzung wird geladen | Startbildschirm, Guards warten |
| `authenticated` | Gültige Sitzung | Geschützte Bereiche erreichbar |
| `unauthenticated` | Keine Sitzung | Nur `/auth/*` |

### SignOutReason

`'user'` (eigener Logout) | `'expired'` (Sitzung abgelaufen/ungültig, FR-009a) | `null`.

### Lokale Sitzung

Access-/Refresh-Token in `@capacitor/preferences` unter dem Supabase-Storage-Key. Wird bei
Logout entfernt; zusätzlich laufen registrierte Cleanup-Hooks (z. B. F01-Garderobe-Cache).

## Validierungsregeln

| Feld | Regel | Quelle |
|---|---|---|
| E-Mail | Gültiges Format | FR-003 |
| Passwort | ≥ 8 Zeichen, ≥ 1 Buchstabe, ≥ 1 Ziffer | FR-003, Server: `letters_digits` |
| Erneutes Senden | ≥ 60 s Abstand pro Adresse | FR-015 |
| Links | Einmalig, 1 h gültig, neuer Link entwertet alten | FR-014 |
