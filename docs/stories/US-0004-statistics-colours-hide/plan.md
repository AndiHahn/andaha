# Rechnungsstatistik: Farben und Ausblenden – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jede Kategorie in der Statistik zeigt ihre Farbe, auch Kategorien verbundener Benutzer. Kategorien lassen sich vorübergehend ausblenden.

**Architecture:** Das Backend liefert pro Ausgaben-Gruppe die Farbe mit: die eigene, wenn es eine gleichnamige eigene Kategorie gibt, sonst die aus der Gruppe. `ChartComponent` löst die Farbe ohne Fehler auf (DTO → eigene Kategorie → `'grey'`). Ausgeblendete Kategorien zeichnet sie nicht. `ExpensesComponent` hält die ausgeblendeten Namen und die sichtbare Summe.

**Tech Stack:** .NET 10 / EF Core 10 (Shopping-Service), Angular 14, ng2-charts 4, Chart.js 3.9, Jasmine/Karma.

**Spec:** `docs/stories/US-0004-statistics-colours-hide/design.md` (Story: `story.md` daneben)

## Global Constraints

- Kein `!`-Non-Null-Lookup und kein `throw` bei unbekannten Kategorien oder fehlender Farbe. Die Ersatzfarbe ist `'grey'`.
- Ausblenden nur im Speicher (kein Local Storage, kein Backend), Schlüssel ist der Kategoriename.
- Das Design „Tinte & Kupfer“ bleibt: nur bestehende Tokens (`--fg`, `--mut`, `--dim`, `--line2` …), Texte deutsch.
- Frontend-Befehle laufen in `src/WebApps/MiniClient/Andaha.WebApps.MiniClient`:
  - Tests: `npx ng test --watch=false --browsers=ChromeHeadless [--include <spec>]`
  - Build: `npx ng build`
- Backend-Gate: `dotnet build src/Services/Shopping/Andaha.Services.Shopping/Andaha.Services.Shopping.csproj` ohne neue Warnungen in den geänderten Dateien.
- Specs, die die Pipe `number:…:'de'` rendern, rufen `registerLocaleData(localeDe, 'de')` auf (`@angular/common/locales/de`).
- Nicht committen. Der Controller committet am Ende auf Anweisung des Nutzers.

## Review Focus

1. **Fremde Kategorie ohne Farbe** (älteres Backend, `color` fehlt, kein eigener Treffer): Die Zeile bekommt `'grey'`, alle anderen Zeilen behalten ihre Farbe. Abgedeckt durch Test `falls back to grey for unknown category without color` in Task 2.
2. **Ausgeblendet vor dem geklickten Segment:** Klick auf Segment 0, wenn Kategorie 0 der Legende ausgeblendet ist, öffnet Kategorie 1. Test `segment click maps to visible expense` in Task 2.
3. **Alle ausgeblendet:** Summe 0, keine Division durch 0, alle Prozentangaben sind „–“. Test `all hidden shows dash and empty dataset` in Task 2 und `sum is 0 when all hidden` in Task 3.
4. **Zeitraumwechsel:** Neue `expenses` lassen das Ausblenden bestehen, und die Summe wird über die sichtbaren neu berechnet. Test `hidden survives new expenses` in Task 3.
5. **Eigene und fremde Kategorie mit gleichem Namen:** Die eigene Farbe gewinnt (Backend). Abgedeckt durch den UI-Check (kein Backend-Testprojekt). Die Regel wird im Task-1-Review gegen den Code geprüft.

---

### Task 1: Backend – Farbe in `ExpenseDto` (kein UI)

**Files:**
- Modify: `src/Services/Shopping/Andaha.Services.Shopping/Requests/Expense/Dtos/V1/ExpenseDto.cs`
- Modify: `src/Services/Shopping/Andaha.Services.Shopping/Requests/Expense/GetExpenses/V1/GetExpensesQueryHandler.cs`

**Interfaces:**
- Produces: `public readonly record struct ExpenseDto(string Category, string Color, double Costs, IReadOnlyCollection<ExpenseSubCategoryDto> SubCategories);`. JSON (camelCase): `{ category, color, costs, subCategories }`.

- [ ] **Step 1:** `ExpenseDto` um `string Color` an zweiter Stelle erweitern. Alle Konstruktoraufrufe anpassen (`grep -rn "new ExpenseDto(" src/Services`).
- [ ] **Step 2:** Den Handler anpassen. Filter, Gruppierung und Sortierung bleiben unverändert.
  - In der Gruppen-Projektion die Fallback-Farbe mit `group.Min(b => b.Category.Color)` ermitteln (deterministisch, wird in SQL übersetzt).
  - In einer zweiten Abfrage die eigenen Kategorien laden: `dbContext.BillCategory.AsNoTracking().Where(c => c.UserId == userId).Select(c => new { c.Name, c.Color })`. Daraus eine Name→Farbe-Map bauen; bei doppelten Namen gewinnt der erste, `TryAdd`.
  - Nach dem Materialisieren pro Eintrag `expense with { Color = ownColors.TryGetValue(expense.Category, out var c) ? c : expense.Color }` setzen.
- [ ] **Step 3:** Ausführen: `dotnet build src/Services/Shopping/Andaha.Services.Shopping/Andaha.Services.Shopping.csproj`. Erwartet: `Build succeeded`, 0 Fehler.

---

### Task 2: Frontend – `ChartComponent` Farben + Ausblenden (UI)

**Files:**
- Modify: `src/WebApps/MiniClient/Andaha.WebApps.MiniClient/src/app/api/shopping/dtos/ExpenseDto.ts` (`color?: string`)
- Modify: `.../src/app/features/bill/modules/expenses/chart/chart.component.{ts,html,scss}`
- Create: `.../src/app/features/bill/modules/expenses/chart/chart.component.spec.ts`

**Interfaces:**
- Consumes: JSON-Feld `color` aus Task 1.
- Produces (für Task 3):
  - `@Input() hiddenCategories: string[] = []`
  - `@Output() visibilityToggled = new EventEmitter<string>()` (gibt den Kategorienamen aus)
  - `@Input() sum` bleibt (Summe der sichtbaren Kategorien, kommt von außen)
- Intern/testbar:
  - `colorOf(expense: ExpenseDto): string`
  - `isHidden(expense: ExpenseDto): boolean`
  - `visibleExpenses: ExpenseDto[]`
  - `percentOf(expense: ExpenseDto): number | null` (`null` bei ausgeblendet oder `sum == 0`)

- [ ] **Step 1: Failing Specs schreiben** in `chart.component.spec.ts`:
  - Setup: `TestBed` mit `ChartModule`, `MatDialog`-Spy (`open` gibt `{ afterClosed: () => of(undefined) }` zurück), Locale `de` registrieren.
  - Kategorien `A/red`, `B/blue`, `C/green`.
  - `ngOnChanges` mit `SimpleChange` für `expenses` bzw. `hiddenCategories` aufrufen, danach `detectChanges`.
  - Tests:
  - `uses color from expense dto`: Expense `{category:'X', color:'purple'}` ohne eigene Kategorie X → `chartDatasets[0].backgroundColor` = `['purple']`, `.dot` hat `background: purple`.
  - `falls back to own category color`: `{category:'B'}` ohne `color` → `'blue'`.
  - `falls back to grey for unknown category without color`: Expenses A(10), `Fremd`(5, ohne Farbe), C(3) → Hintergründe `['red','grey','green']`, kein Fehler, drei `.dot` mit `red`/`grey`/`green`.
  - `hidden category is not drawn`: `hiddenCategories=['A']` → `chartLabels` = `['B','C']`, Farben `['blue','green']`. Die Legende hat weiterhin 3 Zeilen, Zeile A hat die Klasse `hidden` und zeigt `–` statt `%`.
  - `segment click maps to visible expense`: A ausgeblendet, `chartClicked({active:[{index:0}]})` → `matDialog.open` mit `data.expense.category === 'B'`.
  - `legend row opens details of its own expense`: Klick auf `.lg-main` der Zeile A (auch wenn ausgeblendet) → Dialog mit A.
  - `eye button emits toggle`: Klick auf `.lg-eye` von Zeile B → `visibilityToggled` emittiert `'B'`. `aria-label` lautet „B ausblenden“ (sichtbar) bzw. „A einblenden“ (ausgeblendet), `aria-pressed` ist `'true'`/`'false'`.
  - `percent relative to sum`: `sum=20`, B(10) sichtbar → `percentOf(B) === 50`.
  - `all hidden shows dash and empty dataset`: alle ausgeblendet, `sum=0` → `chartDatasets[0].data` = `[]`, jede Zeile zeigt `–`.
- [ ] **Step 2:** Ausführen: `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/features/bill/modules/expenses/chart/chart.component.spec.ts`. Erwartet: FAIL, weil Member und Selektoren fehlen.
- [ ] **Step 3: Implementieren.**
  - `ExpenseDto.ts`: `color?: string`.
  - `chart.component.ts`:
    - Initialwert `chartDatasets = [{ data: [], backgroundColor: [] }]`, Platzhalter `'red'` und das ungenutzte `chartColors` entfernen.
    - `refreshChart()` baut aus `visibleExpenses` neue Arrays und weist ein **neues** `chartDatasets`-Array zu.
    - `ngOnChanges` ruft `refreshChart()` bei Änderung von `expenses` **oder** `hiddenCategories` auf.
    - `chartClicked` holt die Ausgabe aus `visibleExpenses[index]`. Die Legende ruft eine eigene Methode `openDetails(expense)` auf, die den Dialog-Code teilt.
    - `colorOf`: `expense.color || categories.find(c => c.name == expense.category)?.color || 'grey'`.
  - `chart.component.html`: Legendenzeile wird `<div class="lg" [class.hidden]="isHidden(expense)">` mit zwei Elementen:
    - `<button type="button" class="lg-main">`: Punkt mit `[style.background]="colorOf(expense)"`, `dot-light` bei `'white'`, dazu Name, `.p` (`percentOf` als Zahl mit `%` oder `–`), `.a` und Chevron.
    - `<button type="button" class="lg-eye" [attr.aria-label]="…" [attr.aria-pressed]="isHidden(expense)">` mit `mat-icon` `visibility` bzw. `visibility_off`. Ein Klick emittiert `visibilityToggled`.
  - `chart.component.scss`:
    - `.lg` wird Flex-Container ohne eigenen Button-Stil.
    - `.lg-main` übernimmt die bisherigen `.lg`-Button-Stile (Höhe 50 px, `flex: 1`, Fokusring nach innen). `padding-right` entfällt zugunsten des Augen-Buttons.
    - `.lg-eye`: 40 × 40 px, transparent, Icon 20 px in `var(--dim)`, Fokusring nach innen.
    - `.hidden`: `.n`, `.a` und `.dot` gedämpft (z. B. `opacity: .45`), Icon in `var(--mut)`.
- [ ] **Step 4:** Spec wie in Step 2 ausführen. Erwartet: alle PASS.

---

### Task 3: Frontend – `ExpensesComponent` Zustand und sichtbare Summe (UI)

**Files:**
- Modify: `.../src/app/features/bill/modules/expenses/expenses.component.{ts,html}`
- Create: `.../src/app/features/bill/modules/expenses/expenses.component.spec.ts`

**Interfaces:**
- Consumes: `hiddenCategories`, `visibilityToggled`, `sum` aus Task 2.
- Produces:
  - `hiddenCategories: string[]` (immer neues Array bei Änderung, damit `OnChanges` greift)
  - `toggleCategory(name: string): void`
  - `sum` = Summe der sichtbaren Kategorien, auf 2 Nachkommastellen gerundet wie bisher

- [ ] **Step 1: Failing Specs schreiben.**
  - Setup: `ExpenseContextService` als Stub mit `BehaviorSubject`s für `expenses()` und `availableTimeRange()` sowie `loadExpenses`-Spy; `BillCategoryContextService` als Stub (`categories()` → `of([...])`). Template mit `NO_ERRORS_SCHEMA`, oder `TestBed.overrideTemplate`, damit die Kinder nicht gerendert werden.
  - Tests:
  - `toggle hides and shows`: `toggleCategory('A')` → `hiddenCategories` = `['A']`; noch einmal → `[]`; die Array-Referenz ändert sich jedes Mal.
  - `sum only over visible`: expenses A(10.10), B(5.20) → `sum` 15.3; `toggleCategory('A')` → `sum` 5.2.
  - `hidden survives new expenses`: A ausgeblendet, dann neue expenses A(1), C(2) emittieren → `hiddenCategories` weiterhin `['A']`, `sum` 2.
  - `sum is 0 when all hidden`: alle ausgeblendet → `sum` 0.
- [ ] **Step 2:** `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/features/bill/modules/expenses/expenses.component.spec.ts` ausführen. Erwartet: FAIL.
- [ ] **Step 3: Implementieren.**
  - `calculateSum` rechnet nur über die nicht ausgeblendeten.
  - `toggleCategory` setzt ein neues Array und berechnet die Summe neu.
  - Template: `<app-chart … [hiddenCategories]="hiddenCategories" (visibilityToggled)="toggleCategory($event)">`.
- [ ] **Step 4:** Spec ausführen → PASS. Danach die ganze Suite (`npx ng test --watch=false --browsers=ChromeHeadless`) und `npx ng build`. Erwartet: alle Tests grün, Build ohne Fehler.
