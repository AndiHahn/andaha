# US-0006: Angular-Upgrade des MiniClients von 14 auf 22

| Field | Value |
|-------|-------|
| ID | US-0006 |
| Status | Done <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-03 |
| Design Doc | [design.md](./design.md) |

## Description

Als Entwickler:in möchte ich den MiniClient (`src/WebApps/MiniClient/Andaha.WebApps.MiniClient`) auf Angular 22 bringen, damit die folgenden Stories (US-0007, US-0008) auf einer aktuellen, unterstützten Version entstehen und nicht später mitmigriert werden müssen.

Heute: Angular 14.2, Angular Material/CDK 14, TypeScript 4.8, RxJS 7.4, zone.js 0.11, Karma/Jasmine. Fremdbibliotheken: `angular-oauth2-oidc` 13, `@olafvv/ngx-pinch-zoom` 14, `ngx-mat-timepicker` 14, `ngx-webcam` 0.4, `ng2-charts` 4 / `chart.js` 3, `@angular/material-moment-adapter` / `moment`.

Das Upgrade ändert weder Funktion noch Aussehen. Maßstab für das Aussehen ist die aktuelle App: Vor dem Upgrade wird eine Screenshot-Baseline aufgenommen (`ui-testing/baseline/`), ergänzend gilt `docs/design/DESIGN.md`.

Empfohlene Reihenfolge: diese Story vor US-0007 und US-0008.

## Acceptance Criteria

- [x] AC1: Angular (core, CLI, compiler, router, forms, animations, service-worker), Angular Material und CDK stehen auf der neuesten 22.x-Version. TypeScript, RxJS und zone.js (bzw. zoneless, siehe Design) haben die Versionen, die Angular 22 verlangt.
- [x] AC2: Das Upgrade erfolgt Major für Major mit `ng update` und den offiziellen Migrationen (inkl. Material/MDC). Jeder Zwischenschritt baut.
- [x] AC3: Das Material-Theme ist auf die aktuelle Theming-API umgestellt. Alle Seiten sehen bei 390 px und 1440 px aus wie die vor dem Upgrade aufgenommene Baseline der aktuellen App (`ui-testing/baseline/`). Erlaubt sind nur kleine Pixelabweichungen, keine anderen Farben, Abstände, Schriftgrößen oder Komponentenformen.
- [x] AC4: Jede Fremdbibliothek läuft mit Angular 22: auf eine kompatible Version gehoben oder durch eine gleichwertige Lösung ersetzt. Die Entscheidung je Bibliothek steht im Design. Betroffen sind Login (OIDC), Pinch-Zoom auf Belegfotos, Zeitauswahl bei Arbeitszeiten, Kamera, Diagramme und Datumsauswahl.
- [x] AC5: Login funktioniert wie bisher, inklusive Refresh-Token und `domain_hint` (US-0002). Abmelden funktioniert.
- [x] AC6: PWA funktioniert wie bisher: Installation, Service Worker, Update-Hinweis mit „Neu laden“ (US-0005), Offline-Erfassung und Synchronisierung von Rechnungen.
- [x] AC7: Das Projekt nutzt den aktuellen Build-Weg von Angular (application builder). `ng build` für Produktion läuft ohne Fehler. Neue Warnungen sind behoben oder im Design begründet.
- [x] AC8: Die Frontend-Tests laufen mit dem Test-Runner, den das Design festlegt (Karma weiter oder Umstieg). Alle bestehenden Tests sind grün.
- [x] AC9: Dockerfile, Pipeline (`pipeline/`) und README nennen die neue Node-Version. Das Docker-Image des MiniClients baut.
- [x] AC10: Eine Regressionsprüfung mit Playwright (ui-verification) über alle Bereiche ist grün: Rechnungen (Liste, Filter, Hinzufügen, Details, Foto), Statistik, Analyse, Haushaltsplan, Stunden (inkl. Zeitauswahl und Zahlung), Einstellungen (Kategorien inkl. Drag & Drop, Verbindungen), Export, Rechtliches.

## Technical Notes

- Bibliotheks-APIs (Angular, Material, Fremdbibliotheken) per Context7 nachschlagen, nicht aus dem Gedächtnis.
- `ngx-webcam` wird in US-0007 durch die native Kamera ersetzt (`<input type="file" capture>`). Hat es keine kompatible Version, darf die native Kamera schon hier kommen, ohne sonst etwas am Ablauf zu ändern.
- Automatische Migrationen von `ng update` (z. B. Control Flow, `inject()`) dürfen übernommen werden. Ein manueller Umbau auf Standalone-Komponenten oder Signals ist nicht Teil dieser Story. Das Design legt fest, ob Standalone per Schematic migriert wird.
- Design-Tokens: `docs/design/v1/tokens/`.

## Out of Scope

- Neue Funktionen oder sichtbare UI-Änderungen (kommen in US-0007 und US-0008)
- Manueller Umbau auf Signals, Standalone-Komponenten oder zoneless, sofern nicht für das Upgrade nötig
- Backend-Änderungen

## UI Verification

- 2026-11-04, **PASSED.** Abschluss-Regression über alle Bereiche aus AC10 bei 390 px und 1440 px auf dem Endstand (28/28 Prüfungen, `ui-testing/phase4/`). Dazu der Vergleich aller 104 Baseline-Bilder (`ui-testing/final/`: 74 pixelgleich, 13 vernachlässigbar, 17 erklärt, siehe design.md „Abweichungen“) und die Prüfung von Offline-Erfassung und Synchronisierung (AC6, `ui-testing/final/ac6-offline-*`). Konsole: nur die schon vor dem Upgrade vorhandenen NG0100 (Ausgaben/Statistik) und die Warnung „ngModel mit formControl“ (Kategorie-Details).

## AI Usage

Siehe [ai-usage.md](./ai-usage.md).
