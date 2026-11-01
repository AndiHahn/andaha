# Aufräumarbeiten nach dem Redesign (US-0003) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die App-Shell füllt genau den sichtbaren Bildschirm (keine Dokument-Scrollbar, auch in der Android-PWA), die Rechnungssuche löst ruhig aus und zeigt nur Ergebnisse der neuesten Anfrage, und der Export zeigt den Spinner nur in der gedrückten Zeile.

**Architecture:** Drei unabhängige Frontend-Korrekturen: (1) CSS-Layout der Shell + Safe Areas, (2) Auslöselogik in der Filter-Komponente plus Verwerfen veralteter Antworten im `BillContextService`, (3) Export-Zustand pro Zeile.

**Tech Stack:** Angular 14, Angular Material 14, RxJS 7.4, Jasmine/Karma (ChromeHeadless).

**Spec:** [design.md](./design.md), Akzeptanzkriterien in [story.md](./story.md)

Frontend-Pfad (im Folgenden `<FE>`): `src/WebApps/MiniClient/Andaha.WebApps.MiniClient`

## Global Constraints

- Nur Frontend; kein Backend-Change; API-Aufrufe mit unveränderten Parametern.
- Design-Tokens, Texte und Optik von „Tinte & Kupfer“ bleiben unverändert (außer den Safe-Area-Abständen, die ohne Insets 0 sind).
- Suche: Tipp-Pause **600 ms**; sofort bei Enter/„Suchen“-Taste, „Suche löschen“ und leerem Feld; Suchbegriff wird getrimmt; `distinctUntilChanged` über beide Wege.
- Export-Zustand: `exporting: 'expenses' | 'work' | null`.
- Library-APIs (RxJS 7, Angular Material 14) bei Zweifel per Context7 nachschlagen: `/reactivex/rxjs/7_8_2`, `/websites/material_angular_dev/v14`.
- Commits: keine – der Nutzer entscheidet am Ende.
- Gate pro Task (in `<FE>`): `npx ng test --watch=false --browsers=ChromeHeadless` → alle grün (Baseline: `TOTAL: 40 SUCCESS`), plus `npx ng build` ohne Fehler (bekannte Warnungen „… is part of the TypeScript compilation but it's unused“ sind vorbestehend).

## Review Focus

- Android-Bildschirmtastaturen (Gboard) liefern bei `keyup` oft `key: 'Unidentified'` bzw. Composition-Events → Wertänderungen über das `input`-Event erfassen, nicht über `keyup`; Enter über `keyup.enter`. Test in Task 2.
- Enter und danach ablaufende Tipp-Pause mit identischem Begriff → genau eine Suche. Test in Task 2.
- Nach „Suche löschen“ denselben Begriff wieder eintippen → muss erneut suchen (Distinct darf nicht hängen bleiben). Test in Task 2.
- Scrollen lädt Seite 2, während Seite 1 noch lädt → beide Antworten landen in der Liste (kein gegenseitiges Abbrechen innerhalb einer Suche). Test in Task 3.
- `loading()` darf nicht auf `false` springen, wenn eine veraltete Anfrage abgebrochen/verworfen wird, solange die neueste noch läuft. Test in Task 3.

---

### Task 1: Shell-Höhe und Safe Areas

UI-relevant: **ja**.

**Files:**
- Modify: `<FE>/src/index.html` (Viewport-Meta, Zeile 7)
- Modify: `<FE>/src/styles.scss` (`html, body` Block, Zeilen 6-8)
- Modify: `<FE>/src/app/app.component.scss` (`.shell`, `.shell-main`, Drawer `.side`)

**Interfaces:** keine (reines CSS/HTML).

- [ ] **Step 1: Viewport-Meta** um `viewport-fit=cover` ergänzen (übrige Werte unverändert lassen).
- [ ] **Step 2: Dokument scrollt nie:** in `styles.scss` `html, body { height: 100%; overflow: hidden; overscroll-behavior: none; }`.
- [ ] **Step 3: Shell anheften:** `.shell` – `height: 100vh; height: 100dvh;` ersetzen durch `position: fixed; inset: 0;` (Hintergrund bleibt).
- [ ] **Step 4: Safe Areas:** `.shell-main` bekommt `padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px);` (box-sizing ist global border-box; `height: 100%` bleibt). Der Drawer (`mat-sidenav`, Klasse `.side`) bekommt dieselben oberen/unteren Abstände, damit „Andaha“-Kopf und Rechtstexte nicht unter System-Leisten liegen.
- [ ] **Step 5: Gate** – `npx ng test --watch=false --browsers=ChromeHeadless` → `TOTAL: 40 SUCCESS`; `npx ng build` → ohne Fehler. (Layout-Nachweis erfolgt in Phase 4 per Playwright: bei 390 × 844 und 1440 × 900 `document.scrollingElement.scrollHeight <= window.innerHeight` und `.bottom-nav` vollständig im Viewport.)

### Task 2: Auslöselogik der Rechnungssuche

UI-relevant: **ja** (Template-Events).

**Files:**
- Modify: `<FE>/src/app/features/bill/modules/bill-list/bill-list-filter/bill-list-filter.component.ts`
- Modify: `<FE>/src/app/features/bill/modules/bill-list/bill-list-filter/bill-list-filter.component.html` (Input-Events, Zeile ~10)
- Create: `<FE>/src/app/features/bill/modules/bill-list/bill-list-filter/bill-list-filter.component.spec.ts`

**Interfaces:**
- Produces (unverändert): `@Output() searchTextChanged: EventEmitter<string>` – emittiert den **getrimmten** Begriff.
- Neu (Template-Handler, Namen verbindlich): `onSearchInput(value: string): void` (am `(input)`-Event), `onSearchEnter(value: string): void` (am `(keyup.enter)`-Event). `onClearSearch()` bleibt (leert Feld, sofortige Emission `''`). `searchBoxKeyup` entfällt; `(keyup)`-Binding entfällt. `searchBoxKeyDown` bleibt.
- Implementierung: zwei Ströme (verzögert `debounceTime(600)`; sofort) per `merge`, danach `distinctUntilChanged()`, dann Emission; leerer getrimmter Wert geht in den sofortigen Strom. Subscription endet in `ngOnDestroy` (`takeUntil`). Konstante `searchDebounceMs = 600` in der Komponente.

Test-Setup: `TestBed` mit `BillListFilterComponent`, `NO_ERRORS_SCHEMA`, Mocks für `BillListFilterDialogService` und `BillCategoryContextService` (Methoden, die `ngOnInit` aufruft, liefern leere Observables/Arrays – im Code nachsehen). `fakeAsync` + `tick`. Emissionen über `spyOn(component.searchTextChanged, 'emit')` bzw. Subscribe sammeln.

- [ ] **Step 1: Failing tests** (`describe('BillListFilterComponent search')`):
  - `does not search before 600 ms of typing pause` – `onSearchInput('Bil')`, `tick(599)` → keine Emission; `tick(1)` → `['Bil']`.
  - `searches only the last value while typing quickly` – `onSearchInput('B')`, `tick(300)`, `onSearchInput('Bi')`, `tick(300)`, `onSearchInput('Bil')`, `tick(600)` → `['Bil']`.
  - `searches immediately on enter` – `onSearchInput('Billa')`, `onSearchEnter('Billa')` → sofort `['Billa']`; `tick(600)` → weiterhin `['Billa']` (keine Doppelsuche).
  - `trims the search text and ignores whitespace-only changes` – `onSearchInput('Billa ')`, `tick(600)` → `['Billa']`; `onSearchInput('Billa  ')`, `tick(600)` → weiterhin `['Billa']`.
  - `emits an empty search immediately when the field is cleared by typing` – nach `['Billa']`: `onSearchInput('')` → sofort `['Billa', '']`.
  - `emits an empty search immediately on clear button` – nach `['Billa']`: `onClearSearch()` → sofort `['Billa', '']`.
  - `searches the same term again after clearing` – `['Billa']`, `onClearSearch()`, `onSearchInput('Billa')`, `tick(600)` → `['Billa', '', 'Billa']`.
  - `binds input and keyup.enter instead of keyup` – Template-Test: `input`-Event am Suchfeld mit Wert `'X'` dispatchen, `tick(600)` → `['X']`; `KeyboardEvent('keyup', { key: 'Enter' })` dispatchen nach Wert `'Y'` → sofort `'Y'`; ein `keyup` mit `key: 'Unidentified'` allein löst nichts aus.
- [ ] **Step 2: RED** – `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/features/bill/modules/bill-list/bill-list-filter/bill-list-filter.component.spec.ts` → FAIL.
- [ ] **Step 3: Implementieren** gemäß Interfaces.
- [ ] **Step 4: GREEN** – gleicher Befehl → alle 8 PASS.
- [ ] **Step 5: Gate** – Gesamtsuite grün (40 + 8), `npx ng build` ohne Fehler.

### Task 3: Veraltete Suchantworten im BillContextService verwerfen

UI-relevant: nein (Service), wirkt aber auf die Liste → Phase 4 prüft über Netzwerk-Requests.

**Files:**
- Modify: `<FE>/src/app/features/bill/services/bill-context.service.ts` (`searchBills`, `setPageSize`, `fetchBills`, Zeilen ~73-113, 229-252)
- Create: `<FE>/src/app/features/bill/services/bill-context.service.spec.ts`

**Interfaces:**
- Öffentliche API unverändert (`searchBills()`, `fetchNextBills()`, `setPageSize()`, `bills()`, `loading()`, `refreshBills()` …).
- Regel: Ein **Zurücksetzen** (`searchBills()`, `setPageSize()`) beginnt eine neue Abfrage-Generation. Laufende HTTP-Requests früherer Generationen werden abgebrochen (Unsubscribe), ihre Antworten nie in `bills$` übernommen. Requests derselben Generation (Seiten-Nachladen, `refreshBills`, Fetch nach Update/Delete/`backendReady`) brechen sich gegenseitig **nicht** ab. `loading$` ist `true`, solange mindestens ein Request der aktuellen Generation läuft, sonst `false`.
- Implementierung (verbindlich, weil Tests darauf basieren): privater Zähler `queryGeneration: number`, Menge laufender Subscriptions der aktuellen Generation; beim Zurücksetzen alle unsubscriben und leeren, Zähler erhöhen, **bevor** der neue Fetch startet.

Test-Setup: `BillApiService.searchBills` als Spy, der pro Aufruf ein eigenes `Subject<PagedResult>` zurückgibt (Liste der Subjects merken); `ContextService.backendReady()` → `new Subject<boolean>()`; `BillCacheService.billAdded()` → `new Subject()`, sonstige im Konstruktor genutzte Methoden minimal mocken. Ergebnis-Form im Code nachsehen (`{ values, totalCount }`).

- [ ] **Step 1: Failing tests** (`describe('BillContextService search')`):
  - `ignores the response of a search that was superseded` – Konstruktor-Fetch beantworten; `setSearchText('Bil'); searchBills()` (Request A), `setSearchText('Billa'); searchBills()` (Request B); B antwortet mit `[billa]`, danach A mit `[bil]` → `bills()` enthält nur `billa`.
  - `cancels the http request of a superseded search` – wie oben; erwartet `subjectA.observers.length === 0` nach dem zweiten `searchBills()`.
  - `keeps page results of the same search` – Suche starten, `totalCount: 120`, Seite 1 noch offen; `fetchNextBills()` (Seite 2); beide antworten (Reihenfolge 2, dann 1) → `bills()` enthält Einträge beider Seiten.
  - `stays loading while the newest search is still running` – A und B wie oben; A wird abgebrochen → `loading()` letzter Wert `true`; B antwortet → `false`.
  - `starts a new generation on page size change` – Request offen, `setPageSize(100)` → alter Request abgebrochen, neuer gestartet mit `pageSize: 100`.
- [ ] **Step 2: RED** – `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/features/bill/services/bill-context.service.spec.ts` → FAIL.
- [ ] **Step 3: Implementieren** gemäß Regel.
- [ ] **Step 4: GREEN** – alle 5 PASS.
- [ ] **Step 5: Gate** – Gesamtsuite grün, `npx ng build` ohne Fehler.

### Task 4: Export-Spinner pro Zeile

UI-relevant: **ja**.

**Files:**
- Modify: `<FE>/src/app/features/export/export.component.ts`
- Modify: `<FE>/src/app/features/export/export.component.html`
- Create: `<FE>/src/app/features/export/export.component.spec.ts`

**Interfaces:**
- `exporting: 'expenses' | 'work' | null = null` ersetzt `isExporting`. Handler-Namen bleiben (`onExportExpensesClick`, `onExportWorkInformationClick`). Zurücksetzen per `finalize`. Template: Spinner/Download-Icon je Zeile an `exporting === 'expenses'` bzw. `'work'`; beide Buttons `[disabled]="exporting !== null"`.

Test-Setup: Mocks `ExpenseContextService.downloadExpenses` / `PersonContextService.downloadPersonInformations` liefern steuerbare `Subject`s; Komponente rendern (MatProgressSpinnerModule importieren oder `NO_ERRORS_SCHEMA`), Spinner über `querySelectorAll('mat-spinner')` pro Button zählen.

- [ ] **Step 1: Failing tests** (`describe('ExportComponent')`):
  - `shows the spinner only in the expenses row` – Klick „Ausgaben“ → genau 1 `mat-spinner`, und zwar im ersten Button.
  - `shows the spinner only in the work row` – Klick „Personen/Arbeitszeiten“ → genau 1 Spinner im zweiten Button.
  - `disables both buttons while an export runs` – beide `disabled === true`.
  - `resets after success` – Subject `next` + `complete` → 0 Spinner, beide Buttons aktiv.
  - `resets after error` – Subject `error` → 0 Spinner, beide aktiv.
- [ ] **Step 2: RED** – `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/features/export/export.component.spec.ts` → FAIL.
- [ ] **Step 3: Implementieren.**
- [ ] **Step 4: GREEN** – alle 5 PASS.
- [ ] **Step 5: Gate** – Gesamtsuite grün (`TOTAL: 58 SUCCESS` = 40 + 8 + 5 + 5), `npx ng build` ohne Fehler.
