# US-0003: Aufräumarbeiten nach dem Redesign

| Field | Value |
|-------|-------|
| ID | US-0003 |
| Status | In Review <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-01 |
| Design Doc | [design.md](./design.md) |
| Plan | [plan.md](./plan.md) |

## Description

Als Nutzer:in des MiniClients (hauptsächlich als installierte PWA am Handy) möchte ich, dass nach dem Redesign „Tinte & Kupfer“ ([US-0001](../US-0001-miniclient-redesign/story.md)) drei störende Kleinigkeiten behoben sind. Die App soll sich dann wie eine native App bedienen lassen: ohne Seiten-Scrollen, mit einer ruhigen Suche und einem eindeutigen Export-Feedback.

1. **Bildschirmhöhe in der PWA:** In der installierten PWA ist die App höher als der Bildschirm. Die Menüpunkte der unteren Leiste (Bottom-Navigation) sind erst nach dem Scrollen sichtbar. Die Seite selbst soll nicht scrollen, scrollen sollen nur Listen innerhalb der App.
2. **Rechnungssuche:** Die Suche startet oft schon, während man noch tippt. Sie soll erst laufen, wenn man mit der Eingabe fertig ist, und veraltete Ergebnisse sollen keine neueren überschreiben.
3. **Export:** Ein Klick auf „Ausgaben exportieren“ oder „Personen/Arbeitszeiten exportieren“ zeigt in **beiden** Zeilen einen Loading-Spinner. Der Spinner soll nur bei der Zeile erscheinen, deren Button gedrückt wurde.

## Acceptance Criteria

**Bildschirmhöhe (PWA)**

- [ ] AC1: In der installierten PWA am Handy (Standalone-Modus) ist die untere Navigationsleiste beim Öffnen jeder Hauptseite vollständig sichtbar, ohne zu scrollen.
- [x] AC2: Das Dokument selbst (`html`/`body`/App-Shell) hat keine Scrollbar. Gescrollt wird nur innerhalb von Listen- bzw. Inhaltsbereichen, z. B. der Rechnungsliste. Kopfzeile und untere Leiste bleiben dabei stehen.
- [ ] AC3: Safe Areas (Notch, Home-Indikator) werden berücksichtigt: Die untere Leiste wird weder vom Home-Indikator verdeckt, noch entsteht darunter ein doppelter Abstand.
- [x] AC4: Im normalen Browser (Handy und Desktop) bleibt das Layout wie bisher korrekt, ohne Seiten-Scrollbar.

**Rechnungssuche**

- [x] AC5: Die Suche startet erst, nachdem die Eingabe für eine kurze Pause ruht (Wert wird im Design festgelegt; bisher 300 ms). Während man zügig tippt, läuft keine Zwischensuche.
- [x] AC6: Kommt eine neue Suche, während eine ältere noch läuft, wird die ältere verworfen. Die Liste zeigt immer das Ergebnis des zuletzt eingegebenen Suchbegriffs.
- [x] AC7: Unveränderte Eingaben (z. B. Leerzeichen am Ende, gleicher Begriff erneut) lösen keine erneute Suche aus. Das Leeren des Suchfelds bzw. „Suche löschen“ setzt die Liste sofort zurück.

**Export**

- [x] AC8: Ein Klick auf „Ausgaben exportieren“ zeigt den Spinner nur in dieser Zeile, ein Klick auf „Personen/Arbeitszeiten exportieren“ nur in jener.
- [x] AC9: Während ein Export läuft, kann kein zweiter Export gestartet werden (beide Buttons gesperrt, wie bisher). Nach Abschluss oder Fehler verschwindet der Spinner und beide Buttons sind wieder aktiv.

**Allgemein**

- [x] AC10: Funktionen, Texte und das Design „Tinte & Kupfer“ bleiben ansonsten unverändert. Es gibt keine Backend-Änderungen.

## Technical Notes

Frontend: `src/WebApps/MiniClient/Andaha.WebApps.MiniClient` (Angular 14).

- **Höhe:** Die App-Shell setzt `height: 100vh; height: 100dvh;` in `src/app/app.component.scss`, dazu `height: 100%` in `src/styles.scss`. Ursache in der PWA klären: `vh` vs. `dvh`, Safe-Area-Insets (`env(safe-area-inset-*)`, `viewport-fit=cover`), Manifest `display`, und welcher Container eigentlich scrollt. Offen: Auf welchem Gerät bzw. Betriebssystem tritt das auf (iPhone/Android)? Im Brainstorming klären.
- **Suche:** `src/app/features/bill/modules/bill-list/bill-list-filter/bill-list-filter.component.ts` verwendet bereits `debounceTime(300)` + `distinctUntilChanged`. Zu prüfen sind ein längeres Debounce, ob verworfene ältere Requests über `switchMap` abgebrochen werden, und das Trimmen des Suchbegriffs. Die Suche ruft die API auf (paginierte Rechnungsliste).
- **Export:** `src/app/features/export/export.component.html` bindet beide `mat-spinner` an dasselbe Flag `isExporting` (Zeilen 6 und 13). Es braucht ein Flag pro Export bzw. die Information, welcher Export gerade läuft.
- UI-Verifikation (Playwright) mit mobiler Viewport-Größe (390 × 844). Den Standalone-Modus der PWA kann Playwright nur annähern, deshalb ist ein abschließender Check am echten Gerät durch den Nutzer nötig.

## Out of Scope

- Weitere Design-Änderungen oder neue Funktionen
- Serverseitige Suchlogik bzw. Änderungen an der Such-API
- Neue Export-Formate oder -Inhalte

## UI Verification

**2026-11-01 – PASSED** (Playwright MCP, `ng serve` lokal, API per Playwright-Route gemockt, Login per Fake-Token im Local Storage):

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | 9 Routen (Rechnungen/Liste/Hinzufügen/Statistik, Analyse, Haushaltsplan, Stunden, Einstellungen, Export, AGB) bei 390 × 844 und 1440 × 900: keine Dokument-Scrollbar (`scrollHeight − innerHeight = 0`, `scrollTop` bleibt 0) | PASS | |
| 2 | Untere Leiste bei 390 × 844 auf allen Bereichsseiten vollständig sichtbar (780–844 px) | PASS | `ui-testing/mobile-bill-list-bottom-nav.png` |
| 3 | Innen-Scrollen intakt: Rechnungsliste (virtueller Scroll), AGB/Datenschutz (`main.content`) | PASS | |
| 4 | Suche: Tippen mit 250-ms-Pausen → keine Suche während des Tippens, genau eine („Billa“) nach der Pause | PASS | |
| 5 | Suche: Enter → sofortige Suche (< 150 ms), keine Doppelsuche nach Ablauf der Pause; Leerzeichen am Ende → keine neue Suche; „Suche löschen“ → sofortiger Reset | PASS | |
| 6 | Suche: „B“ tippen und sofort löschen → keine überflüssige Suche; Tastatur-Hinweis `enterkeyhint="search"` | PASS | |
| 7 | Export „Ausgaben“: Spinner nur in dieser Zeile, beide Buttons gesperrt; danach zurückgesetzt; genau 1 Export-Request | PASS | `ui-testing/export-spinner-expenses.png` |
| 8 | Export „Personen/Arbeitszeiten“: Spinner nur in dieser Zeile; danach zurückgesetzt | PASS | |
| 9 | Bottom-Sheet (Filter) öffnet bündig am unteren Rand, keine Dokument-Scrollbar; Safe-Area-Regeln für Sheet und Snackbar aktiv | PASS | `ui-testing/mobile-filter-sheet.png` |

Nicht im Browser prüfbar: echte Safe-Area-Insets und der Standalone-Modus der Android-PWA (AC1/AC3). **Offen: Check durch den Nutzer am Android-Gerät** (PWA öffnen, untere Leiste sichtbar ohne Scrollen; einen Bottom-Sheet-Dialog wie „Rechnung hinzufügen“ öffnen und prüfen, dass „Speichern“ nicht unter der Systemleiste liegt; Snackbar).

## AI Usage

See [ai-usage.md](./ai-usage.md).
