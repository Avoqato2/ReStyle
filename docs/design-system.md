# Design System – ReStyle

Source of Truth: `src/theme/variables.scss`
Figma: „Digital Wardrobe – UI Design“ (Referenz, nicht Quelle)
Gilt für: MVP, nur Light Mode

## Grundregeln
- Nur Tokens verwenden: keine Hex-, rgb()- oder px-Werte in Komponenten-SCSS.
- Ionic-Rollen über `color="..."` statt eigener Farben: `primary`, `secondary`, `danger`, `success`.
- Eigene Tokens nur mit Prefix `--rs-*`.
- Neuer Wert nötig → zuerst Token in `variables.scss` ergänzen (eigener PR-Teil), dann verwenden.
- Werte mit Kommentar „VORSCHLAG – nicht aus Figma“ sind vorläufig; Änderungen in Figma nachziehen.
- Kein `::ng-deep`, keine `!important`. Ionic-Komponenten über CSS Custom Properties stylen (`--background`, `--color` …).

## Farben
| Zweck | Token |
|---|---|
| Haupt-Aktion (CTA) | `primary` |
| Neben-Aktion | `secondary` |
| Fehler / destruktiv | `danger` |
| Erfolg | `success` |
| Seitenhintergrund | `--rs-color-bg-canvas` |
| Karten, Inputs | `--rs-color-bg-surface` |
| Hervorgehobene Fläche | `--rs-color-bg-subtle` |
| Fließtext | `--rs-color-text-primary` |
| Sekundärtext, Labels | `--rs-color-text-secondary` |
| Hinweise, Platzhalter | `--rs-color-text-muted` |
| Text auf Primary/Secondary | `--rs-color-text-on-primary` |
| Rahmen Standard / dezent | `--rs-color-border-default` / `--rs-color-border-subtle` |
| Akzent (sparsam, z. B. Badges) | `--rs-color-brand-coral` |

Nicht verwenden (veraltet): `#427ca6`, `#3e759e`, `#89618e`, `#3880ff`, reines Schwarz `#000000`.

## Button-Zustände
- Default = Hover (kein eigener Hover-Ton).
- Pressed = `shade` (automatisch über Ionic).
- Disabled = `--rs-color-primary-disabled` / `--rs-color-secondary-disabled`, keine Opacity.
- Schatten: `--rs-shadow-button`.
- Form: Pill (`--rs-radius-full`) für Standard-Buttons, `--rs-radius-lg` für große Karten-Buttons.

## Typografie
- Headlines (h1–h3): `--rs-font-heading` (Playfair Display).
- Alles andere: `--rs-font-body` (Inter).
- Größen nur über `--rs-font-size-*`, Line-Height passend: xs→16, sm→20, md→24, lg/xl→32.
- Keine weiteren Schriften (kein Roboto, kein Geist).

## Spacing
- Raster 4 px, nur `--rs-space-*`.
- Seitenrand: `--rs-space-4`.
- Abstand zwischen Elementen in Liste/Form: `--rs-space-3`.
- Abstand zwischen Sektionen: `--rs-space-6` bzw. `--rs-space-8`.

## Radius & Schatten
- Inputs, Chips: `--rs-radius-md`.
- Karten (Kleidungsstück, Outfit): `--rs-radius-lg` + `--rs-shadow-card`.
- Modals, Popover, Action Sheets: `--rs-radius-xl` + `--rs-shadow-overlay`.

## Do / Don't
```scss
// ✅
.item-card {
  padding: var(--rs-space-3);
  border-radius: var(--rs-radius-lg);
  box-shadow: var(--rs-shadow-card);
  background: var(--rs-color-bg-surface);
}

// ❌
.item-card {
  padding: 13px;
  border-radius: 10px;
  background: #fff;
}
```
```html
<!-- ✅ -->
<ion-button color="primary">Speichern</ion-button>
<!-- ❌ -->
<ion-button style="--background: #35688e">Speichern</ion-button>
```

## Offene Punkte (Figma-Aufräumen, Backlog)
- Abweichung `#3e759e` in Frame 929-36364 → `#35688e`.
- Doppelte/inkonsistente Variablen-Namen vereinheitlichen (`primery`, `scond`, `widht`, `spscing`).
- shadcn/Material/Tailwind-Platzhalter ersetzen (v. a. Frame 653-39942).
- Vorschlags-Tokens (Status, Radius, Shadows, Spacing ab 16) in Figma übernehmen oder anpassen.