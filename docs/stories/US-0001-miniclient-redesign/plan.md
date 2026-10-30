# US-0001 Redesign MiniClient – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Oberfläche des MiniClients wird auf das helle Designsystem „Tinte & Kupfer“ umgestellt, ohne dass sich eine Funktion ändert.

**Architecture:** Globale Tokens und Muster liegen in `styles.scss`, das Markup kommt aus `docs/design/mockups/*.html`. Material bleibt für Komponenten mit Verhalten (Datepicker, Select, Dialog, Snackbar, Menü, Sidenav, Checkbox/Radio, Progress, Icon, Paginator, Timepicker). Optik-Komponenten werden durch natives Markup und CSS ersetzt. Die Shell bekommt Titel und Zurück-Ziel über Route-`data` und einen `PageTitleService`. Umgebaut wird Seite für Seite, Logik bleibt unangetastet.

**Tech Stack:** Angular 14.2, Angular Material/CDK 14 (Legacy), Moment-Adapter, ngx-mat-timepicker 14, ng2-charts 4 / Chart.js 3, Karma/Jasmine.

**Spec:** [`design.md`](./design.md) (verbindlich), dazu [`story.md`](./story.md), [`docs/design/DESIGN.md`](../../design/DESIGN.md), [`docs/design/umsetzung.md`](../../design/umsetzung.md), Mockups und Screenshots in `docs/design/`.

Alle Pfade unten sind relativ zu `src/WebApps/MiniClient/Andaha.WebApps.MiniClient/`, sofern sie nicht mit `docs/` beginnen. Kürzel: `F/` = `src/app/features/`, `S/` = `src/app/shared/`.

## Global Constraints

- **Funktion unverändert:** gleiche Routen, Formularfelder, Validatoren, Services, API-Aufrufe, Handler und Texte. TypeScript-Änderungen nur aus der Liste in `design.md` §6.1. Jede andere TS-Änderung muss im Task-Report begründet werden.
- **Angular 14:** keine Control-Flow-Syntax (`@if`/`@for`), keine Standalone-Migration, keine neuen Major-Pakete, kein Deinstallieren von `@angular/material`.
- **Werte:** nur über CSS Custom Properties aus `src/themes/_andaha-tokens.scss` (`var(--bg)` usw.). Keine Hex-Werte in Komponenten-SCSS, kein `::ng-deep` in Komponenten. Overlay-Styles nur global mit Präfix `andaha-`.
- **Muster** (`.row`, `.field`, `.btn`, `.actions`, `.sec`, `.kv`, `.chip`, `.segment`, `.tag`, `.empty`, `.bottom-nav` …): Markup und CSS aus `docs/design/mockups/*.html` übernehmen, nicht neu erfinden.
- **Breakpoints:** Mobile < 1024 px, Desktop ≥ 1024 px. Dialoge werden unter 600 px zum Sheet.
- **Icons:** Material Symbols Outlined, Namen laut Tabelle in `umsetzung.md`.
- **Texte:** bleiben wie im Code. Neu sind nur Seitentitel (Route-`data`), „Speichert …“, „Synchronisiert …“ (nur Desktop), die Segment-Labels Monat/Jahr/Gesamt/„Von – Bis“ und „Zahlung offen“.
- **Library-APIs** (Angular Material/CDK 14, ngx-mat-timepicker, ng2-charts/Chart.js 3): vor Verwendung per Context7 nachschlagen (`/websites/material_angular_dev/v14` für Material), nicht aus dem Gedächtnis.
- **Code-Navigation und -Änderungen in TS** über Serena (`get_symbols_overview`, `find_symbol`, `replace_symbol_body`, `replace_content`). HTML und SCSS dürfen mit den normalen Datei-Tools bearbeitet werden.
- **Keine Commits durch Subagents.** Der Controller fragt den Nutzer nach jeder PR-Gruppe (Tasks 1–5, 6–8, 9–11, 12–13, 14–16), ob committet werden soll.
- **Lokale Umgebung:** Frontend läuft per `ng serve` auf http://localhost:4200, Backend (Monolith) auf https://localhost:8900. Beide laufen bereits im Hintergrund, nicht neu starten, außer der Controller sagt es. Der Playwright-Browser ist bereits als Testuser eingeloggt. Testdaten dürfen beliebig angelegt und gelöscht werden. Dapr-Fehler im Backend-Log („Could not retrieve connected users“) ignorieren.

### Gate jedes UI-Tasks (in jedem Task-Report nachzuweisen)

1. **Bindungs-Inventar:** Vor dem Umbau jedes Templates alle Bindungen des alten Templates auflisten (`formControlName`/`[formControl]`, `(event)`-Handler, `[disabled]`, `*ngIf`/`*ngFor`-Bedingungen, `routerLink`, `@Input`-Bindungen an Kindkomponenten, Template-Refs). Nach dem Umbau jede Zeile abhaken: kommt im neuen Template vor, oder ihr Wegfall ist durch `design.md`/`umsetzung.md` gedeckt (mit Fundstelle).
2. **Build:** `npm run build` (im App-Verzeichnis) ohne Fehler, keine Warnung, die nicht in `docs/stories/US-0001-miniclient-redesign/build-baseline.txt` steht.
3. **Browser:** Mit Playwright MCP die betroffenen Routen bei 390 × 844 und 1440 × 900 öffnen. Mit dem genannten Screenshot aus `docs/design/screenshots/` vergleichen, die im Task genannten Funktionen einmal durchspielen und die Konsole auf Fehler prüfen. Screenshots ablegen unter `docs/stories/US-0001-miniclient-redesign/ui-testing/task-NN-<seite>-<390|1440>.png`.

## Review Focus

1. **Zeitpunkt der Fehleranzeige im neuen `.field`:** Ein ungültiges Feld zeigt den Fehler erst nach dem Verlassen oder nach dem Absenden, genau wie `mat-error` heute. Abgesichert durch die Unit-Tests in Task 4 und die Browser-Prüfung in Task 7.
2. **Nachladen der Rechnungsliste mit eingeklappter Filterleiste:** Bei mehr als 50 Rechnungen lädt die Liste beim Scrollen genau einmal pro Schwelle nach, ohne Springen und ohne Endlosschleife, auch bei schnellem Scrollen. Geprüft in Task 6.
3. **Sheets auf 390 × 844 mit langem Inhalt:** Der Primär-Button bleibt per Scrollen erreichbar, Schließen per Button und per Escape funktioniert, der Fokus kehrt zum Auslöser zurück. Geprüft in Task 5 (Filter-Dialog, Bestätigung) und Task 11 (Zahlung).
4. **Lange und extreme Werte:** Ein Shop- oder Kategoriename mit mehr als 40 Zeichen wird abgeschnitten (Ellipsis), ohne den Betrag zu verdrängen. Beträge ≥ 10.000 erscheinen als `12.345,67 €`. Ein negativer Überschuss steht in `negative` mit Vorzeichen. Geprüft in Task 6 (Rechnung mit langem Namen und hohem Betrag) und Task 10 (Fixkosten größer als Einkommen).
5. **Wechsel über 1024 px bei geöffneter App:** Die Sidenav wechselt zwischen `over` und `side`, ein offener Drawer verschwindet sauber, es gibt nie zwei Kopfzeilen gleichzeitig. Geprüft in Task 3 (Resize 1440 → 390 → 1440).

---

### Task 1: Fundament – Schrift, Icons, Tokens, Theme, globale Muster [UI]

**Files:**
- Create: `src/themes/_andaha-tokens.scss` (Kopie von `docs/design/tokens/_andaha-tokens.scss`), `src/themes/andaha-theme.scss` (Kopie von `docs/design/tokens/andaha-theme.scss`), `docs/stories/US-0001-miniclient-redesign/build-baseline.txt`
- Delete: `src/themes/custom-theme.scss`
- Modify: `src/index.html`, `angular.json` (build `styles` Z. 35–38, test `styles` Z. 134–136), `src/styles.scss`, `src/manifest.webmanifest`, `src/app/app.module.ts`

**Interfaces:**
- Produces: CSS Custom Properties aus den Tokens global verfügbar. Globale Klassen `.row .date .amt .dot .sec .kv .k .v .actions .btn .pri .sec2 .del .icon-btn .tag .empty .big .chip .segment .bottom-nav .field .field-label .field-hint .field-error .suffix` mit Markup laut Mockups. Overrides für Select-Panel (`andaha-select-panel`), Datepicker, Menü, Snackbar, Progressbar, Checkbox, Radio.

- [ ] **Step 1:** Vor jeder Änderung `npm run build` ausführen. Alle Warnungen wörtlich nach `build-baseline.txt` schreiben (das ist die Referenz für „keine neuen Warnungen“).
- [ ] **Step 2:** In `index.html` die Links für Roboto und Material Icons ersetzen. Neu: Hanken Grotesk (400;500;600;700) und Material Symbols Outlined (`opsz,wght,FILL,GRAD@20..24,300,0,0`), URLs aus `umsetzung.md` Phase 1.1, dazu `lang="de"` und `<meta name="theme-color" content="#F8F4EC">`.
- [ ] **Step 3:** In `AppModule` `MatIconRegistry.setDefaultFontSetClass('material-symbols-outlined')` aufrufen (Konstruktor-Injection) und `registerLocaleData(localeDe)` (aus `@angular/common/locales/de`) ausführen.
- [ ] **Step 4:** Tokens und Theme nach `src/themes/` kopieren und `custom-theme.scss` löschen. In `angular.json` bei build und test `purple-green.css` und `custom-theme.scss` entfernen. Das Theme wird genau einmal über `styles.scss` (`@use`/`@import`) eingebunden.
- [ ] **Step 5:** `styles.scss` neu aufbauen: Basis (`html, body` mit `var(--bg)`, `var(--fg)`, Hanken Grotesk, `tabular-nums`, `::selection`, `:focus-visible`-Ring `0 0 0 3px rgba(46,79,168,.2)`), alle oben genannten Muster aus den Mockups und die Material-Overrides nach DESIGN.md (Select-Panel `surface` mit Popover-Schatten, Snackbar info = `fg` auf `surface` mit Linie, Snackbar-Fehler = `negative` auf `negative-bg`, Progressbar 3 px `primary`). Alte Klassen (`.button-style`, `.dark-bg-color`, `.primary-bg-color`, `.floating-button` …) bleiben vorerst stehen, weil alte Templates sie noch nutzen. Sie werden in Task 16 entfernt.
- [ ] **Step 6:** In `manifest.webmanifest` `theme_color` und `background_color` auf `#F8F4EC` setzen.
- [ ] **Step 7 – Gate:** Build (keine neuen Warnungen). Browser bei `/bill/list` auf 390 und 1440: Hintergrund hell, Schrift Hanken Grotesk, Icons dünn, kein Pink mehr in der Toolbar. Seiten dürfen noch altes Layout haben, müssen aber bedienbar bleiben (Rechnung anlegen einmal durchklicken).

### Task 2: PageTitleService und Route-Titel

**Files:**
- Create: `src/app/core/page-title/page-title.service.ts`, `src/app/core/page-title/page-title.service.spec.ts`
- Modify (Route-`data`): `src/app/app-routing.module.ts`, `F/bill/bill.module.ts`, `F/bill-analysis/bill-analysis.module.ts`, `F/budgetplan/budgetplan.module.ts`, `F/budgetplan/modules/fixed-cost/fixed-cost.module.ts`, `F/budgetplan/modules/income/income.module.ts`, `F/work/work.module.ts`, `F/work/modules/person/person.module.ts`, `F/settings/settings.module.ts`, `F/settings/modules/categories/categories.module.ts` (sowie weitere `*.module.ts` mit `RouterModule.forChild`, falls dort die Blattroute liegt)
- Modify: `karma.conf.js` (Launcher `ChromeHeadless` ergänzen, bestehende Konfiguration bleibt)

**Interfaces:**
- Produces:
  ```ts
  @Injectable({ providedIn: 'root' })
  export class PageTitleService {
    readonly title$: Observable<string>;        // tiefster data.title der aktiven Route, oder Override
    readonly back$: Observable<string | null>;  // tiefster data.back der aktiven Route, sonst null
    set(title: string): void;                   // Override bis zur nächsten NavigationEnd
  }
  ```
  Route-Daten: `data: { title: string; back?: string }`.

- [ ] **Step 1: Failing Tests** in `page-title.service.spec.ts` mit `RouterTestingModule.withRoutes(...)` (Elternroute `{path:'bill', data:{title:'Eltern'}, children:[{path:'list', data:{title:'Rechnungen'}}, {path:':id', data:{title:'Rechnung', back:'/bill/list'}}]}`):
  - `emits deepest route title` → nach `navigate(['/bill/list'])` ist `title$` gleich `'Rechnungen'`, `back$` gleich `null`
  - `emits back target` → nach `/bill/42` ist `title$` gleich `'Rechnung'`, `back$` gleich `'/bill/list'`
  - `override wins until next navigation` → `set('Billa')` liefert `'Billa'`, nach erneuter Navigation auf `/bill/list` wieder `'Rechnungen'`
  - `falls back to empty string` → bei einer Route ohne `title` ist `title$` gleich `''`
- [ ] **Step 2:** `npx ng test --watch=false --browsers=ChromeHeadless` → erwartet FAIL (Service fehlt). Läuft Karma lokal gar nicht, das genau melden (BLOCKED) und nicht überspringen.
- [ ] **Step 3:** Service implementieren: bei `NavigationEnd` über `router.routerState.snapshot.root` bis zum tiefsten `firstChild` laufen, das tiefste definierte `data.title` bzw. `data.back` nehmen und den Override zurücksetzen.
- [ ] **Step 4:** Tests ausführen → PASS.
- [ ] **Step 5:** Route-`data` eintragen. Titel laut `umsetzung.md` Phase 2.1 (Rechnungen, Rechnung hinzufügen, Rechnung, Statistik, Analyse, Rechnung hochladen, Analysierte Rechnung, Haushaltsplan, Fixkosten, Einkommen, Stundenaufzeichnungen, Statistik, Verbindungen, Kategorien, Export, AGB, Datenschutzerklärung, Benutzerdaten). Unterseiten ohne Eintrag in dieser Liste bekommen den Titel ihres Mockup-Screens, ohne Mockup die Überschrift, die die Seite heute zeigt. `back` übernimmt die heutigen Zurück-Ziele: `bill/:id` → `/bill/list`; fixedcost `create`/`:id` → `/budgetplan/fixedcost`; income `create`/`:id` → `/budgetplan/income`; categories create/details → `/settings/categories`; person `create`/`create-working-entry`/`:id` → `/work/person`. Neu: `analyzed/:id` → `/analyzed/list`.
- [ ] **Step 6 – Gate:** Tests grün, Build ohne neue Warnungen. Kein Browser-Gate, weil der Service hier noch nirgends angezeigt wird.

### Task 3: Shell – Kopf, Drawer/Sidebar, Bereichsnavigation, Flex-Layout [UI]

**Files:**
- Modify: `src/app/app.component.html`, `src/app/app.component.scss`, `src/app/app.component.ts`, `src/app/app.module.ts` (nicht mehr genutzte `MatToolbarModule`/`MatListModule` entfernen)
- Modify (Bereichsnavigation): `F/bill/bill.component.html|scss`, `F/bill-analysis/bill-analysis.component.html|scss`, `F/budgetplan/budgetplan.component.html|scss`, `F/work/work.component.html|scss`, `F/settings/settings.component.html|scss`
- Modify (alte Zurück-Buttons entfernen, Ziel liegt jetzt in Route-`data`): `F/bill/modules/bill-details/bill-details.component.html`, `F/budgetplan/modules/fixed-cost/create-fixed-cost/…html`, `…/fixed-cost-details/…html`, `F/budgetplan/modules/income/create-income/…html`, `…/income-details/…html`, `F/settings/modules/categories/category-item-details/…html`, `…/create-category/…html`, `F/work/modules/person/add-person/…html`, `…/add-working-entry/…html`, `…/person-details/…html`

**Interfaces:**
- Consumes: `PageTitleService.title$`, `back$` (Task 2), Muster `.bottom-nav` und `.icon-btn` (Task 1)
- Produces: `AppComponent.isDesktop$: Observable<boolean>` (`BreakpointObserver.observe('(min-width: 1024px)')`). Shell-Layout: `.shell` (Flex-Spalte, `100dvh`), `.content` (`flex:1; overflow:auto`). Seitenkomponenten setzen `.actions` und `.bottom-nav` als `flex:none` ans Ende.

- [ ] **Step 1:** Bindungs-Inventar für `app.component.html` und die fünf Bereichskomponenten erstellen.
- [ ] **Step 2:** Kopf nach `design.md` §5.2. Mobile: 56-px-Leiste mit Menü- oder Zurück-Button (`[routerLink]="back"`, `aria-label="Zurück"`), Titel, Sync-Icon, Konto-Button mit `mat-menu` und `logout()`. Desktop: `h1` 28/600 in der Inhaltsspalte, rechts Sync-Status „Synchronisiert …“, `userName`, Konto-Button. Beide Varianten per `isDesktop$` umschalten, nie gleichzeitig im DOM. „Warten auf Login…“ zentriert, 15 `muted`.
- [ ] **Step 3:** `mat-sidenav`: `[mode]="(isDesktop$ | async) ? 'side' : 'over'"`, `[opened]="isDesktop$ | async"`. Inhalt nach Mockup 02 · Navigation (Drawer 304 px mit „Andaha“, Benutzername und Sync) bzw. Mockup 07 (Sidebar 248 px). Die 6 Einträge mit `routerLinkActive` und Icons laut Tabelle, Rechtliches unten. `(click)` schließt den Drawer nur im Modus `over`.
- [ ] **Step 4:** Platzhalter-Divs und `position: fixed` durch das Flex-Layout ersetzen. Die fünf Bereichskomponenten bekommen `<nav class="bottom-nav">` mit denselben Links. Ab 1024 px werden daraus per globalem CSS Tabs unter dem Kopf.
- [ ] **Step 5:** Die Zurück-Buttons in den 10 Detail-Templates oben löschen.
- [ ] **Step 6 – Gate:** Inventar abgehakt, Build. Browser:
  - Bei 390 und 1440 jeden Sidebar-Eintrag und jeden Bereichs-Tab anklicken: Titel stimmt, `routerLinkActive` ist korrekt hervorgehoben.
  - Zurück-Pfeil auf `/bill/<id>`, `/budgetplan/fixedcost/create` und `/analyzed/<id>` prüfen.
  - Ausloggen und wieder einloggen.
  - Resize 1440 → 390 → 1440 bei offenem Drawer (Review Focus 5).
  - Vergleich mit Screenshot 02 (Navigation) und 07.

### Task 4: Feld-Muster, Fehleranzeige und Absicherungstest [UI]

**Files:**
- Create: `S/form-field/show-error.ts`, `S/form-field/show-error.spec.ts`, `docs/stories/US-0001-miniclient-redesign/spike-form-fields.md`
- Modify: `S/date-picker/date-picker-form-field/date-picker-form-field.component.html|scss`, `S/date-picker/date-picker-form-field/*.module.ts`, `S/date-picker/time-picker-form-field/time-picker-form-field.component.html|scss`, `S/date-picker/time-picker-form-field/*.module.ts`

**Interfaces:**
- Produces: `export function showError(control: AbstractControl | null, form?: FormGroupDirective | NgForm | null): boolean`. Gleiche Regel wie Materials Default-`ErrorStateMatcher`: `!!control && control.invalid && (control.touched || !!form?.submitted)`. Dazu eine Pipe `showError` (`ShowErrorPipe`, in `ShowErrorModule` unter `S/form-field/`) für Templates. Die Komponenten `date-picker-form-field` und `time-picker-form-field` behalten ihre `@Input`/`@Output`-API unverändert.

- [ ] **Step 1: Failing Tests** `show-error.spec.ts`:
  - `false for valid control`
  - `false for invalid untouched control without submitted form`
  - `true for invalid touched control`
  - `true for invalid untouched control when form submitted`
  - `false for null control`
- [ ] **Step 2:** `npx ng test --watch=false --browsers=ChromeHeadless` → FAIL.
- [ ] **Step 3:** `showError` und `ShowErrorPipe` (pure) implementieren.
- [ ] **Step 4:** Tests ausführen → PASS.
- [ ] **Step 5 – Absicherungstest:** Datepicker-Feld und Timepicker-Feld auf `.field` umbauen (`<input [matDatepicker]>` + `mat-datepicker-toggle` als Suffix, ohne `mat-form-field`; Timepicker analog). Vorher die APIs per Context7 bzw. die README von ngx-mat-timepicker prüfen. Zusätzlich auf einer Seite mit `mat-select` (einfach) und `mat-select multiple` + `mat-select-trigger` (Personen in `add-working-entry`) testweise ein `.field` ohne `mat-form-field` bauen. Prüfen: Wertbindung, Tastatur (Tab, Enter, Pfeile, Escape), Overlay-Position, Fehleranzeige, `required`-Markierung. Ergebnis je Typ (OK / Rückfall auf gestyltes `mat-form-field`) in `spike-form-fields.md` festhalten. Der Probeumbau am Select darf verworfen werden, er wird in Task 12 regulär gemacht.
- [ ] **Step 6 – Gate:** Tests grün, Build. Browser bei 390 und 1440: Datum in der Rechnungsfilter-Auswahl setzen und Zeit in „Arbeitszeiten hinzufügen“ setzen, beide Werte werden übernommen. Der Controller liest `spike-form-fields.md`, bevor er Task 5 startet. Bei einem Rückfall bekommen alle späteren Tasks diesen Hinweis.

### Task 5: Dialoge als Bottom Sheet, Snackbars [UI]

**Files:**
- Modify: `S/dialog/dialog-functions.ts`, `S/dialog/dialog.component.html|scss|ts`, `S/confirmation-dialog/confirmation-dialog.component.html|scss`, `S/confirmation-dialog/confirmation-dialog.service.ts`, `F/settings/modules/connection/add-connection-dialog/add-connection-dialog.service.ts` (Pfad per Glob bestätigen), `F/bill-analysis/modules/analyzed-bill-image/analyzed-bill-image-dialog/*.service.ts` (Pfad per Glob bestätigen), `S/snackbar/error-snackbar/*.html|scss`, `S/snackbar/information-snackbar/*.html|scss`, `S/snackbar/snackbar-functions.ts` (nur `panelClass`), `src/styles.scss` (`.andaha-sheet`, `.andaha-dialog`, `.andaha-snackbar*`)

**Interfaces:**
- Produces: `getDialogBaseConfig<D>(): MatDialogConfig<D>`. Unter 600 px `{ panelClass: 'andaha-sheet', position: { bottom: '0' }, width: '100%', maxWidth: '100vw' }`, sonst `{ panelClass: 'andaha-dialog', maxWidth: '480px', width: '100%' }`. `app-dialog` behält seine heutigen Inputs und Content-Slots und ergänzt Griff, Titel und Schließen-Button (`aria-label="Schließen"`, ruft dieselbe Close-Logik wie heute).

- [ ] **Step 1:** Bindungs-Inventar für `dialog.component.html`, `confirmation-dialog.component.html` und die Snackbar-Templates.
- [ ] **Step 2:** `getDialogBaseConfig` umstellen. In den drei Services die Basis-Konfiguration davorsetzen (`{ ...getDialogBaseConfig(), ...bisherigeOptionen }`).
- [ ] **Step 3:** Sheet- und Dialog-Styles nach DESIGN.md (Radius 20 oben, Griff 36×4, max. 90dvh, scrollt, Schatten `0 -12px 40px rgba(60,40,20,.18)`, Scrim `rgba(40,30,18,.38)`). `.fullscreen-dialog` entfernen. Die Bestätigung bekommt Aktionen `Abbrechen | <Bestätigen>` mit unverändertem Text und Rückgabewert.
- [ ] **Step 4:** Snackbars nach DESIGN.md stylen.
- [ ] **Step 5 – Gate:** Inventar, Build. Browser bei 390 und 1440 (Review Focus 3): Datumfilter-Dialog der Rechnungsliste, Bestätigung beim Löschen einer Testrechnung (einmal abbrechen, einmal bestätigen) und „Verbindung herstellen“ öffnen und absenden. Jeweils prüfen: Escape schließt, der Fokus kehrt zurück, der Primär-Button ist erreichbar. Eine Info-Snackbar über Speichern auslösen. Für die Fehler-Snackbar die Stelle im Code suchen, die `openErrorSnackbar` (bzw. das Äquivalent in `snackbar-functions.ts`) ohne Backend-Ausfall auslöst. Gibt es keine, die Optik bei 390 per `browser_evaluate` über einen direkten `MatSnackBar.openFromComponent`-Aufruf prüfen. Vergleich mit Screenshot 01 (Datumfilter-Sheet).

### Task 6: Rechnungsliste, Filter, Listeneintrag, Desktop-Tabelle [UI]

**Files:**
- Modify: `F/bill/modules/bill-list/bill-list.component.html|scss|ts`, `F/bill/modules/bill-list/bill-list-filter/bill-list-filter.component.html|scss|ts`, `F/bill/modules/bill-list/bill-list-filter/bill-list-filter-dialog/bill-list-filter-dialog.component.html|scss`, `F/bill/modules/bill-list/bill-list-item/bill-list-item.component.html|scss`, zugehörige `*.module.ts` (ungenutzte Material-Module raus)

**Interfaces:**
- Consumes: `.row`, `.chip`, `.field`, `.empty` (Task 1), Sheet (Task 5)
- Produces: geänderte Chip-Handler-Signatur in `bill-list-filter`, z. B. `onChipClick(index: number): void`. Die Auswahl-/Emit-Semantik von `categoryFilterChanged` bleibt identisch, einschließlich „Alle“/„Keine“.

- [ ] **Step 1:** Bindungs-Inventar für alle vier Templates. Zusätzlich das bestehende Chip-Verhalten notieren: was passiert bei „Alle“, bei „Keine“, bei Mehrfachauswahl und beim Abwählen der letzten Kategorie. Das ist die Soll-Spezifikation für Step 3.
- [ ] **Step 2:** Filterbereich in den Flex-Fluss holen: Suche, Datumfilter-Button (Punkt, wenn ein Datum gesetzt ist), Chip-Zeile horizontal scrollbar, Datums-Chips mit Entfernen-Button. Beim Ausblenden wird `*ngIf="showFilterBar"` zu einer Klassenbindung (`[class.collapsed]="!showFilterBar"`, eingeklappt per `max-height` + `transform`). Ab 1024 px ist die Leiste immer offen. Die `filter-placeholder*`- und `progressbar-*`-Klassen entfallen.
- [ ] **Step 3:** Chips als `<button type="button" class="chip" [attr.aria-pressed]>`. Den Handler auf die neue Signatur umstellen und das in Step 1 notierte Verhalten exakt nachbilden.
- [ ] **Step 4:** `bill-list-item` nach Mockup 01: Datumsspalte (`'dd'`/`'MMM'`, Locale `de`), Shop mit Ellipsis, Metazeile mit Punkt `bill.category.color`, Unterkategorie, Icons `receipt_long`/`link`, Betrag `| number:'1.2-2':'de'` + kleines €. Ab 1024 px als Tabellenzeile per CSS Grid (Datum | Shop | Kategorie | Herkunft | Preis) und die Kopfzeile außerhalb des Viewports (Mockup 07). `pixelHeightPerItem` = 64, bei abweichender Desktop-Zeilenhöhe je Breakpoint setzen. Der versteckte `mat-paginator` bleibt unverändert.
- [ ] **Step 5 – Gate:** Inventar, Build. Browser:
  - Mindestens 60 Testrechnungen anlegen, Skript per `browser_run_code_unsafe` über die UI-Formulare oder die API mit dem Token des eingeloggten Users ist erlaubt. Darunter eine mit über 40 Zeichen Shopname und Betrag 12345,67 (Review Focus 4).
  - Langsam und schnell bis ans Ende scrollen: Die Filterleiste klappt ein und aus, das Nachladen passiert einmal pro Schwelle, nichts springt (Review Focus 2).
  - Suche, Kategorie-Chips (Einzel, Mehrfach, Alle, Keine) und Datumfilter setzen und entfernen.
  - Leerzustand „Keine Rechnungen verfügbar.“ mit einem Filter ohne Treffer.
  - Vergleich mit Screenshot 01 (Liste) bei 390 und 07 bei 1440.

### Task 7: Rechnung hinzufügen, Details, Bilder [UI]

**Files:**
- Modify: `F/bill/modules/add-bill/add-bill.component.html|scss`, `F/bill/modules/bill-details/bill-details.component.html|scss|ts`, `F/bill/modules/bill-image/bill-image.component.html|scss`, `F/bill/modules/bill-image-dialog/bill-image-dialog.component.html|scss`, `F/bill/modules/add-bill-image-dialog/add-bill-image-dialog.component.html|scss`, zugehörige `*.module.ts`

**Interfaces:**
- Consumes: `.field` + `ShowErrorPipe` (Task 4), `.actions`/`.btn` (Task 1), `PageTitleService.set` (Task 2, optional für den Shopnamen, falls Screenshot 01 · Details ihn im Titel zeigt)

- [ ] **Step 1:** Bindungs-Inventar für alle fünf Templates.
- [ ] **Step 2:** `add-bill` nach Mockup 01 · Hinzufügen: Foto-Zeile (`app-bill-image` mit `onlyUpload`) als gestrichelte Zeile „Foto der Rechnung · Optional“, Felder in bisheriger Reihenfolge als `.field`, Fehler über `showError`, Speichern in `.actions` mit Spinner und „Speichert …“ (heutiges Speicher-Flag).
- [ ] **Step 3:** `bill-details`: Im Lesemodus Kopf (Shop 26/600, Betrag `amount`, Datum), Fotozeile (öffnet wie bisher den Bild-Dialog) und Wertezeilen. Bei `isEditing` das Formular wie in `add-bill`. Aktionen `Bearbeiten | Löschen` bzw. `Abbrechen | Speichern`.
- [ ] **Step 4:** Bild-Komponenten und Bild-Dialoge auf Sheet und neue Buttons umstellen. Webcam und Pinch-Zoom bleiben unverändert eingebunden.
- [ ] **Step 5 – Gate:** Inventar, Build. Browser bei 390 und 1440:
  - Rechnung ohne Foto anlegen, mit Pflichtfeld leer absenden: Der Fehler erscheint erst nach Verlassen bzw. Absenden (Review Focus 1).
  - Rechnung mit Foto anlegen (Datei-Upload per `browser_file_upload`, Testbild aus `docs/design/screenshots/`).
  - Details öffnen, Foto ansehen, bearbeiten und speichern, abbrechen, löschen.
  - Vergleich mit Screenshot 01 (Hinzufügen, Details).

### Task 8: Statistik – Segment, Ringdiagramm, Kategorie-Details [UI]

**Files:**
- Modify: `F/bill/modules/expenses/expenses.component.html|scss|ts`, `F/bill/modules/expenses/timerange-selection/timerange-selection.component.html|scss|ts`, `F/bill/modules/expenses/chart/chart.component.html|scss|ts`, `F/bill/modules/expenses/chart-details-dialog/chart-details-dialog.component.html|scss`, zugehörige `*.module.ts`

**Interfaces:**
- Produces: `timerange-selection` mit Segment aus nativen Radios an `form.controls.dateType`, ruft weiterhin `dateTypeSelectionChanged()` auf. Die Inputs und Outputs der Komponente bleiben unverändert, weil `F/work/modules/statistics` sie mitnutzt. Die Labels kommen aus einer eigenen Konstante `DATE_TYPE_SEGMENT_LABELS` (Monat, Jahr, Gesamt, „Von – Bis“). `DateTypeLabelMapping` bleibt unverändert.

- [ ] **Step 1:** Bindungs-Inventar. Den bisherigen Klick-Pfad notieren: Klick ins Diagramm → `chartClicked` → Dialog mit welchen Daten.
- [ ] **Step 2:** Segment und die Felder Monat/Jahr/Von–Bis als `.field` (Select bzw. Datepicker laut Task-4-Ergebnis).
- [ ] **Step 3:** Chart-Optionen per Context7 (Chart.js 3 / ng2-charts 4) prüfen und setzen: `type: 'doughnut'`, `cutout: '78%'`, `borderWidth: 3`, `borderColor` = Wert von `--bg`, `plugins.legend.display: false`. Die Summe absolut zentriert. Die Legende als `<button>`-Zeilen (Punkt, Kategorie, %, Betrag, Chevron) ruft denselben Handler wie `chartClicked` mit derselben Kategorie.
- [ ] **Step 4:** `chart-details-dialog` als Sheet nach Mockup 02, Leertext unverändert.
- [ ] **Step 5 – Gate:** Inventar, Build. Browser bei 390 und 1440:
  - Jeden Datumstyp einmal wählen, Monat und Jahr wechseln, Von–Bis setzen.
  - Kategorie-Details über das Diagramm und über die Legende öffnen, beide zeigen dieselben Daten.
  - Leerzustand „Keine Daten vorhanden.“
  - Vergleich mit Screenshot 02.

### Task 9: Analyse [UI]

**Files:**
- Modify: `F/bill-analysis/modules/analyzed-bill/analyzed-bill-list.component.html|scss|ts`, `…/analyzed-bill-list-item/analyzed-bill-list-item.component.html|scss`, `F/bill-analysis/modules/add-bill-for-analysis/add-bill-for-analysis.component.html|scss`, `F/bill-analysis/modules/analyzed-bill-details/analyzed-bill-details.component.html|scss`, `F/bill-analysis/modules/analyzed-bill-image/analyzed-bill-image.component.html|scss`, `…/analyzed-bill-image-dialog/analyzed-bill-image-dialog.component.html|scss`, zugehörige `*.module.ts`

- [ ] **Step 1:** Bindungs-Inventar.
- [ ] **Step 2:** Liste nach Mockup 03 (Zeile ohne Metazeile, `pixelHeightPerItem` = 60, versteckter Paginator bleibt).
- [ ] **Step 3:** Upload-Fläche als `<label>` (`well`, gestrichelt), darin das bestehende `<input type="file" accept="image/*" capture="environment">`, visuell versteckt, aber im DOM. Dateiname und Vorschau nach der Auswahl. „Hochladen“ in `.actions` mit unverändertem `[disabled]` und Spinner.
- [ ] **Step 4:** Details: Kopf und Wertezeilen (Kategorie, Unterkategorie, Konfidenz-Balken in `positive`, Notizen), Bild in `well`, auf Desktop rechts.
- [ ] **Step 5 – Gate:** Inventar, Build. Browser bei 390 und 1440:
  - Bild hochladen (`browser_file_upload`).
  - Liste, Details und Bild-Dialog prüfen, Zurück-Pfeil führt nach `/analyzed/list`.
  - Ist lokal keine analysierte Rechnung vorhanden, weil die Analyse eine Cloud-Abhängigkeit braucht, das im Report vermerken und nur Liste, Leerzustand und Upload prüfen.
  - Vergleich mit Screenshot 03.

### Task 10: Haushaltsplan – Übersicht und Fixkosten [UI]

**Files:**
- Modify: `F/budgetplan/modules/overview/overview.component.html|scss|ts`, `F/budgetplan/modules/fixed-cost/fixed-cost.component.html|scss`, `…/fixed-cost-list/fixed-cost-list.component.html|scss`, `…/fixed-cost-details/fixed-cost-details.component.html|scss`, `…/create-fixed-cost/create-fixed-cost.component.html|scss`, `…/fixed-cost-history-dialog/fixed-cost-history-dialog.component.html|scss`, zugehörige `*.module.ts`

- [ ] **Step 1:** Bindungs-Inventar.
- [ ] **Step 2:** Übersicht nach Mockup 04: „Monatlicher Überschuss“ in `positive`, bei negativem Wert in `negative` mit Vorzeichen. Geteilter Balken mit Prozenten, Abschnitte Einnahmen und Ausgaben als Wertezeilen, kein `mat-progress-bar` mehr.
- [ ] **Step 3:** Fixkosten-Liste mit Abschnittskopf je Kategorie, Zeilen Name | Betrag + Intervall, Leertext „Keine Ausgaben.“, „Hinzufügen“ in `.actions`.
- [ ] **Step 4:** Formulare „Details“ und „Anlegen“ als `.field`. Der Verlauf-Button wird als Icon `history` (mit `aria-label`) in den Seitenkopf verschoben und öffnet den bestehenden History-Dialog als Sheet. Speichern mit Spinner.
- [ ] **Step 5 – Gate:** Inventar, Build. Browser bei 390 und 1440:
  - Fixkosten anlegen, bearbeiten, Verlauf ansehen, löschen.
  - Fixkosten anlegen, die das Einkommen übersteigen, und den negativen Überschuss prüfen (Review Focus 4).
  - Vergleich mit Screenshot 04 (Übersicht, Fixkosten, Bearbeiten).

### Task 11: Haushaltsplan – Einkommen [UI]

**Files:**
- Modify: `F/budgetplan/modules/income/income.component.html|scss`, `…/income-list/income-list.component.html|scss`, `…/income-details/income-details.component.html|scss`, `…/create-income/create-income.component.html|scss`, `…/income-history-dialog/income-history-dialog.component.html|scss`, zugehörige `*.module.ts`

- [ ] **Step 1:** Bindungs-Inventar.
- [ ] **Step 2:** Analog zu Task 10, Steps 3–4, nach Mockup 04 · Einkommen.
- [ ] **Step 3 – Gate:** Inventar, Build. Browser bei 390 und 1440:
  - Einkommen anlegen, bearbeiten, Verlauf ansehen, löschen.
  - Die Übersicht aktualisiert sich.
  - Vergleich mit Screenshot 04 (Einkommen).

### Task 12: Stunden – Personen, Person, Arbeitszeiten, Zahlung [UI]

**Files:**
- Modify: `F/work/modules/person/person.component.html|scss`, `…/person-list/person-list.component.html|scss`, `…/person-details/person-details.component.html|scss`, `…/add-person/add-person.component.html|scss`, `…/add-working-entry/add-working-entry.component.html|scss`, `…/work-entry-list/work-entry-list.component.html|scss`, `…/person-payment-dialog/person-payment-dialog.component.html|scss`, `…/work-entry-details/work-entry-details-dialog.component.html|scss`, zugehörige `*.module.ts`

- [ ] **Step 1:** Bindungs-Inventar.
- [ ] **Step 2:** Personenliste: Name | Tag „Zahlung offen“ (unter derselben Bedingung `isPaymentRequired`) | Stunden. Darunter die Aktionen „Arbeitszeiten hinzufügen“ (Primär) und „Person hinzufügen“ (Sekundär).
- [ ] **Step 3:** Personendetails mit Kennzahl-Zeile Gesamt | Bezahlt | Offen. Bezahlt und Offen nur bei Stundensatz > 0, wie bisher. Dazu Wertezeilen und den Abschnitt „Arbeitszeiten“. Aktionen `Zahlung | Bearbeiten | Löschen (Icon)` bzw. `Abbrechen | Speichern`.
- [ ] **Step 4:** „Arbeitszeiten hinzufügen“: Personen-Mehrfachauswahl, Datum, Start/Ende/Pause als 3er-Reihe, „Arbeitszeit netto“ 22/600, Notizen. Zahlungs-Dialog als Sheet mit Betrag und Trinkgeld nebeneinander. Den Arbeitszeit-Details-Dialog als Sheet.
- [ ] **Step 5 – Gate:** Inventar, Build. Browser bei 390 und 1440:
  - Zwei Personen anlegen, eine mit Stundensatz 0.
  - Arbeitszeiten für beide gleichzeitig erfassen.
  - Zahlung erfassen: Der Tag verschwindet bzw. erscheint passend.
  - Arbeitszeit-Details öffnen, Person bearbeiten und löschen.
  - Sheet „Zahlung“ auf 390 auf Erreichbarkeit prüfen (Review Focus 3).
  - Vergleich mit Screenshot 05.

### Task 13: Stunden – Statistik [UI]

**Files:**
- Modify: `F/work/modules/statistics/statistics.component.html|scss`, `F/work/modules/statistics/worktime/worktime.component.html|scss`, zugehörige `*.module.ts`

- [ ] **Step 1:** Bindungs-Inventar.
- [ ] **Step 2:** Das Segment kommt über `timerange-selection` aus Task 8. Kennzahl-Blöcke: Label 14 `muted`, Wert 30/600, „noch nicht bezahlt“ in `secondary-text`.
- [ ] **Step 3 – Gate:** Inventar, Build. Browser bei 390 und 1440: jeden Datumstyp wählen, die Werte passen zu den Testdaten aus Task 12. Vergleich mit Screenshot 05 (Statistik).

### Task 14: Einstellungen – Verbindungen [UI]

**Files:**
- Modify: `F/settings/modules/connection/connection.component.html|scss`, `…/active-connections/active-connections.component.html|scss`, `…/incoming-connection-requests/incoming-connection-requests.component.html|scss`, `…/outgoing-connection-requests/outgoing-connection-requests.component.html|scss`, `…/add-connection-dialog/add-connection-dialog.component.html|scss`, zugehörige `*.module.ts`

- [ ] **Step 1:** Bindungs-Inventar. Besonders wichtig hier, weil Annehmen und Ablehnen lokal nicht durchspielbar sind (`design.md` §6.3).
- [ ] **Step 2:** Drei Abschnitte nach Mockup 06 mit Zeilen E-Mail | Status (Punkt + Text). Eingehende Anfragen bekommen zwei 44-px-Buttons (Annehmen `positive-bg`/`positive`, Ablehnen `negative-bg`/`negative`, mit `aria-label`) und unveränderten Handlern. „Verbindung herstellen“ als Sekundär-Button.
- [ ] **Step 3 – Gate:** Inventar (jeder Annehmen-/Ablehnen-Handler nachweislich gebunden), Build. Browser bei 390 und 1440: Seite inklusive Leerzustände ansehen, Anfrage an `user2@email.at` senden, die ausgehende Anfrage erscheint. Vergleich mit Screenshot 06 (Verbindungen). Annehmen und Ablehnen testet der Nutzer auf DEV.

### Task 15: Einstellungen – Kategorien [UI]

**Files:**
- Modify: `F/settings/modules/categories/categories.component.html|scss`, `…/category-item-details/category-item-details.component.html|scss`, `…/color-item/color-item.component.html|scss`, `…/create-category/create-category.component.html|scss`, zugehörige `*.module.ts`

- [ ] **Step 1:** Bindungs-Inventar, einschließlich aller `cdkDrag*`/`cdkDropList`-Bindungen und `(cdkDropListDropped)`.
- [ ] **Step 2:** Liste mit Musterfeld | Name | Chevron. Im Modus „Reihenfolge anpassen“ erscheint links ein Drag-Griff (`cdkDragHandle`, Drag-Schatten nach DESIGN.md), die CDK-Logik bleibt unverändert. Aktionen „Hinzufügen“ und „Reihenfolge anpassen“ bzw. `Abbrechen | Speichern`.
- [ ] **Step 3:** Details und Anlegen: Name, Farbe (Select mit Musterfeld), Checkbox „Aufnehmen in Statistik“, Unterkategorien (Griff | Feld | Löschen-Icon), „Unterkategorie hinzufügen“. Aktionsleiste nach Mockup 06.
- [ ] **Step 4 – Gate:** Inventar, Build. Browser bei 390 und 1440:
  - Kategorie anlegen mit Farbe und zwei Unterkategorien.
  - Unterkategorien umsortieren und eine löschen.
  - Kategorien-Reihenfolge per Drag ändern, speichern und nach einem Reload prüfen.
  - Kategorie löschen.
  - Vergleich mit Screenshot 06 (Kategorien, Bearbeiten).

### Task 16: Export, Rechtstexte, Aufräumen [UI]

**Files:**
- Modify: `F/export/export.component.html|scss`, `F/data-protection/agb/agb.component.html|scss`, `F/data-protection/data-protection/data-protection.component.html|scss`, `F/data-protection/user-data/user-data.component.html|scss`, `src/styles.scss` (alte Klassen entfernen), alle `*.module.ts` mit nicht mehr genutzten Material-Modulen

- [ ] **Step 1:** Bindungs-Inventar für Export und die drei Textseiten.
- [ ] **Step 2:** Export nach Mockup 06: Abschnittskopf, zwei Zeilen-Buttons mit Icon-Kachel, Text und rechts Download-Icon bzw. Spinner bei `isExporting`. Textseiten: body 15/1.5, max. 70ch.
- [ ] **Step 3:** Per Grep prüfen, dass keine Template-Referenz mehr auf `.button-style`, `.dark-bg-color`, `.primary-bg-color`, `.floating-button`, `.bottom-button`, `.fullscreen-dialog`, `*-placeholder`, `<mat-card`, `<mat-divider`, `<mat-toolbar`, `<mat-chip`, `<mat-form-field` (außer bei dokumentiertem Rückfall aus Task 4) oder `mat-raised-button` existiert. Dann die Klassen aus `styles.scss` und die ungenutzten Module aus den `*.module.ts` entfernen.
- [ ] **Step 4 – Gate:** Inventar, Build. Browser bei 390 und 1440: beide Exporte herunterladen, die drei Rechtstexte öffnen, Vergleich mit Screenshot 06 (Export). Danach ein kurzer Klick-Durchlauf über alle Bereiche, weil das Aufräumen globale Styles betrifft.

### Task 17: Gesamtprüfung [UI]

Diesen Task deckt Phase 4 des Feature-Workflows ab (`ui-verification`). Er steht hier, damit er nicht vergessen wird.

- [ ] **Step 1:** `npm run build` ohne neue Warnungen gegenüber `build-baseline.txt`, `npx ng test --watch=false --browsers=ChromeHeadless` grün.
- [ ] **Step 2:** Die komplette Regressions-Checkliste aus `umsetzung.md` Phase 5.3 bei 390 × 844 und 1440 × 900. Ausnahme: Verbindungen annehmen und ablehnen, das macht der Nutzer auf DEV.
- [ ] **Step 3:** A11y nach `umsetzung.md` Phase 5.4: Mit Tab durch jede Seite (Fokus sichtbar), alle Icon-Buttons haben ein `aria-label`, Touch-Ziele ≥ 44 px.
- [ ] **Step 4:** Abschließende Screenshots aller Mockup-Screens nach `ui-testing/final-<nr>-<screen>-<390|1440>.png`, dazu eine Abweichungsliste (falls vorhanden) im Report.
