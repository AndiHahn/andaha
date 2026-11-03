# US-0006 Angular-Upgrade 14 → 22 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MiniClient läuft auf Angular 22.2.x mit Material/CDK 22 (M2-Theme), Standalone-Komponenten, application builder und Vitest, ohne sichtbare oder funktionale Änderung.

**Architecture:** Schrittweises `ng update` Major für Major mit allen Migrationen, Fremdbibliotheken im Schritt, in dem sie blockieren. Danach automatische Code-Migrationen (Standalone, Control Flow, `inject()`), Test-Runner-Umstieg und Infrastruktur. Jeder Task endet mit grünem Produktions-Build und einem Commit.

**Tech Stack:** Angular 22, Angular Material/CDK 22 (M2-API), `@angular/build` (application, unit-test), Vitest Browser-Modus mit Playwright/Chromium, angular-oauth2-oidc 22, ngx-mat-timepicker 22, ng2-charts 11 / chart.js 4, @meddv/ngx-pinch-zoom 20, Node 24.

**Spec:** [design.md](./design.md), Story: [story.md](./story.md)

## Global Constraints

- Arbeitsverzeichnis Frontend: `src/WebApps/MiniClient/Andaha.WebApps.MiniClient` (unten „App-Ordner“).
- Branch: `feature/us-0006-angular-upgrade` von `master`. Commits mit Trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Keine sichtbare Änderung gegenüber der Baseline `docs/stories/US-0006-angular-upgrade/ui-testing/baseline/` (390 × 844 und 1440 × 900). Keine neuen Funktionen.
- Theme bleibt **Material 2** (`mat.m2-*`-API). Kein Material 3.
- Build-Ausgabe bleibt flach: `outputPath: { "base": "dist/andaha.web-apps.mini-client", "browser": "" }`.
- Kein Test darf gelöscht oder ausgehebelt werden, um grün zu werden.
- Endstand jedes Tasks: `npm install` ohne `--force`/`--legacy-peer-deps` erfolgreich, `npx ng build --configuration production` grün. `--force` ist nur innerhalb eines Tasks als Zwischenschritt erlaubt.
- Bibliotheks-APIs (Angular-Migrationen, Material-Overrides, oauth2-oidc, ng2-charts, chart.js, timepicker, pinch-zoom, Vitest) **per Context7 nachschlagen**, nicht aus dem Gedächtnis.
- Serena für Code-Navigation und symbolische Edits nutzen, wo sinnvoll (`.claude/rules/agentflow.md`).
- Lokale Umgebung: Backend (Monolith) läuft auf https://localhost:8900, nicht neu starten. Frontend `npx ng serve` auf http://localhost:4200 muss nach jedem `npm install` neu gestartet werden (alten Prozess beenden). Der Playwright-Browser ist als Testuser eingeloggt. Zugangsdaten gibt nur der Controller weiter; **nie in Dateien, Commits oder Logs schreiben**. Dapr-Fehler im Backend-Log ignorieren.
- Sichtprüfung je Task: betroffene Ansichten bei 390 × 844 mit Playwright gegen die gleichnamigen Baseline-Bilder vergleichen; Abweichungen beheben, bevor committet wird. Screenshots des Tasks unter `ui-testing/task-<N>/`.

## Review Focus

1. **Token-Ersetzung im Deployment:** Nach `npm run build:prod` müssen `#{monolithApiBaseUrl}#`, `#{gatewayBaseUrl}#`, `#{authClientId}#`, `#{authScope}#` unverändert in einer `.js`-Datei direkt in `dist/andaha.web-apps.mini-client/` stehen (CD-Pipeline ersetzt `drop/*.js`). Check in Task 3 und Task 8.
2. **Login nach oauth2-oidc-Upgrade:** Login-Redirect, Refresh-Token-Erneuerung und Abmelden müssen funktionieren (`domain_hint` aus US-0002 bleibt im Auth-Request). Check in Task 4.
3. **Dialoge als Bottom Sheet auf Mobile:** Nach MDC ändert sich die DOM-Struktur von `mat-dialog-container`; die eigene Panel-Klasse muss weiterhin unten andocken, Radius 20 oben, Scrim-Farbe aus DESIGN.md. Check in Task 2.
4. **Deutsches Datumsformat:** Datepicker parst und zeigt `TT.MM.JJJJ` (Provider `shared/date-picker/german-date-providers.ts`), Zeitauswahl bei Arbeitszeiten liefert dieselben Werte wie vorher. Check in Task 2 und Task 4.
5. **Service Worker / Update-Hinweis:** `ngsw-worker.js` und `ngsw.json` liegen im Ausgabeordner, der Update-Hinweis „Neu laden“ (US-0005) erscheint weiter. Check in Task 3 und Task 8.

---

### Task 1: Branch, Ausgangszustand, Kamera ohne ngx-webcam

`ngx-webcam` blockiert spätere Schritte und wird ohnehin entfernt. Zuerst, damit die Majors ohne diese Abhängigkeit laufen.

**Files:**
- Modify: `features/bill/modules/add-bill-image-dialog/add-bill-image-dialog.component.{ts,html,scss}`, `add-bill-image-dialog.module.ts` (alle unter `src/app/`)
- Modify: `package.json`, `package-lock.json`
- Test: `src/app/features/bill/modules/add-bill-image-dialog/add-bill-image-dialog.component.spec.ts` (neu)

**Interfaces:**
- Produces: Dialog liefert wie bisher ein Bild an `add-bill-image-dialog.service.ts` zurück (Rückgabetyp unverändert), Verkleinerung über `compressImage` aus `shared/utils/image-utils.ts`.

- [ ] **Step 1:** `git switch master && git pull && git switch -c feature/us-0006-angular-upgrade`. Prüfen, dass `docs/stories/US-0006-angular-upgrade/ui-testing/baseline/` existiert (vom Controller vor dem Lauf aufgenommen). Fehlt sie: stoppen und melden.
- [ ] **Step 2:** Ausgangszustand messen: `npm ci && npx ng build --configuration production && npx ng test --watch=false --browsers=ChromeHeadless`. Ergebnis (grün/rot, Anzahl Tests) im Task-Bericht festhalten.
- [ ] **Step 3: Failing test** `add-bill-image-dialog.component.spec.ts`: „Kamera-Option öffnet Datei-Input mit capture“ → im Template existiert `input[type=file][accept="image/*"][capture="environment"]`; „gewähltes Bild wird zurückgegeben“ → `change`-Event mit einer `File` schließt den Dialog mit dem (verkleinerten) Bild (MatDialogRef-Spy `close` aufgerufen). Laufen lassen: FAIL.
- [ ] **Step 4:** `WebcamModule` und alle ngx-webcam-Nutzung entfernen. Die Option „Kamera“ des bestehenden Radio-Umschalters öffnet stattdessen den Datei-Input mit `capture="environment"`; die Option Galerie/Datei bleibt. Kein sonstiger Umbau des Ablaufs.
- [ ] **Step 5:** `npm uninstall ngx-webcam`. Test grün, Build grün.
- [ ] **Step 6:** Sichtprüfung: Rechnung hinzufügen → Foto-Dialog bei 390 px, Datei per Playwright `browser_file_upload` hochladen, Vorschau erscheint. Vergleich mit Baseline.
- [ ] **Step 7:** Commit `refactor(miniclient): native camera input instead of ngx-webcam (US-0006)`.

### Task 2: Angular 15 und Material-MDC-Migration

Größter Task: Legacy-Material → MDC, alle eigenen Overrides neu.

**Files:**
- Modify: `package.json`, `package-lock.json`, `angular.json`, `src/themes/andaha-theme.scss`, `src/themes/_andaha-tokens.scss`, `src/styles.scss`, alle Komponenten-Templates/-Styles, die die Migration anfasst
- Test: bestehende Specs

**Interfaces:**
- Produces: Material-Komponenten ohne `legacy`-Imports; Theme-Datei bleibt `src/themes/andaha-theme.scss` (Einstieg für spätere Tasks).

- [ ] **Step 1:** `npx ng update @angular/core@15 @angular/cli@15` und `npx ng update @angular/material@15 @angular/cdk@15`. Migrationen ausführen. Fremdbibliotheken auf die zu 15 passende Major heben (`angular-oauth2-oidc`, `ngx-mat-timepicker`, `ng2-charts`; Versionen per `npm view <pkg> peerDependencies` wählen). `@olafvv/ngx-pinch-zoom` bleibt (ggf. `--force` als Zwischenschritt).
- [ ] **Step 2:** `npx ng generate @angular/material:mdc-migration` für alle Komponenten. Danach dürfen keine `@angular/material/legacy-*`-Imports übrig sein: `grep -r "legacy-" src` → keine Treffer.
- [ ] **Step 3:** Theme auf die in 15 gültige API bringen (Paletten aus `_andaha-tokens.scss` unverändert, Typografie Hanken Grotesk wie bisher). `npx ng build --configuration production` grün.
- [ ] **Step 4:** Eigene Overrides umschreiben. Ausgangsliste: alle Selektoren `.mat-dialog-container`, `.mat-progress-bar-*`, `.mat-checkbox-*`, `.mat-radio-*`, `.mat-select-*`, `.mat-option*`, `.mat-menu-*`, `.mat-snack-bar-container`, `.mat-calendar-body-selected`, `.mat-datepicker-*`, `.mat-drawer*`, `.mat-icon-button`, `.mat-paginator*` in `src/**/*.scss`. Je Override zuerst Theme-Wert, dann Komponenten-Token/Override-Mixin, zuletzt MDC-Klasse (`.mdc-*`, `.mat-mdc-*`).
- [ ] **Step 5:** Tests: `npx ng test --watch=false --browsers=ChromeHeadless` grün (Specs nur anpassen, wo Material-Harnesses/Selektoren sich durch MDC geändert haben).
- [ ] **Step 6: Sichtprüfung gegen Baseline (390 und 1440)** mindestens: Rechnungsliste, Datumfilter-Sheet, Rechnung hinzufügen (Selects geöffnet), Datepicker offen (Format `TT.MM.JJJJ`, Eingabe „01.10.2026“ wird korrekt geparst), Rechnungsdetails, Statistik mit Kategorie-Sheet, Drawer offen, Haushaltsplan-Bearbeiten (Speichern läuft = Spinner), Person mit Zahlungs-Sheet, Arbeitszeit mit Zeitauswahl, Kategorien inkl. Checkbox/Radio, Export (Fortschrittsbalken), Snackbar, Paginator in der Analyse-Liste. **Dialoge auf Mobile docken unten an** (Review Focus 3). Abweichungen beheben.
- [ ] **Step 7:** Commit `chore(miniclient): angular 15 + material mdc migration (US-0006)`.

### Task 3: Angular 16, 17, 18 und application builder

**Files:**
- Modify: `package.json`, `package-lock.json`, `angular.json`, `tsconfig*.json`, `src/polyfills.ts` (entfällt), ggf. von Migrationen berührte Dateien

**Interfaces:**
- Produces: `angular.json` mit `"builder": "@angular/build:application"` (bzw. dem Builder, den die Migration in 17/18 setzt), `outputPath: { "base": "dist/andaha.web-apps.mini-client", "browser": "" }`, `polyfills: ["zone.js"]`; Konfigurationen `production`, `local-pwa`, `development` erhalten.

- [ ] **Step 1:** Je Major 16, 17, 18: `npx ng update @angular/core@<v> @angular/cli@<v> @angular/material@<v> @angular/cdk@<v>`, Fremdbibliotheken auf passende Major, `npm install`, `npx ng build --configuration production` grün, ein Commit pro Major (`chore(miniclient): angular <v> (US-0006)`).
- [ ] **Step 2:** Im Schritt 17 oder 18 die Migration `use-application-builder` ausführen (`npx ng update @angular/cli --name use-application-builder`). `outputPath` auf das flache Objekt setzen, `polyfills.ts` entfernen und `"polyfills": ["zone.js"]` eintragen. `stylePreprocessorOptions.includePaths` bleibt.
- [ ] **Step 3:** Theme-Aufrufe auf die `mat.m2-*`-Namen umstellen, sobald die Migration sie anbietet oder die alten Namen veraltet sind (spätestens 18).
- [ ] **Step 4: Ausgabe prüfen (Review Focus 1 und 5):** `npm run build:prod`, dann
  `ls dist/andaha.web-apps.mini-client/` → enthält `index.html`, `ngsw-worker.js`, `ngsw.json`, `manifest.webmanifest`, `staticwebapp.config.json`, kein Unterordner `browser/`;
  `grep -l "#{monolithApiBaseUrl}#" dist/andaha.web-apps.mini-client/*.js` → mindestens eine Datei; dasselbe für `#{authClientId}#`.
- [ ] **Step 5:** Tests mit Karma grün (Karma-Builder des jeweiligen Majors, ggf. `@angular/build:karma`).
- [ ] **Step 6:** Sichtprüfung gegen Baseline bei 390: Rechnungsliste, Hinzufügen, Statistik, Stunden, Kategorien. Konsole ohne Fehler.
- [ ] **Step 7:** Commits wie in Step 1, application builder als eigener Commit `build(miniclient): application builder with flat output (US-0006)`.

### Task 4: Angular 19 bis 22 und Fremdbibliotheken auf Endstand

**Files:**
- Modify: `package.json`, `package-lock.json`, `src/app/app.module.ts` (Provider), `src/app/features/bill/modules/bill-image-dialog/*`, `src/app/features/bill/modules/bill-image/bill-image.module.ts`, `src/app/features/bill/modules/expenses/chart/chart.component.ts`, `chart.module.ts`, `src/app/shared/date-picker/time-picker-form-field/*`, `src/styles.scss` (Pinch-Zoom-/Timepicker-Styles)

**Interfaces:**
- Produces: Endversionen Angular/Material/CDK 22.2.x, `angular-oauth2-oidc` 22.x, `ngx-mat-timepicker` 22.1.x, `ng2-charts` 11.x + `chart.js` 4.x, `@meddv/ngx-pinch-zoom` 20.x, `moment` 2.x; `@angular/material-moment-adapter` und `@olafvv/ngx-pinch-zoom` entfernt.

- [ ] **Step 1:** Major 19: update wie Task 3, dann `@olafvv/ngx-pinch-zoom` durch `@meddv/ngx-pinch-zoom` ersetzen (Import-Pfade/Modulnamen per Context7 bzw. README des Pakets). Pinch, Doppeltipp-Zoom und Grenzen im Foto-Dialog verhalten sich wie vorher (Playwright: Dialog öffnen, Zoom per `browser_evaluate` auslösen bzw. Doppelklick, Screenshot).
- [ ] **Step 2:** Majors 20, 21, 22 nacheinander, je ein Commit, Build grün.
- [ ] **Step 3:** Endstand Fremdbibliotheken: `angular-oauth2-oidc` 22, `ngx-mat-timepicker` 22.1, `ng2-charts` 11 + `chart.js` 4 (Chart-Konfiguration in `chart.component.ts` an chart.js 4 anpassen; Registrierung gemäß ng2-charts 11, z. B. `provideCharts(withDefaultRegisterables())`), `@angular/material-moment-adapter` deinstallieren. `npm install` ohne `--force` grün.
- [ ] **Step 4: Login prüfen (Review Focus 2):** Abmelden, erneut anmelden (Controller liefert Zugangsdaten), Netzwerk-Request zum Authorize-Endpoint enthält `domain_hint`; Access-Token-Erneuerung per Refresh-Token: `oauthService.refreshToken()` per `browser_evaluate` bzw. Ablauf abwarten, danach API-Calls weiter 200.
- [ ] **Step 5: Datum/Zeit (Review Focus 4):** Arbeitszeit anlegen mit 08:00–12:30 und Datum „01.10.2026“, gespeicherte Werte in der Liste identisch; Datepicker-Eingabe „15.11.2026“ geparst.
- [ ] **Step 6:** Statistik-Ring wie Baseline (Farben, Lücken, Summe in der Mitte). Karma-Tests grün.
- [ ] **Step 7:** Commits je Major plus `chore(miniclient): third-party libraries for angular 22 (US-0006)`.

### Task 5: Vitest statt Karma

**Files:**
- Modify: `angular.json` (test-Target), `package.json`, `tsconfig.spec.json`, alle `src/**/*.spec.ts` mit Jasmine-APIs (12 Dateien)
- Delete: `karma.conf.js`, `src/test.ts`, Karma-/Jasmine-Pakete

**Interfaces:**
- Produces: `"test": { "builder": "@angular/build:unit-test", "options": { "runner": "vitest", "browsers": ["chromium"], ... } }`; `npm test` = `ng test` läuft einmalig headless mit `--watch=false`.

- [ ] **Step 1:** Falls in 22 vorhanden, offizielles Schematic für Karma→Vitest bzw. Jasmine→Vitest ausführen (per Context7 prüfen). Sonst test-Target manuell setzen und `vitest`, `@vitest/browser`, `playwright` (bzw. vom Builder verlangte Pakete) als devDependencies installieren.
- [ ] **Step 2:** Specs umschreiben: `jasmine.createSpyObj` → Objekte mit `vi.fn()`, `jasmine.SpyObj<T>` → `Mocked<T>`, `spyOn` → `vi.spyOn`, `.and.returnValue` → `.mockReturnValue`, `jasmine.clock()` → `vi.useFakeTimers()`/`vi.advanceTimersByTime`, `jasmine.any` → `expect.any`.
- [ ] **Step 3:** `npx ng test --watch=false` → alle Specs grün, Anzahl Tests ≥ Ausgangszustand aus Task 1 Step 2 (plus neuer Test aus Task 1). `image-utils.spec.ts` läuft mit echtem Canvas.
- [ ] **Step 4:** Karma-Dateien und -Pakete entfernen, `grep -rn "jasmine" src package.json` → keine Treffer.
- [ ] **Step 5:** Commit `test(miniclient): vitest browser mode instead of karma (US-0006)`.

### Task 6: Standalone, Control Flow, inject()

**Files:**
- Modify: praktisch alle Komponenten unter `src/app/`, Routing-Dateien, `src/main.ts`
- Create: `src/app/app.config.ts`, `src/app/app.routes.ts` (Namen wie von der Schematic erzeugt)
- Delete: NgModules, die die Schematic entfernt

**Interfaces:**
- Produces: `bootstrapApplication(AppComponent, appConfig)` in `main.ts`; `appConfig.providers` enthält HTTP-Client mit den bisherigen Interceptoren, OAuth (`provideOAuthClient` bzw. Äquivalent der Version 22 mit derselben Konfiguration wie in `app.module.ts`), Service Worker (`provideServiceWorker('ngsw-worker.js', <bisherige Optionen>)`), Animations, Locale/Datum-Provider, Charts, Router. Lazy Routes per `loadChildren`/`loadComponent`.

- [ ] **Step 1:** `npx ng generate @angular/core:standalone`, Modus 1 (convert-to-standalone), Build grün, Commit.
- [ ] **Step 2:** Modus 2 (prune-ng-modules), Build grün, Commit.
- [ ] **Step 3:** Modus 3 (standalone-bootstrap), Provider aus `app.module.ts` vollständig nach `app.config.ts`. Build grün, Commit.
- [ ] **Step 4:** `npx ng generate @angular/core:control-flow` und `npx ng generate @angular/core:inject`; ggf. `@angular/core:self-closing-tag`. Build und Tests grün, Commit.
- [ ] **Step 5:** `grep -rn "NgModule" src/app` → nur noch Fälle, die die Schematic bewusst stehen lässt; im Task-Bericht auflisten.
- [ ] **Step 6:** Sichtprüfung gegen Baseline (390): je eine Seite pro Bereich, Login-Zustand, Lazy-Routen per Direktaufruf (`/budgetplan/fixedcost`, `/work`, `/settings`) und Reload. Konsole ohne Fehler.
- [ ] **Step 7:** Commit `refactor(miniclient): standalone components, control flow, inject (US-0006)`.

### Task 7: Infrastruktur und Doku

**Files:**
- Modify: `src/WebApps/MiniClient/Andaha.WebApps.MiniClient/Dockerfile`, `src/WebApps/MiniClient/pipeline/ci-pipeline.yml`, `src/WebApps/MiniClient/pipeline/cd-pipeline.yml`, `src/WebApps/MiniClient/Andaha.WebApps.MiniClient/README.md`, `package.json` (`engines`)

- [ ] **Step 1:** Dockerfile: `FROM node:24-alpine AS node`, `RUN npm ci`, `RUN npm run build:prod`, Kopierpfad unverändert `dist/andaha.web-apps.mini-client`.
- [ ] **Step 2:** Beide Pipelines: vor dem ersten Npm-Schritt `- task: NodeTool@0` mit `inputs: versionSpec: '24.x'`; `install --force` → `ci`. Den Schritt „install typescript“ (Repo-Root) entfernen, wenn `npm ci && npm run build:prod` im App-Ordner ohne ihn grün ist. `CopyFiles` und `replacetokens` unverändert.
- [ ] **Step 3:** `package.json` `engines.node` auf die Range aus `@angular/core@22` (`npm view @angular/core@22 engines`). README: Node 24, `npm test` (Vitest), Build-Befehle.
- [ ] **Step 4:** `docker build -t andaha-miniclient-test src/WebApps/MiniClient/Andaha.WebApps.MiniClient` erfolgreich (falls Docker lokal nicht läuft: im Bericht vermerken, nicht als Fehler werten). Danach Ausgabe-Check aus Task 3 Step 4 erneut.
- [ ] **Step 5:** Commit `build(miniclient): node 24 in docker and pipelines (US-0006)`.

### Task 8: Abschluss-Regression

UI-geprüft (Phase 4 läuft danach zusätzlich über `ui-verification`).

- [ ] **Step 1:** `npm ci && npx ng build --configuration production && npx ng build --configuration local-pwa && npx ng build --configuration development && npx ng test --watch=false` → alles grün; Bundle-Budgets ohne Fehler (Warnungen begründen in design.md „Abweichungen“).
- [ ] **Step 2:** Production-Build lokal mit Service Worker servieren (`npx http-server dist/andaha.web-apps.mini-client -p 4300` o. ä.), in Playwright öffnen: Service Worker registriert (`navigator.serviceWorker.controller` nicht null nach Reload). Update-Hinweis: zweiten Build mit geänderter Datei erzeugen, Seite neu laden → Hinweis „Neu laden“ erscheint (Review Focus 5). Gelingt das lokal nicht (Login-Redirect auf 4300), im Bericht begründen.
- [ ] **Step 3:** Vollständiger Vergleich aller Baseline-Bilder (390 und 1440) gegen die laufende App auf 4200, Screenshots unter `ui-testing/final/`. Jede Abweichung beheben oder in design.md „Abweichungen“ begründen.
- [ ] **Step 4:** design.md „Abweichungen“ ausfüllen (Bibliotheksversionen, Budgets, alles was vom Design abweicht). Commit `docs(us-0006): upgrade deviations and final screenshots`.
