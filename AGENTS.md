# AGENTS.md – ReStyle

Digitale Garderobe als Mobile-App (Ionic/Angular + Supabase). Semesterprojekt mediaLab USTP, 7 Personen, Scrum, Jira `SCRUM-xx`.
Ziel: lauffähiges MVP in mind. einem App Store bis **19.01.2027**, Open Source (MIT).

## Arbeitsweise (verbindlich)

- Knapp antworten. Kein Smalltalk, keine Wiederholung der Aufgabe, keine ungefragten Erklärungen oder Zusammenfassungen.
- Unklar oder mehrdeutig → eine konkrete Rückfrage statt raten. Gilt immer für Punkte unter „Offen“.
- Vor jedem Anlegen oder Ändern einer Datei und vor jedem Command, der etwas verändert oder
  ausführt (Schreiben, Tests, Commits, Installieren), den Menschen fragen, was genau passieren
  soll, und erst nach Zustimmung ausführen. Lesen ist frei. Gilt auch, wenn ein Skill
  durchgehendes Arbeiten vorsieht.
- Nur lesen, was die Aufgabe braucht: dieses File → passendes `docs/features/Fxx-*.md` → gezielt Code.
- Nicht lesen/durchsuchen: `node_modules/`, `www/`, `android/`, `ios/`, `package-lock.json`, `backend/supabase/.temp/`, `.specify/`. `supabase.types.ts` ist generiert: nur gezielt nach Typen suchen.
- Minimale Diffs. Keine kompletten Dateien neu ausgeben, keine Refactorings außerhalb der Aufgabe.
- Neue Dependencies, Schema-Änderungen und alles außerhalb des MVP nur nach Rückfrage.
- Kommentare auf Deutsch, nur wo Logik nicht offensichtlich ist. Doku/Pläne Deutsch, Code-Identifier Englisch.
- Fertig = Lint + Tests grün (Commands unten). Nie „fertig“ melden ohne Nachweis.
- Keine Git-Worktrees, auch wenn ein Skill (z. B. `using-git-worktrees`) das vorsieht. Im bestehenden Checkout auf dem passenden Branch arbeiten. Passt der ausgecheckte Branch nicht zu Ticket/Bereich: nachfragen.
- Niemals pushen, machen die developper selbst.
- Abschluss (`finishing-a-development-branch`): nur Branch behalten. Kein lokaler Merge, kein Push, keine PR. Stattdessen PR-Titel + Beschreibung vorschlagen.

## Workflow-Skills

Spec Kit wird nicht mehr verwendet. `specs/` und `.specify/` = Altbestand, nur als Referenz lesen, nicht erweitern.
Stattdessen Agent Skills (Liste wächst):

| Situation                       | Skill (superpowers)                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| Neues Feature, Verhalten ändern | `brainstorming` → `writing-plans` → `executing-plans` / `subagent-driven-development` |
| Services, Datenlogik            | `test-driven-development`                                                             |
| Bug, roter Test                 | `systematic-debugging`                                                                |
| Vor „fertig“, Commit, PR        | `verification-before-completion`                                                      |
| Review                          | `requesting-code-review` / `receiving-code-review`                                    |

Skill nicht installiert → gleiche Schritte manuell.

- Ablage (gilt vor den Skill-Vorgaben): `docs/superpowers/` nicht verwenden.
  Designs als eigener Abschnitt mit Datum + Branch ins passende `docs/features/Fxx-*.md`.
  Umsetzungspläne nur lokal unter `.superpowers/plans/` (git-ignoriert), nie committen.
- `docs/features/` enthält nur Architektur und Entscheidungen, keine Prozessnotizen,
  Ledger oder Review-Ergebnisse.

## Stack

- `frontend/`: Angular 22 (Standalone), Ionic 9, Capacitor 8 (iOS + Android), TypeScript 6 strict, Vitest 4, ESLint + Prettier
- `backend/supabase/`: Supabase (Postgres, Auth, Storage, RLS). Kein eigener API-Server: App spricht per `supabase-js` direkt mit PostgREST. Unumgehbare Regeln liegen in Postgres (RLS, Checks, FKs, Trigger, RPC).
- Später LLM/Wetter/alles mit API-Key: Supabase Edge Functions. Keys nie in die App.
- Libs: `@capacitor/camera`, `@capacitor/preferences`, `@capacitor/filesystem`, `@imgly/background-removal`

## Commands

Frontend (`cd frontend`):

- Setup: `npm ci`, `cp src/environments/environment.example.ts src/environments/environment.ts`, Keys aus `supabase status` eintragen
- `npm start` · `npm run lint` · `npx ng test --no-watch` · `npm run build`

Backend (`cd backend`, Docker nötig):

- `supabase start` · `supabase migration new <name>` · `supabase db reset` (alle Migrationen + `seed.sql`)
- Types nach jeder Migration, in Git Bash (PowerShell 5 schreibt UTF-16):
  `supabase gen types typescript --local --schema public > ../frontend/src/app/supabase/supabase.types.ts`
- Lokale API: `http://127.0.0.1:54321` (TLS aus), Android-Emulator `http://10.0.2.2:54321`

CI (PR auf `main`): Branch-Name-Check, Frontend Lint + Test + Build, Backend `supabase db reset`. Merge auf `main` deployt DB (Supabase) und Web (GitHub Pages).

## Regeln

### Git

- Nie direkt auf `main`. PR mit ≥1 Review und grüner CI.
- Branch (CI prüft): `<frontend|backend>/<agent>/<feat|bugfix|hotfix|release>/SCRUM-<nr>-<kurz>`
  z. B. `frontend/claude/feat/SCRUM-44-swiper`. `<agent>` = eigener Name (`claude`, `copilot`, `codex` …), Mensch = `human`.
- Ein Branch = ein Bereich: auf `frontend/`-Branches nur Frontend, auf `backend/`-Branches nur Backend.
- Ausnahme: `backend/`-Branch darf unter `frontend/` Datenzugriff ohne UI ändern (Supabase-Client, Types, Services, Guards, Callback-Handling, App-Init, Routen-Config, Dependencies, Environments + deren Unit-Tests). Nie Screens, Templates, Styles, native Config.
- Nie `push --force`, `reset --hard`.

### Daten & Sicherheit

- Schema nur per Migration in `backend/supabase/migrations/`. Nie im Dashboard ändern, nie `supabase db push` von Hand.
- Enum-Werte nur ergänzen (`alter type … add value`), nie entfernen.
- Jede nutzerbezogene Tabelle: RLS + Policy auf `(select auth.uid())`, Index auf `user_id`. `anon` hat keinen Zugriff.
- SQL-Funktionen: `set search_path = ''`, `security invoker` außer zwingend nötig.
- Secrets nur in `.env`/Environments, nie committen. Publishable Key darf in den Client, Service-Role-Key nie.

### Frontend-Code

- DB-Zugriff nur über typisierte Services in `frontend/src/app/supabase/services/`. Komponenten importieren nie `supabase-js`.
- Client per `inject(SUPABASE_CLIENT)` (`supabase.client.ts`). Tests überschreiben den Token mit einem Mock.
- Services liefern Domänen-Typen (`Tables<'x'>`, `TablesInsert`, `TablesUpdate`, `Enums`) und werfen bei `error`.
- `user_id` nie mitschicken (DB-Default `auth.uid()`).
- Kleine Standalone-Komponenten, Ionic-Komponenten statt Eigenbau, mobile-first.
- Services und Datenlogik brauchen Unit-Tests (Vitest).
- Immer an Design.md halten

## Datenmodell (Ist = Migrationen)

| Tabelle        | Spalten                                                                                                                                                               | Hinweise                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `profiles`     | `id` (= auth.users.id), `display_name` ≤50, `preferences` jsonb, `created_at`                                                                                         | Signup-Trigger legt an (Name aus Metadaten → Google → E-Mail-Prefix). Update nur `display_name`, `preferences`              |
| `garments`     | `id`, `user_id`, `image_path`_, `layer`_, `category`\*, `name` ≤100, `colors[]`, `seasons[]`, `brand` ≤100, `material`, `size_label` ≤20, `notes` ≤1000, `created_at` | \* Pflicht. Arrays default `{}`, GIN-Index. Check: Kategorie muss zum Layer passen                                          |
| `outfits`      | `id`, `user_id`, `name` ≤100 (optional), `created_at`                                                                                                                 |                                                                                                                             |
| `outfit_items` | PK (`outfit_id`, `layer`), `garment_id`                                                                                                                               | FK (`garment_id`, `layer`) → garments, max. 1 Teil pro Layer. Trigger: `full_body` schließt `top`/`bottom` aus. Kein UPDATE |

- RPC `save_outfit(p_outfit_id uuid, p_outfit_items jsonb)`: ersetzt alle Items eines bestehenden Outfits atomar. `[{"layer":"top","garment_id":"…"}]`
- Garment löschen → Trigger löscht alle Outfits, die es enthalten. Frontend warnt vorher.
- Storage: privater Bucket `garments`, Pfad `{user_id}/…`, max. 5 MB, `image/jpeg|png|webp`. Anzeige per Signed URL (Listen: `createSignedUrls`). Upload vor Insert, bei Insert-Fehler Datei löschen.

### Enums

- `garment_layer`: `outer` `top` `bottom` `full_body` `shoes`
- `garment_category`: outer `jacket blazer coat` · top `t_shirt shirt blouse polo tank_top sweater hoodie cardigan` · bottom `jeans trousers shorts skirt leggings sweatpants` · full_body `dress jumpsuit` · shoes `sneakers boots sandals heels dress_shoes` · `other` (jeder Layer)
- `garment_color`: `black white grey beige brown red pink orange yellow green blue purple gold silver petrol turquoise olive multicolor`
- `garment_season`: `spring summer autumn winter transitional_season`
- `garment_material`: `cotton linen wool cashmere silk denim leather faux_leather suede polyester viscose nylon other`

## Features (MVP, verbindlich)

Details nur bei Bedarf lesen. Quelle: Confluence Space SD › Features.

| ID  | Feature                  | Epic     | Kern                                                                                     | Details                                          |
| --- | ------------------------ | -------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------ |
| F00 | Authentication           | SCRUM-85 | E-Mail+PW, Google, Mail-Bestätigung, Reset, Display Name. Service fertig, Screens fehlen | `docs/features/F00-auth.md`                      |
| F01 | Digitale Garderobe       | SCRUM-35 | Foto → Storage + DB, Grid, Detail, Bearbeiten, Löschen                                   | `docs/features/F01-digitale-garderobe.md`        |
| F02 | Kleidungsstücke erfassen | SCRUM-42 | Merkmal-Formular, Pflicht Bild/Layer/Kategorie, Default-Name                             | `docs/features/F02-kleidungsstuecke-erfassen.md` |
| F03 | Garderobe filtern        | SCRUM-43 | Filter kombinierbar (UND), Suche, Leerzustand                                            | `docs/features/F03-garderobe-filtern.md`         |
| F04 | Outfit-Swiper            | SCRUM-44 | Karussell pro Layer, Lock, Speichern                                                     | `docs/features/F04-outfit-swiper.md`             |
| F05 | Outfits speichern        | SCRUM-45 | Name, Liste mit Vorschau, öffnen, umbenennen, löschen                                    | `docs/features/F05-outfits-speichern.md`         |

Reihenfolge: F00 → F01 → F02 → F03 + F04 → F05.

## Out of Scope

Erst nach dem MVP und nur mit eigener User Story. Nicht vorbauen:
Kleiderpuppe (verworfen), Outfit-Empfehlungen, KI-Styling-Assistent, automatische Erkennung (Foto/Etikett), Wetter, Anlass, Nachhaltigkeit/Brandcheck, Social, Shopping-Assistent.

## Offen (nicht ungefragt umsetzen)

Confluence weicht vom Schema ab. Schema gilt, bis das Team entscheidet:

- `favorite` fehlt in `garments` und `outfits` (F02, F03, F05)
- `outfits.notes` fehlt (F05)
- Saison `all_year` fehlt im Enum (F02)
- Confluence: Layer „überschreibbar“. DB erzwingt Kategorie↔Layer, frei nur bei `other` (F02)
- Confluence: Swiper mit 3 Ebenen. DB hat zusätzlich `outer` (optional) und `full_body` (F04)
- `environment.example.ts` nutzt `https://127.0.0.1:54321`, lokal läuft `http`
