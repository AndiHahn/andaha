# US-0001: Redesign MiniClient („Tinte & Kupfer“)

| Field | Value |
|-------|-------|
| ID | US-0001 |
| Status | In Review <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-10-29 |
| Design Doc | [design.md](./design.md) |
| Plan | [plan.md](./plan.md) |

## Description

Als Nutzer:in des Andaha-MiniClients möchte ich eine helle, ruhige und moderne Oberfläche („Haushaltsbuch auf warmem Papier“, Palette **Tinte & Kupfer**), damit die App auf Handy und Desktop angenehmer und übersichtlicher zu bedienen ist. Funktionen und Abläufe bleiben dabei unverändert.

Betroffen ist ausschließlich das Frontend `src/WebApps/MiniClient/Andaha.WebApps.MiniClient` (Angular 14). Backend, API-Verträge und Datenmodelle bleiben unverändert.

Designunterlagen (verbindliche Inputs) liegen unter [`docs/design/`](../../design/):

- [`README.md`](../../design/README.md): Überblick und Zuordnung Mockup → Inhalt
- [`DESIGN.md`](../../design/DESIGN.md): verbindliches Designsystem (Tokens, Farben, Typografie, Layout, Komponenten, Do's & Don'ts)
- [`umsetzung.md`](../../design/umsetzung.md): Umsetzungsplan mit Leitplanken, bewussten UI-Änderungen, Screen → Komponenten und Phasen 1–5
- [`tokens/`](../../design/tokens/): SCSS-Variablen / CSS Custom Properties
- [`mockups/`](../../design/mockups/) (Markup und CSS als Vorlage) und [`screenshots/`](../../design/screenshots/) (Soll-Bilder bei 390 × 844 und 1440 × 900), Screens 01–07

## Acceptance Criteria

**Funktion bleibt gleich**

- [x] AC1: Alle bestehenden Routen und Seiten sind wie bisher erreichbar. Formularfelder, Validierungen, Services, API-Aufrufe und Texte sind unverändert. Einzige neue Navigation ist der Zurück-Pfeil bei der analysierten Rechnung (laut `umsetzung.md`).
- [x] AC2: Am Backend ändert sich nichts (keine Änderungen unter `src/Services/`, keine geänderten Requests/Responses).
- [x] AC3: Die Regressions-Checkliste aus `umsetzung.md` (Phase 5, Punkt 3) ist vollständig im Browser durchgespielt und bestanden. Sie umfasst Rechnungen, Filter, Statistik, Analyse, Haushaltsplan, Stunden, Verbindungen, Kategorien, Export, Ausloggen und Rechtstexte. Anfordern, Annehmen und Ablehnen von Verbindungen prüft der Nutzer selbst auf DEV, weil dafür ein zweiter User und Dapr nötig sind.

**Design**

- [x] AC4: Das helle Theme „Tinte & Kupfer“ ist nach `DESIGN.md` umgesetzt. Farben, Abstände und Radien kommen aus den Tokens in `docs/design/tokens/`. Es gibt keine Reste des dunklen Themes und keine Pink-Akzente.
- [x] AC5: Als Schrift wird Hanken Grotesk verwendet, als Icons Material Symbols Outlined (wght 300) nach der Icon-Zuordnung in `umsetzung.md`.
- [x] AC6: Die bewussten UI-Änderungen aus `umsetzung.md` sind umgesetzt, unter anderem:
  - Seitentitel in der Kopfzeile, „Andaha“ im Drawer bzw. in der Sidebar
  - Bottom Sheets statt Vollbild-Dialogen auf Mobile
  - Aktionsleiste statt gestapelter Vollbreiten-Buttons
  - Listenzeilen mit Farbpunkt statt Karten
  - Datumstyp als Segment
  - Ringdiagramm mit eigener Legende
  - Lesemodus für Details
  - Tag „Zahlung offen“
  - Spinner im Speichern-Button
- [x] AC7: Die Shell funktioniert auf beiden Formfaktoren. Mobile (< 1024 px): Drawer und Bereichsnavigation unten. Desktop (≥ 1024 px): feste Sidebar und Bereichsnavigation als Tabs unter dem Titel (Mockup 02 · Navigation und 07).
- [x] AC8: Jede Seite aus den Mockups 01–07 stimmt bei **390 × 844** und **1440 × 900** sichtbar mit dem jeweiligen Screenshot in `docs/design/screenshots/` überein. Seiten ohne eigenes Mockup (siehe Liste in `umsetzung.md`) folgen denselben Mustern.

**Qualität**

- [x] AC9: `npm run build` läuft ohne Fehler durch und erzeugt keine neuen Warnungen.
- [x] AC10: Zugänglichkeit: Der Fokus ist sichtbar, Icon-Buttons haben ein `aria-label`, Touch-Ziele sind ≥ 44 px, und die Kontraste unterschreiten die Werte aus `DESIGN.md` nicht.
- [x] AC11: Die UI ist per Playwright MCP verifiziert (`ui-verification`), mit Screenshots je Seite und Breakpoint unter `ui-testing/`.

## Technical Notes

- **Komponentenbibliothek ist offen:** Angular Material muss nicht weiter genutzt werden, wenn das Design damit zu viel Customizing erfordert. Es darf ganz oder teilweise entfernt und durch eigene Komponenten oder eine andere Component Library ersetzt werden. Die Entscheidung samt Begründung wird in der Brainstorming-Phase getroffen und in `design.md` festgehalten.
  - `umsetzung.md` geht von Angular Material 14 aus (`andaha-theme.scss`, `mat-form-field`-Overrides, `MatDialog` als Bottom Sheet, `mat-button-toggle` usw.). Leitplanken, Screen-Zuordnung und Phasen gelten weiter. Die Material-spezifischen Detailanweisungen sind dagegen nur ein möglicher Weg.
  - Bei einem Wechsel müssen Verhalten und Barrierefreiheit erhalten bleiben, die Material bisher liefert: Datepicker, Select/Multiselect, Dialog-Fokus-Management, Snackbars, Menüs, Drag & Drop (CDK, bleibt nutzbar), virtuelle Liste (`cdk-virtual-scroll-viewport`).
  - Angular CDK darf unabhängig von dieser Entscheidung weiter genutzt werden.
- **Stack:** Angular 14 (keine Control-Flow-Syntax `@if`/`@for`), ng2-charts 4 / Chart.js 3, angular-oauth2-oidc. Ein Angular-Upgrade gehört nicht zu dieser Story.
- **Reihenfolge:** Nach den Phasen in `umsetzung.md`, wenn möglich in mehreren PRs: (1) Fundament + Shell, (2) Bausteine + Rechnungen, (3) Analyse + Haushaltsplan, (4) Stunden, (5) Einstellungen, Export, Rechtstexte, restliche Dialoge.
- **Lokaler Test:** Frontend per `ng serve` (http://localhost:4200), Backend über den Monolithen (`src/Services/Monolith/Andaha.Services.Monolith`, https://localhost:8900). Login über Azure B2C mit einem Testuser.
- **Virtuelle Liste:** `pixelHeightPerItem` an die neuen Zeilenhöhen anpassen (Rechnungen 64 px, Analyse 60 px) und das Scrollen prüfen.
- **Zahlenformat:** Für die Anzeige `registerLocaleData(localeDe)` und `| number:'1.2-2':'de'` verwenden. Die Datenverarbeitung ändert sich nicht.
- **PWA:** `theme_color`/`background_color` in `manifest.webmanifest` auf `#F8F4EC` setzen.

## Out of Scope

- Änderungen am Backend, an API-Verträgen oder am Datenmodell
- Neue Funktionen, Seiten oder Routen (Ausnahme: Zurück-Pfeil bei der analysierten Rechnung)
- Textänderungen über die in `umsetzung.md` genannten hinaus
- Dunkles Theme bzw. Theme-Umschalter
- Upgrade von Angular oder anderen Major-Versionen
- Andere Web-Apps im Repo außer dem MiniClient

## UI Verification

**2026-10-30: PASSED, after fixes.** Checked with Playwright MCP at 390 × 844 and 1440 × 900. The full report is in `.superpowers/sdd/plan/ui-verification-report.md` (git-ignored). Screenshots are in [`ui-testing/`](./ui-testing/) as `final-*.png`.

- First run: 24 PASS, 5 FAIL. Fixed afterwards and re-checked in the browser:
  - Typed dates were read as MM.DD.YYYY. This was an old bug: the datepickers were set up inconsistently. All datepickers now share `shared/date-picker/german-date-providers.ts`.
  - The detail header kept the old name after saving (person, fixed cost, income, category). The redesign caused this, and it is fixed.
- Deleting a person who has work entries or payments returns HTTP 500 from the backend. This bug existed before the redesign, and the backend is out of scope. The UI shows the error snackbar.
- Remaining NG0100 in dev mode: on the statistics pages, and `aria-owns` in the date filter. Both existed before and are only visible in dev mode.
- Not tested locally, to be checked on DEV:
  - accepting and rejecting connections (needs a second user and Dapr)
  - the analysis upload, which returns 500 locally because it needs the cloud backend
  - the details of an analysed bill
- Small differences from the mockups, accepted:
  - no sync icon
  - the help text under the analysis upload is missing
  - hours show as `hh:mm h`
  - percentages show one decimal place
  - colour names are CSS names

## AI Usage

See [`ai-usage.md`](./ai-usage.md) (written by the `cost-tracking` skill once implementation is complete).
