# US-0006 Design: Angular-Upgrade des MiniClients von 14 auf 22

Stand: 2026-11-03. Story: [story.md](./story.md).

## Ziel und Warum

Der MiniClient (`src/WebApps/MiniClient/Andaha.WebApps.MiniClient`) läuft auf Angular 14. US-0007 und US-0008 bauen viel neue Oberfläche. Entsteht sie auf 14, muss sie später mitmigriert werden, vor allem durch den MDC-Umbau von Angular Material. Deshalb kommt das Upgrade zuerst.

**Erfolg:** Die App läuft auf Angular 22.x, sieht aus und verhält sich wie vorher, und neue Komponenten können direkt als Standalone-Komponenten mit aktueller Syntax geschrieben werden.

**Anti-Ziel:** sichtbare Änderungen am Design v1, neue Funktionen oder ein halb migrierter Zustand (z. B. Legacy-Material-Imports, Mischbetrieb von NgModules und Standalone ohne Grund).

## Ausgangslage

| Bereich | Heute |
|---|---|
| Angular, CDK, Material | 14.2, Material mit Legacy-(Nicht-MDC-)Komponenten |
| TypeScript / RxJS / zone.js | 4.8 / 7.4 / 0.11 |
| Build | `@angular-devkit/build-angular:browser` (webpack), `polyfills.ts`, `stylePreprocessorOptions.includePaths: ["src/themes"]`, Service Worker (`ngsw-config.json`), Konfigurationen `production`, `local-pwa`, `development` |
| Tests | Karma + Jasmine, 21 Spec-Dateien, davon 12 mit Jasmine-Spies (`createSpyObj` 30×, `createSpy` 5×, `jasmine.clock` 5×) |
| Struktur | 59 NgModules, keine Standalone-Komponenten |
| Theme | `src/themes/andaha-theme.scss` mit `mat.define-palette`, `mat.define-light-theme`, `mat.core`, `mat.all-component-themes`; Tokens in `src/themes/_andaha-tokens.scss`; `src/styles.scss` (783 Zeilen) per `@import` |
| Material im Einsatz | Icon, ProgressSpinner, Dialog, Select/Option, SnackBar, ProgressBar, Datepicker + NativeDate, Paginator, Checkbox, Radio, Sidenav, Menu, Input; CDK DragDrop |
| Eigene Overrides auf Material-Klassen | u. a. `.mat-dialog-container`, `.mat-progress-bar-*`, `.mat-checkbox-*`, `.mat-radio-*`, `.mat-select-*`, `.mat-option*`, `.mat-menu-*`, `.mat-snack-bar-container`, `.mat-calendar-body-selected`, `.mat-datepicker-*`, `.mat-drawer*`, `.mat-icon-button`. `mat-form-field` wird nicht verwendet, Felder sind eigene Komponenten aus dem Redesign v1 |
| Node | lokal 24.15; Dockerfile `FROM node:latest`, `npm run build --prod` |

## Entscheidungen

### 1. Upgrade-Weg
- `ng update` Major für Major: 15, 16, 17, 18, 19, 20, 21, 22, jeweils `@angular/core @angular/cli` und `@angular/material @angular/cdk` zusammen, mit allen angebotenen Migrationen.
- Nach jedem Major: `npm install` ohne `--force`/`--legacy-peer-deps` als Dauerlösung, `ng build` (Produktion) muss laufen. Tests laufen spätestens nach dem Test-Runner-Umstieg (Entscheidung 4) wieder bei jedem Schritt.
- Fremdbibliotheken, die einen Schritt blockieren, werden in dem Schritt gehoben, in dem sie blockieren (siehe 3). Übergangsweise ist `--force` beim Install nur innerhalb eines Schritts erlaubt, das Ergebnis jedes Schritts installiert sauber.
- TypeScript, RxJS und zone.js folgen den Vorgaben der jeweiligen Angular-Version. Endstand laut npm: Angular 22.2.x, Material/CDK 22.2.x, zone.js 0.15 oder 0.16, RxJS 7.x.

### 2. Material: MDC und Theme
- Die MDC-Migration (`ng generate @angular/material:mdc-migration` in v15) wird für alle Komponenten ausgeführt. Kein Legacy-Import bleibt übrig, spätestens v17 verlangt das ohnehin.
- **Theme bleibt Material 2:** Umstellung auf die M2-Sass-API (`mat.m2-define-palette`, `mat.m2-define-light-theme`, `mat.m2-define-typography-config`, `mat.core`/`mat.all-component-themes` bzw. die in 22 gültigen Entsprechungen; Quelle: Angular Components Guide „material-2“, per Context7 geprüft). Material 3 würde Farben, Formen und Abstände ändern und ist deshalb ausgeschlossen.
- `@import` in `styles.scss` und im Theme werden auf `@use`/`@forward` umgestellt, soweit Dart Sass sonst warnt oder bricht.
- **Eigene Overrides** auf die alten Klassen werden auf die MDC-Struktur umgeschrieben. Vorzug haben, in dieser Reihenfolge: Theme-Werte, Material-Override-Mixins bzw. Design-Tokens der Komponenten (`mat.<component>-overrides(...)`, in 22 verfügbar), zuletzt Selektoren auf MDC-Klassen. Maßstab ist die Baseline der aktuellen App (siehe Prüfung), ergänzend `docs/design/DESIGN.md`.
- Dialoge erscheinen auf Mobile weiterhin als Bottom Sheet (eigene Panel-Klasse aus v1), auf Desktop zentriert, wie heute.

### 3. Fremdbibliotheken

| Bibliothek | Entscheidung |
|---|---|
| `angular-oauth2-oidc` 13 | auf 22.x heben (peer `@angular/core >=22`). Unterwegs die zur jeweiligen Angular-Version passende Major wählen. Konfiguration (Refresh-Token, `domain_hint`, US-0002) unverändert lassen; API-Änderungen per Context7/Changelog prüfen |
| `ngx-mat-timepicker` 14 | auf 22.1.x heben, bei Zwischenschritten passende Major |
| `ng2-charts` 4 / `chart.js` 3 | `ng2-charts` 11, `chart.js` 4.x. Diagramm-Konfiguration auf chart.js 4 anpassen (Ring in der Statistik, ggf. weitere). Umstellung auf `provideCharts(withDefaultRegisterables())` bzw. was ng2-charts 11 vorgibt (Context7) |
| `@angular/material-moment-adapter` | **bleibt** und folgt Material (Endstand 22.2.x). *Korrigiert in Task 4:* `shared/date-picker/german-date-providers.ts` nutzt `MomentDateAdapter` (mit `MAT_DATE_LOCALE` de-DE) für das Parsen von `TT.MM.JJJJ`; die ursprüngliche Annahme `MatNativeDateModule` traf nicht zu. Entfernen hieße, den Datumsadapter umzubauen (anderes Parse-Verhalten), das ist nicht Teil der Story. |
| `moment` | bleibt, auf aktuelle 2.x |
| `@olafvv/ngx-pinch-zoom` 14/16 (peer nur `^14`) | ersetzen durch `@meddv/ngx-pinch-zoom` 20 (Fork derselben Bibliothek, peer `>=19`). Erst ab dem Schritt auf 19 möglich; bis dahin bleibt die alte Bibliothek (ggf. mit `--force` im Zwischenschritt). Verhalten im Foto-Dialog muss gleich bleiben (Pinch, Doppeltipp, Grenzen) |
| `ngx-webcam` 0.4 (ungepflegt) | **entfernen**. Der Foto-Dialog (`features/bill/modules/add-bill-image-dialog/`) bietet statt der Live-Kamera eine Option, die `<input type="file" accept="image/*" capture="environment">` öffnet. Die Galerie-/Datei-Option bleibt. Ergebnis wie bisher als Bild an den Aufrufer; Verkleinerung über das vorhandene `shared/utils/image-utils.ts`. Sonst kein Umbau des Ablaufs (der kommt in US-0007) |

Wird eine dieser Versionen beim Umsetzen nicht mit 22.2 kompatibel gefunden, ist die Ersatzlösung: nächste kompatible Version, sonst minimaler eigener Ersatz mit gleichem Verhalten; die Abweichung kommt in den Abschnitt „Abweichungen“ unten.

### 4. Build und Tests
- **Build:** Umstieg auf `@angular/build:application` (Migration `use-application-builder` aus `ng update` bzw. Schematic). **Ausgabe bleibt flach:** `outputPath: { "base": "dist/andaha.web-apps.mini-client", "browser": "" }`, damit die Dateien wie bisher direkt in `dist/andaha.web-apps.mini-client/` liegen und nicht unter `browser/`. So bleiben Dockerfile und CD-Pipeline (`CopyFiles` aus genau diesem Ordner) unverändert. Die CD-Pipeline ersetzt nach dem Build `#{…}#`-Tokens in `drop/*.js` (Werte aus `environment.prod.ts`). Prüfen: Nach `npm run build:prod` stehen die Tokens (`#{monolithApiBaseUrl}#`, `#{authClientId}#` usw.) unverändert in einer `.js`-Datei direkt im Ausgabeordner. Service Worker, Assets, `fileReplacements` und alle drei Konfigurationen bleiben erhalten. `polyfills.ts` wird zu `polyfills: ["zone.js"]`, sofern nichts anderes darin steht.
- Budgets: bestehende Werte behalten. Wird ein Budget durch das Upgrade überschritten, Werte begründet anheben und im Abschnitt „Abweichungen“ vermerken.
- **Tests: Umstieg auf Vitest** über den Builder `@angular/build:unit-test` (Runner `vitest`) **im Browser-Modus** (Chromium über Playwright, headless). Grund: `shared/utils/image-utils.spec.ts` zeichnet auf ein echtes Canvas, jsdom hat keins. Tests laufen lokal; die Pipelines führen wie bisher keine Tests aus. *(Entscheidung des Designers nach Builder-Check.)* Karma, `karma.conf.js`, `src/test.ts` und Jasmine-Abhängigkeiten entfallen. Specs werden umgeschrieben: `jasmine.createSpyObj` → Objekte mit `vi.fn()`, `jasmine.SpyObj<T>` → passender Typ (z. B. `Mocked<T>`), `spyOn` → `vi.spyOn`, `jasmine.clock()` → `vi.useFakeTimers()`, `and.returnValue` → `mockReturnValue`. Gibt es in 22 ein offizielles Refactor-Schematic für Jasmine → Vitest, wird es zuerst verwendet. Alle 21 Spec-Dateien laufen grün; keine Tests werden gelöscht, um grün zu werden.
- Der Umstieg auf Vitest erfolgt **nach** dem Major, der den Unit-Test-Builder stabil anbietet (spätestens am Ende bei 22). Bis dahin laufen die Tests mit Karma weiter.

### 5. Code-Modernisierung (nur automatisch)
- **Standalone:** offizielle Schematic `ng generate @angular/core:standalone` in ihren drei Schritten (Komponenten standalone machen, unnötige NgModules entfernen, auf `bootstrapApplication` umstellen). Lazy Routes werden zu `loadComponent`/`loadChildren` mit Routen-Dateien. App-weite Provider (HTTP mit Interceptoren, OAuth, Service Worker, Animations, Datum-Locale/Adapter, Charts) wandern nach `app.config.ts`.
- Automatische Migrationen **Control Flow** (`@if`, `@for` mit `track`), **`inject()`** und ggf. **Self-closing Tags** werden ausgeführt.
- Nicht Teil der Story: Signals, Signal-Inputs, zoneless, OnPush-Umbau, manuelles Refactoring über die Schematics hinaus. Was eine Schematic nicht schafft, wird minimal von Hand nachgezogen, nur damit es baut und läuft.

### 6. Infrastruktur
- Dockerfile: `FROM node:24-alpine` (LTS) statt `node:latest`, `npm ci` statt `npm install`, Build-Befehl `npm run build` (Produktion ist Standard). Kopierpfad bleibt `dist/andaha.web-apps.mini-client` (flache Ausgabe, siehe 4).
- Pipelines `src/WebApps/MiniClient/pipeline/ci-pipeline.yml` und `cd-pipeline.yml` (Azure DevOps, Deploy auf Azure Static Web Apps): vor dem Install einen `NodeTool@0`-Schritt mit `versionSpec: '24.x'` einfügen. `install --force` durch `ci` ersetzen, sobald der Lockfile sauber installiert. Der Schritt „install typescript“ im Repo-Root wird entfernt, falls er für den Build nicht nötig ist (prüfen). `CopyFiles`-Pfad und `replacetokens` bleiben.
- README des MiniClients: Node-Version und Befehle (`npm test` mit Vitest) nachziehen.
- `package.json`: `engines` mit der von Angular 22 verlangten Node-Range.

## Prüfung

- Nach jedem Major: Produktions-Build grün.
- Ende: `ng build` (alle drei Konfigurationen), `ng test` (Vitest) grün, Docker-Image baut.
- **Referenz ist die aktuelle App, nicht v1.** Vor dem ersten `ng update` wird eine **Baseline** der laufenden Angular-14-App aufgenommen: Screenshots bei 390 × 844 und 1440 × 900 für jede Ansicht aus AC10, abgelegt in `ui-testing/baseline/`. Die v1-Screenshots decken nur 7 Ansichten ab und sind seit US-0003/US-0004 teils überholt; sie dienen nur als zweite Orientierung. *(Mit dem Nutzer abgestimmt.)*
- **UI-Regression mit Playwright** (ui-verification) bei 390 × 844 und 1440 × 900 gegen die Baseline, Bereiche wie in AC10: Rechnungen (Liste, Filter-Sheet, Hinzufügen inkl. Foto über Datei-Upload, Details, Foto mit Pinch-Zoom), Statistik (Ring, Kategorie-Sheet), Analyse, Haushaltsplan (Übersicht, Fixkosten, Einkommen, Bearbeiten), Stunden (Personen, Person, Arbeitszeit mit Zeitauswahl, Zahlung, Statistik), Einstellungen (Kategorien inkl. Drag & Drop, Verbindungen), Export, Rechtliches, Drawer. Konsole ohne Fehler.
- Login, Refresh-Token und Abmelden lokal (Setup siehe Memory „Local run setup“ bzw. README).
- PWA: Service Worker registriert, Update-Hinweis erscheint bei neuer Version, Offline-Rechnung wird nach Rückkehr online synchronisiert.

## Dem Umsetzer überlassen

- Reihenfolge der Bibliotheks-Upgrades innerhalb eines Major-Schritts.
- Ob die Standalone-Schematic vor oder nach dem Schritt auf 22 läuft (empfohlen: nach 22, damit Migrationen zusammenpassen).
- Konkrete Sass-Struktur der Overrides, solange das Aussehen stimmt.
- Commit-Schnitt: mindestens ein Commit pro Major-Schritt, je einer für Standalone, Vitest und Infrastruktur.

## Abweichungen

(Wird während der Umsetzung gefüllt, wenn eine Entscheidung oben nicht haltbar ist.)

### Task 2 (Angular 15, Material-MDC)

- **Select-Panel öffnet unter dem Feld statt es zu überdecken** (Screens 03b, 16c, 20c, 25d, 390 und 1440). Material 14 legte das Panel über den Trigger und richtete die gewählte Option am Feldwert aus (bei 25d deshalb „red“ mittig, Liste entsprechend gescrollt). Das MDC-Select ab Material 15 kennt diese Positionierung nicht mehr (MDC-Migrationsleitfaden: „MatSelect no longer aligns the selected option in the dropdown menu with the trigger text“); es öffnet bündig unter dem Feld (bzw. darüber, wenn unten kein Platz ist) und scrollt die gewählte Option nur in den sichtbaren Bereich. Nachbauen ginge nur über private Select-Interna (`_overlayDir`, Offset je Öffnung), die sich in jedem folgenden Major wieder ändern. Übernommen sind dagegen Breite und horizontale Lage (Trigger + 32 px, 16 px links überstehend; Mehrfachauswahl über `panelClass="andaha-select-multi"` Trigger + 64 px, 40 px links überstehend bzw. mobil auf 8 px Rand gerückt; linke und rechte Kante gemessen auf ±1 px wie die Baseline bei 390 und 1440), Höhe max. 256 px, Radius 12 an allen Ecken, Schatten, Optionsfarben, kein Haken bei Einfachauswahl (`MAT_SELECT_CONFIG.hideSingleSelectionIndicator`), Pseudo-Checkbox 16 px.
- **Subpixel-Unterschiede ohne sichtbare Wirkung:** Haken der Checkbox in Kategorien (25/25b/25c, MDC zeichnet den Haken als eigenes SVG; auf Material-14-Größe skaliert, Rest < 0,2 px), Ziffern der Zeitauswahl (20b, einzelne Ziffern 1 px tiefer, MDC-Mini-FAB statt Legacy-Button in `ngx-mat-timepicker` 15), Text im Kontomenü (30, < 0,4 px Kantenglättung).

### Task 3 (Angular 16–18, Application Builder)

- **Select-Panel jetzt auch oben mit 12 px Radius** (Screens 03b, 16c, 20c, 25d, 390 und 1440). Unter Material 15 setzte die MDC-Menüfläche an der Trigger-Seite den Radius auf 0 (berechnet: oben 0 px, unten 12 px), entgegen der Absicht in `styles.scss`. Material 18 überschreibt die eigene Regel nicht mehr, das Panel hat wieder an allen Ecken 12 px wie in der Baseline (Material 14). Lage, Breite, Höhe und Optionen unverändert (Vergleich der berechneten Styles 15 gegen 18).
- **Kantenglättung der Optionstexte im Select-Panel**: Material 15 renderte den Panel-Text in Graustufen-Glättung (eigene Compositing-Ebene der MDC-Menüfläche), Material 18 wieder in Subpixel-Glättung wie die Baseline. Schrift, Größe, Farbe und Position identisch.

### Task 4 (Angular 19–22, Fremdbibliotheken)

- **`ngx-mat-timepicker` bleibt auf 21.0.2** statt 22.1.x (Entscheidung 3). Alle 22er-Versionen unterstützen nur noch Material-3-Themes (README „Migrate to v22: dropped M2 theme support“): Kopfzeile, Zifferblatt, Zeiger und Buttons werden über `--mat-sys-*`-Tokens gefärbt, die ein M2-Theme nicht liefert, außerdem ist das Layout auf M3 umgestellt. Mit 22.1.0 war die Zeitauswahl farblos (kein Primär-Kopf, kein Zifferblatt, kein Zeiger). 21.0.2 läuft unter Angular 22 unverändert; der Peer-Bereich (`^21`) wird über `overrides` in `package.json` auf die installierten Angular-Pakete gesetzt, `npm install` läuft ohne `--force`. Offene Entscheidung für später: M3-Tokens für den Dialog nachbilden oder Ersatz.
- **`@meddv/ngx-pinch-zoom` mit explizitem `limitZoom="original image size"`.** Der Fork überschreibt den Standard sonst mit `undefined` (maximal Zoom 3 statt Originalgröße). Verhalten danach wie mit `@olafvv/ngx-pinch-zoom`: Doppeltipp 2x und zurück, Grenze = Originalgröße.
- **Statistik-Ring (08b, 390):** chart.js 4 glättet die Segmentkanten minimal anders (37 Pixel über Schwelle 40, nur an Bogenkanten). Farben, Lücken, Summe unverändert; 08 (Monat) pixelgleich.
- **Select-Optionstext (16c, 25d, 390 und 1440):** maximale Kanaldifferenz 25 an 13–61 Pixeln im Text der gewählten Option, nicht sichtbar.
- Nicht sichtbar, aber nötig für „keine Änderung“: CDK 21 rendert Overlays als Popover (`OVERLAY_DEFAULT_CONFIG.usePopover: false` stellt den `.cdk-overlay-container` wieder her); Material 20 benennt `--mdc-*`-Tokens in `--mat-*` um; Material 20/22 lassen nach CSS-Einblendanimationen ein `transform` stehen (Snackbar, Select-Panel; Text sonst in Graustufen geglättet); Material 22 rendert Checkbox-/Radio-Beschriftungen als `span.mdc-label`.
