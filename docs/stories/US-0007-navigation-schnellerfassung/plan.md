# US-0007 Navigation, Schnellerfassung, Vorlagen und Scan – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die MiniClient-PWA bekommt Hauptleiste mit Tabs und Wischen, eine Schnellerfassung mit Vorlagen und Vorschlägen (inkl. Backend), einen synchronen Scan-Ablauf, einen aufgeräumten Analyse-Tab, einen korrigierten Analyse-Worker sowie App-Shortcut und Share Target.

**Architecture:** Backend-Erweiterungen im Shopping-Service (Minimal APIs + MediatR, EF Core, gehostet im Monolith): Vorlagen, Vorschläge, Shop-Statistik, Analyse verwerfen, typisiertes Analyse-Ergebnis, Worker mit Versuchszähler. Frontend: ein zentrales Navigationsregister (`NAV_AREAS`) speist Hauptleiste, Sidebar, Tabs und Wischgeste; die Schnellerfassung ist ein `MatBottomSheet` (Desktop: `MatDialog`) mit reiner, getesteter Logik in eigenen Dateien; Speichern läuft über den bestehenden `BillContextService.addBill`.

**Tech Stack:** Angular 22.2 (Standalone, Material 22 mit M2-Theme, CDK), Vitest im Browser-Modus, .NET (Minimal APIs, MediatR, FluentValidation, EF Core, xUnit + NSubstitute + SQLite in-memory).

**Spec:** [`design.md`](./design.md) (vom Nutzer freigegeben) und [`story.md`](./story.md) (AC1–AC41, verbindlich); UI verbindlich: `docs/design/v2/README.md`, `docs/design/v2/mockups/*.html`, `docs/design/v2/screenshots/*.png`.

## Global Constraints

- Branch `feature/us-0007-navigation-schnellerfassung` von `master`; ein Merge am Ende. Nicht pushen.
- Frontend-Pfad `src/WebApps/MiniClient/Andaha.WebApps.MiniClient` (im Folgenden `FE/`), App-Code `FE/src/app/`. Backend `src/Services/Shopping/Andaha.Services.Shopping` (`BE/`), Tests `src/Services/Shopping/Andaha.Services.Shopping.Tests` (`BET/`).
- Neue Angular-Komponenten: standalone, Muster der Nachbarn übernehmen (u. a. `changeDetection` wie die Nachbarkomponenten, `inject()`), Control Flow (`@if/@for` mit eindeutigem `track`), deutsche UI-Texte exakt wie in v2/Design.
- Farben, Radien, Abstände nur über die Tokens aus `FE/src/themes/_andaha-tokens.scss` bzw. die CSS-Variablen aus `styles.scss`; keine neuen Hex-Werte in Komponenten. Maße aus v2 README „Komponenten“.
- Breakpoint Desktop: `(min-width: 1024px)` (wie `AppComponent`).
- Backend-Stil wie vorhanden: `Requests/<Bereich>/<Name>/V1/{Command|Query}.cs`, `…Handler.cs`, `…Validator.cs`; `IIdentityService.GetUserId()`; Ergebnisse `IResult`; Endpoints über `MediateGet/MediatePost/MediatePut/MediateDelete` mit `.Produces(...)`.
- Bibliotheks-APIs (Angular, Material/CDK, Router View Transitions, Service Worker, EF Core) per Context7 nachschlagen, nicht aus dem Gedächtnis.
- Code-Navigation und -Änderungen bevorzugt über Serena (`find_symbol`, `find_referencing_symbols`, Symbol-Edits).
- Gates pro Task (soweit betroffen): `cd FE && npm test` grün; `npx ng build --configuration production` ohne neue Warnungen; `dotnet build src/Services/Monolith/Andaha.Services.Monolith/Andaha.Services.Monolith.csproj` und `dotnet test src/Services/Shopping/Andaha.Services.Shopping.Tests` grün.
- UI-Tasks: Sichtprüfung nur der eigenen Screens bei 390 × 844 und 1440 × 900 gegen die v2-Screenshots, Screenshots nach `docs/stories/US-0007-navigation-schnellerfassung/ui-testing/task-N/`. Voller Abgleich erst in Phase 4. Login über B2C mit Testzugang aus dem Dispatch; Zugangsdaten nie in Dateien, Commits oder Berichte.
- Dev-Server: `npx ng serve` auf 4200 (fester Port, B2C-Redirect); Backend: `dotnet run --launch-profile Andaha.Services.MonolithApi` in `src/Services/Monolith/Andaha.Services.Monolith` (Port 8900). Vor `npm ci` den Dev-Server stoppen (EBUSY).
- Commits: klein, konventionell, Betreff mit „(US-0007)“, Trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; nur explizite Pfade stagen (nie `git add -A`/`.`).

## Review Focus

1. **Komma oder Punkt im Desktop-Betragsfeld** („12.5“ per Tastatur, „12,50“ per Einfügen): beides wird als 12,50 € verstanden, „1.234,50“ als 1234,50. → Test in Task 7 (`parseAmount`).
2. **Vorlage oder Entwurf verweist auf eine inzwischen gelöschte Kategorie/Unterkategorie:** Kachel fällt still weg bzw. Entwurf behält nur Betrag und Datum, kein Fehler. → Tests in Task 7 (`buildTiles`, `restoreDraft`).
3. **Wischen beginnt auf einem waagrecht scrollbaren Chip-Streifen oder in einem Eingabefeld:** kein Tab-Wechsel. → Test in Task 6 (`isSwipeExcluded`).
4. **Sheet wird durch Speichern geschlossen, danach Zurück-Taste:** genau eine Navigation zurück, kein „toter“ Druck. → Test in Task 6 (`OverlayBackService`).
5. **Ohne Netz:** Duplikat-Abfrage scheitert → kein Hinweis, Speichern bleibt möglich und landet im Offline-Cache. → Test in Task 8 (Sheet-Komponente mit fehlschlagendem `searchBills`).

---

## Backend

### Task 1: Vorlagen – Entitäten, Migration, CRUD und Reihenfolge

**Files:**
- Create: `BE/Core/BillTemplate.cs`, `BE/Core/HiddenBillSuggestion.cs`
- Create: `BE/Infrastructure/EntityConfiguration/BillTemplateModelBuilder.cs`, `HiddenBillSuggestionModelBuilder.cs`
- Modify: `BE/Infrastructure/ShoppingDbContext.cs` (DbSets `BillTemplate`, `HiddenBillSuggestion`)
- Create: Migration `AddBillTemplates` in `BE/Infrastructure/Migrations/`
- Create: `BE/Requests/BillTemplate/BillTemplateEndpointExtensions.cs`, `BE/Requests/BillTemplate/Dtos/V1/BillTemplateDto.cs`
- Create: `BE/Requests/BillTemplate/{ListBillTemplates,CreateBillTemplate,UpdateBillTemplate,DeleteBillTemplate,UpdateBillTemplateOrder}/V1/*`
- Modify: `BE/ProgramEndpointExtensions.cs` (`app.MapBillTemplateEndpoint()`)
- Modify: `BE/Requests/BillCategory/DeleteBillCategory/V1/DeleteBillCategoryCommandHandler.cs`, `BE/Requests/BillCategory/UpdateBillCategory/V1/*Handler.cs` (Aufräumen bei gelöschter Kategorie/Unterkategorie)
- Test: `BET/BillTemplate/BillTemplateHandlerTests.cs`, `BET/BillTemplate/BillTemplateValidatorTests.cs`

**Interfaces:**
- Produces: `BillTemplateDto(Guid Id, string? Name, string? ShopName, Guid CategoryId, Guid? SubCategoryId, int SortOrder)`; Endpoints unter `/api/bill-template` (versioniert wie `/api/bill`): `GET /`, `POST /` (Body `CreateBillTemplateCommand(string? Name, string? ShopName, Guid CategoryId, Guid? SubCategoryId)` → 200 `BillTemplateDto`), `PUT /{id}` (`UpdateBillTemplateCommand(Guid Id, string? Name, string? ShopName, Guid CategoryId, Guid? SubCategoryId)` → 204), `DELETE /{id}` → 204, `PUT /order` (`UpdateBillTemplateOrderCommand(Guid[] Ids)` → 204).
- Entität `HiddenBillSuggestion(Guid Id, Guid UserId, string ShopName, Guid CategoryId, Guid? SubCategoryId)` – nur angelegt, Endpoints in Task 2.

- [ ] **Step 1: Branch anlegen** – `git checkout -b feature/us-0007-navigation-schnellerfassung master`.
- [ ] **Step 2: Failing Tests schreiben** (`BillTemplateHandlerTests`, Muster `CreateBillCommandHandlerTests` mit `TestDb.CreateShopping()`):
  - `Create_appends_with_next_sort_order` – zwei Creates → `SortOrder` 0 und 1.
  - `Create_with_blank_shop_stores_null` – `ShopName = "  "` → gespeichert `null` (= beim Erfassen wählen); Name/Shop werden getrimmt.
  - `List_returns_only_own_templates_sorted` – Vorlagen von UserA und UserB; UserA sieht nur seine, aufsteigend nach `SortOrder`.
  - `Update_foreign_template_returns_not_found`, `Delete_foreign_template_returns_not_found`.
  - `Update_order_sets_sort_order_in_given_sequence` – Ids [c, a, b] → SortOrder c=0, a=1, b=2.
  - `Update_order_with_missing_or_foreign_id_is_rejected` (Validator) – fehlende eigene ID, doppelte ID oder fremde ID → ungültig.
  - `Deleting_category_removes_its_templates_and_hidden_suggestions`; `Deleting_subcategory_clears_template_subcategory_and_removes_hidden_suggestions`.
  - Validator: `CategoryId` gehört dem Benutzer, `SubCategoryId` gehört zur Kategorie, `Name` ≤ 100, `ShopName` ≤ 200.
- [ ] **Step 3: Tests laufen lassen** – `dotnet test src/Services/Shopping/Andaha.Services.Shopping.Tests --filter BillTemplate` → FAIL (Typen fehlen).
- [ ] **Step 4: Implementieren** – Entitäten mit Konstruktor wie `BillCategory`; FKs auf `BillCategory`/`BillSubCategory`. Aufräumen bei Löschen im jeweiligen Handler (kein Cascade über zwei Pfade, SQL Server lehnt sonst ab). Migration: `dotnet ef migrations add AddBillTemplates --project src/Services/Shopping/Andaha.Services.Shopping --startup-project src/Services/Monolith/Andaha.Services.Monolith --context ShoppingDbContext --output-dir Infrastructure/Migrations` (NuGet-Feed-Hinweis: siehe Projekt-README/Memory; bei Restore-Problemen melden, nicht umgehen).
- [ ] **Step 5: Tests grün** – `dotnet test … --filter BillTemplate` → PASS; dann gesamte Testsuite und `dotnet build` des Monolith → grün.
- [ ] **Step 6: Commit** – `feat(shopping): bill templates with order (US-0007)`.

### Task 2: Vorschläge, ausgeblendete Vorschläge, Shop-Statistik

**Files:**
- Create: `BE/Requests/BillTemplate/{GetBillSuggestions,HideBillSuggestion}/V1/*`, `BE/Requests/BillTemplate/Dtos/V1/BillSuggestionDto.cs`
- Create: `BE/Requests/Bill/GetShopStats/V1/*`, `BE/Requests/Bill/Dtos/V1/ShopStatDto.cs`
- Modify: `BE/Requests/BillTemplate/BillTemplateEndpointExtensions.cs`, `BE/Requests/Bill/BillEndpointExtensions.cs`
- Test: `BET/BillTemplate/BillSuggestionTests.cs`, `BET/Bill/ShopStatsTests.cs`

**Interfaces:**
- Consumes: `HiddenBillSuggestion` (Task 1).
- Produces: `GET /api/bill-template/suggestions` → `BillSuggestionDto(string ShopName, Guid CategoryId, Guid? SubCategoryId, int Count)[]`; `POST /api/bill-template/hidden-suggestions` Body `HideBillSuggestionCommand(string ShopName, Guid CategoryId, Guid? SubCategoryId)` → 204, idempotent; `GET /api/bill/shop-stats` → `ShopStatDto(string ShopName, Guid CategoryId, Guid? SubCategoryId, int Count, DateTime LastUsed)[]`.

- [ ] **Step 1: Failing Tests** (`BillSuggestionTests`, `ShopStatsTests`):
  - `Suggestions_group_by_shop_case_insensitive_and_use_most_frequent_spelling` – „Billa“ ×2, „billa “ ×1 gleiche Kategorie → ein Vorschlag „Billa“, Count 3.
  - `Suggestions_only_last_90_days` – Rechnung vor 91 Tagen zählt nicht, vor 89 Tagen zählt.
  - `Suggestions_require_at_least_two_bills` – Kombination mit 1 Rechnung fehlt.
  - `Suggestions_only_own_bills` – Rechnungen von UserB (verbunden oder nicht) zählen nicht.
  - `Suggestions_exclude_hidden` – ausgeblendete Kombination (Shop case-insensitive) fehlt.
  - `Suggestions_ordered_by_count_then_last_used_max_20` – 22 Kombinationen → 20, korrekte Reihenfolge.
  - `Hide_suggestion_twice_creates_one_entry`; `Hide_suggestion_with_foreign_category_is_rejected`.
  - `Shop_stats_last_365_days_grouped_with_count_and_last_used` – inkl. Grenze 365/366 Tage und nur eigene Rechnungen.
- [ ] **Step 2: Tests laufen lassen** → FAIL.
- [ ] **Step 3: Implementieren** – Gruppierung in der Datenbank über `ShopName.Trim().ToLower()` + Kategorie + Unterkategorie, Schreibweise = häufigste Originalschreibweise der Gruppe (in Speicher nach dem Gruppieren zulässig, Datenmenge ist pro Benutzer klein). Zeitgrenzen relativ zu `DateTime.UtcNow`. Route `shop-stats` wird vor `{id}` registriert bzw. ist als Literal eindeutig – mit einem GET-Aufruf im Smoke-Test prüfen.
- [ ] **Step 4: Tests grün** + Monolith-Build.
- [ ] **Step 5: Commit** – `feat(shopping): bill suggestions and shop stats (US-0007)`.

### Task 3: Analyse – typisiertes Ergebnis, Verwerfen, Worker mit Versuchszähler

**Files:**
- Create: `BE/Requests/Bill/AnalyzeBill/V1/AnalyzeBillResultDto.cs`; Modify: `AnalyzeBillCommandHandler.cs`
- Create: `BE/Requests/Bill/DeleteAnalyzedBill/V1/*`; Modify: `BillEndpointExtensions.cs` (`MediateDelete<…>("analyzed/{id}")`)
- Modify: `BE/Infrastructure/ImageRepositories/Analysis/{IAnalysisImageRepository,AzureStorageAnalysisImageRepository,FileSystemAnalysisImageRepository}.cs` und den Typ `ImageMetadata`
- Modify: `BE/BackgroundJobs/AnalyzeBillWorker.cs`
- Create: `BE/BackgroundJobs/FailedAnalysisImageHandler.cs`
- Test: `BET/Bill/AnalyzeBillResultTests.cs`, `BET/Bill/DeleteAnalyzedBillTests.cs`, `BET/BackgroundJobs/AnalyzeBillWorkerTests.cs`, `BET/BackgroundJobs/FileSystemAnalysisImageRepositoryTests.cs`

**Interfaces:**
- Produces: `POST /api/bill/analyze` → `AnalyzeBillResultDto(string? ShopName, DateTime? Date, double? TotalAmount, Guid? CategoryId, Guid? SubCategoryId, double? Confidence, IReadOnlyList<AnalyzeBillLineItemDto> LineItems)` mit `AnalyzeBillLineItemDto(string? Description, double? Quantity, double? UnitPrice, double? TotalPrice)`; `Date` = Datumsteil von `InvoiceDate`; Kategorie nur, wenn die Klassifizierung gültig ist (Verhalten wie heute).
- Produces: `DELETE /api/bill/analyzed/{id}` → 204 / 404 (fremd oder unbekannt); löscht Eintrag, Positionen und Bild im Bild-Repository.
- Produces (Repository): `ImageMetadata` erweitert um `int Attempts`, `DateTimeOffset? ClaimedUntilUtc`, `bool LegacyProcessed`; `IAnalysisImageRepository.ClaimAsync(string name, DateTimeOffset claimedUntilUtc, CancellationToken ct)` (erhöht `Attempts` um 1, setzt `ClaimedUntilUtc`); `MarkAsProcessedAsync` entfällt. `ListImagesAsync` liefert jetzt auch Bilder mit Legacy-`processedAt` (dann `LegacyProcessed = true`).
- Konstanten im Worker: `MaxAttempts = 3`, `ClaimDuration = TimeSpan.FromMinutes(10)`.

- [ ] **Step 1: Failing Tests:**
  - `Analyze_returns_typed_result_with_date_only_and_valid_classification` (Fakes für `IInvoiceAnalysisService`, `ICategoryClassificationService`; ungültige Klassifizierung → `CategoryId` null).
  - `Delete_analyzed_bill_removes_entry_line_items_and_image`; `Delete_foreign_analyzed_bill_returns_not_found`; `Get_analyzed_bills_does_not_contain_deleted_entry`.
  - Worker (Fake-Repository, Fake-Broker, Fake-`FailedAnalysisImageHandler`): `Skips_image_claimed_in_future`; `Claims_before_publishing`; `Publish_failure_keeps_image_for_retry_after_claim_expires`; `Image_with_three_attempts_becomes_empty_analyzed_bill_and_is_deleted`; `Legacy_processed_image_becomes_empty_analyzed_bill`.
  - `FailedAnalysisImageHandler`: `Creates_analyzed_bill_with_empty_fields_and_image_for_owner`.
  - FileSystem-Repository (Temp-Verzeichnis): `Claim_updates_existing_metadata_sidecar` (Datei `<name>.metadata.json`, keine zweite Datei); `List_skips_sidecars_and_reports_attempts`.
- [ ] **Step 2: Tests laufen lassen** → FAIL.
- [ ] **Step 3: Implementieren.** Worker-Ablauf je Bild: `LegacyProcessed || Attempts >= MaxAttempts` → `FailedAnalysisImageHandler.HandleAsync(name)` (leerer `AnalyzedBill` mit Bild für `UserId` des Bildes, Quellbild löschen); sonst wenn `ClaimedUntilUtc > now` → überspringen; sonst `ClaimAsync(name, now + ClaimDuration)` und Nachricht veröffentlichen. Der Message-Handler löscht das Bild bei Erfolg (unverändert). Azure: Metadaten-Schlüssel `attempts`, `claimedUntil`, bestehendes `processedAt` nur noch lesen.
- [ ] **Step 4: Tests grün** + Monolith-Build.
- [ ] **Step 5: Commit(s)** – `feat(shopping): typed analyze result and discard analyzed bill (US-0007)`, `fix(shopping): analysis worker retries with attempt limit (US-0007)`.

## Frontend – Grundlagen

### Task 4: API-Clients und Kontext-Services

**Files:**
- Create: `FE/src/app/api/shopping/dtos/{BillTemplateDto,BillSuggestionDto,ShopStatDto,AnalyzeBillResultDto}.ts`
- Create: `FE/src/app/api/shopping/bill-template-api.service.ts`
- Modify: `FE/src/app/api/shopping/bill-api.service.ts`
- Create: `FE/src/app/features/bill/services/bill-template-context.service.ts`, `shop-stats-context.service.ts`
- Test: `*.spec.ts` neben den Services (HttpTestingController)

**Interfaces:**
- Consumes: Endpoints aus Task 1–3.
- Produces:
  - `BillTemplateApiService`: `list(): Observable<BillTemplateDto[]>`, `create(dto: BillTemplateCreateDto): Observable<BillTemplateDto>`, `update(id: string, dto: BillTemplateCreateDto): Observable<void>`, `delete(id: string): Observable<void>`, `updateOrder(ids: string[]): Observable<void>`, `suggestions(): Observable<BillSuggestionDto[]>`, `hideSuggestion(s: BillSuggestionKey): Observable<void>`; `BillTemplateCreateDto = { name?: string; shopName?: string | null; categoryId: string; subCategoryId?: string | null }`, `BillSuggestionKey = { shopName: string; categoryId: string; subCategoryId?: string | null }`.
  - `BillApiService`: `analyzeBill(file: File): Observable<AnalyzeBillResultDto>`, `deleteAnalyzedBill(id: string): Observable<void>`, `getShopStats(): Observable<ShopStatDto[]>`.
  - `BillTemplateContextService` (root): `templates(): Observable<BillTemplateDto[]>`, `suggestions(): Observable<BillSuggestionDto[]>`, `refresh(): void`, `pin(s: BillSuggestionDto): Promise<BillTemplateDto>` (fester Shop), `hide(s: BillSuggestionKey): Promise<void>`, `reorder(ids: string[]): Promise<void>`, `save(id: string | null, dto: BillTemplateCreateDto): Promise<void>`, `remove(id: string): Promise<void>`. Lädt einmal nach `backendReady`.
  - `ShopStatsContextService` (root): `shopNames(prefix?: string): string[]` (nach Häufigkeit), `frequentShops(categoryId: string, subCategoryId: string | null, max = 5): string[]`, `lastCategoryFor(shopName: string): { categoryId: string; subCategoryId: string | null } | undefined` (nach `lastUsed`), `recordLocal(shopName: string, categoryId: string, subCategoryId: string | null, date: Date): void`.
- [ ] **Step 1: Failing Tests:** URL/Methode/Body je API-Methode; `ShopStatsContextService`: `frequentShops` sortiert nach Count, schneidet bei 5, unterscheidet Unterkategorie (null = alle der Kategorie); `lastCategoryFor` case-insensitive und nach jüngster Nutzung; `recordLocal` erhöht Count/lastUsed ohne Neuladen.
- [ ] **Step 2: FAIL** – `npm test`.
- [ ] **Step 3: Implementieren** (Muster `BillApiService`/`constructVersionedPath`, BehaviorSubject-Kontext wie `BillCategoryContextService`).
- [ ] **Step 4: PASS** – `npm test`, `npx ng build --configuration production`.
- [ ] **Step 5: Commit** – `feat(miniclient): template, suggestion and shop stats api (US-0007)`.

### Task 5: Navigation – Register, Hauptleiste, Tabs, Sidebar, Mehr, FABs, Routen [UI]

**Files:**
- Create: `FE/src/app/core/navigation/nav-areas.ts` (+ `.spec.ts`)
- Create: `FE/src/app/core/navigation/bottom-bar/bottom-bar.component.{ts,html,scss}`, `area-tabs/area-tabs.component.{ts,html,scss}`, `more-page/more-page.component.{ts,html,scss}`
- Modify: `FE/src/app/app.component.{ts,html,scss}`, `FE/src/app/app.routes.ts`, `FE/src/app/features/bill/bill.routes.ts`, `FE/src/app/features/bill-analysis/bill-analysis.routes.ts`
- Modify (bottom-nav entfernen, Tabs einbinden): `FE/src/app/features/{bill,bill-analysis,budgetplan,work,settings}/*.component.{ts,html,scss}`
- Modify (FAB): `FE/src/app/features/budgetplan/modules/fixed-cost/fixed-cost.component.{html,scss}`, `income/income.component.{html,scss}`, `FE/src/app/features/work/modules/person/person.component.{html,ts,scss}`
- Delete: `FE/src/app/features/bill-analysis/modules/add-bill-for-analysis/*` (Route entfernt)
- Modify: `docs/design/DESIGN.md` (Layout → Mobile/Desktop, Komponenten Hauptleiste, Tabs, Dock, Sheet, FAB, Mehr-Seite; Drawer/Bereichsnavigation entfernen) – AC41

**Interfaces:**
- Produces:
  - `interface NavTab { label: string; path: string; badge?: 'analysis' }`, `interface NavArea { id: 'bill' | 'budgetplan' | 'work' | 'more'; label: string; icon: string; path: string; matchPrefixes: string[]; tabs: NavTab[] }`, `const NAV_AREAS: readonly NavArea[]`, `findArea(url: string): NavArea | undefined`, `findTabIndex(area: NavArea, url: string): number` (−1 wenn keine Tab-Seite).
  - Tabs: Rechnungen `/bill/list`, `/bill/analysis`, `/bill/expenses`; Haushalt `/budgetplan/overview`, `/budgetplan/fixedcost`, `/budgetplan/income`; Stunden `/work/person`, `/work/statistics`; Mehr ohne Tabs (`/more`, Prefixe `/more`, `/settings`, `/export`, `/agb`, `/data-protection`, `/user-data`).
  - Routen: Analyse unter Bill-Bereich (`/bill/analysis`, `/bill/analysis/:id`, vor `/bill/:id` registriert); Redirects `/analyzed` und `/analyzed/list` → `/bill/analysis`, `/analyzed/:id` → `/bill/analysis/:id`, `/analyzed/create` → `/bill/list`; `/more` → `MorePageComponent`; `/settings/templates` wird in Task 9 belegt (hier noch nicht verlinken oder Platzhalter-Route vermeiden: Eintrag „Vorlagen“ auf der Mehr-Seite erst in Task 9).
  - `<app-area-tabs>`: Input `area: NavArea`; Analyse-Badge aus `AnalyzedBillContextService` (Anzahl `bills()`), ausgeblendet bei 0; Rolle `tablist`, aktiver Tab `aria-selected`.
  - `<app-bottom-bar>`: 4 Einträge aus `NAV_AREAS`, aktiv per `findArea(url)`; nur < 1024 px.
- [ ] **Step 1: Failing Tests** `nav-areas.spec.ts`: `findArea('/bill/123')` → bill; `findArea('/settings/categories')` → more; `findArea('/budgetplan/fixedcost/create')` → budgetplan; `findTabIndex(bill, '/bill/analysis/5')` → 1; `findTabIndex(bill, '/bill/create')` → −1; `findArea('/analyzed/list')` → undefined (wird ohnehin umgeleitet). Router-Test: Navigation zu `/analyzed/list` endet auf `/bill/analysis`.
- [ ] **Step 2: FAIL** – `npm test`.
- [ ] **Step 3: Implementieren** nach v2 `01-navigation` und `04-shortcut-desktop`: Kopfzeile ohne Menü-Icon; mobiler Drawer entfällt (Sidenav nur Desktop, Inhalt nach Design inkl. Gruppe „Mehr“ und Rechtliches); Tabs 46 px; Hauptleiste 64 px; Mehr-Seite mit Abschnitten und Zeilen 56 px. FAB (Material `mat-fab`, Icon `add`, rechts unten über der Hauptleiste, 16 px Rand, `aria-label` „Fixkosten hinzufügen“ / „Einkommen hinzufügen“ / „Arbeitszeiten hinzufügen“) ersetzt die Aktionsleisten von Fixkosten, Einkommen und Personen; Personen: `person_add`-Button in der Kopfzeile über `action$` (Route-`data` bzw. bestehender Mechanismus, `aria-label` „Person hinzufügen“).
- [ ] **Step 4: PASS** – `npm test`, Produktions-Build ohne neue Warnungen.
- [ ] **Step 5: Sichtprüfung** 390/1440: Rechnungen-Liste, Haushalt Fixkosten (FAB), Stunden Personen (FAB + Kopfzeilen-Icon), Mehr, Desktop-Sidebar; Deep Link + Reload auf `/bill/analysis` und `/budgetplan/income`; Zurück zwischen Tabs. Screenshots nach `ui-testing/task-5/`.
- [ ] **Step 6: Commit(s)** – `feat(miniclient): bottom bar, area tabs and more page (US-0007)`, `docs(design): navigation v2 in DESIGN.md (US-0007)`.

### Task 6: Wischgeste, Slide-Animation, Zurück schließt Overlays, Sheet-Griff [UI]

**Files:**
- Create: `FE/src/app/core/navigation/swipe.ts` (+ `.spec.ts`), `tab-swipe.directive.ts`
- Create: `FE/src/app/core/overlay/overlay-back.service.ts` (+ `.spec.ts`), `sheet.service.ts`, `sheet-drag.directive.ts`
- Modify: `FE/src/app/app.config.ts` (`withViewTransitions`), `FE/src/styles.scss` (View-Transition-CSS), Bereichs-Host-Komponenten aus Task 5 (Direktive am Inhaltscontainer)
- Modify: bestehende `MatDialog`-/Menü-Nutzung zentral anbinden (siehe Step 3)

**Interfaces:**
- Produces:
  - `evaluateSwipe(start: { x: number; y: number }, end: { x: number; y: number }, viewportWidth: number): 'next' | 'prev' | null` – `|dx| > 60`, Winkel zur Waagrechten < 30°, `start.x` nicht in den äußeren 24 px; nach links = `'next'`.
  - `isSwipeExcluded(target: Element | null): boolean` – true, wenn `target` oder ein Vorfahre `input`, `textarea`, `select`, `form`, `mat-form-field`, `mat-chip-listbox`, `mat-chip-set`, `pinch-zoom`, `[data-no-swipe]` ist oder waagrecht scrollbar (`scrollWidth > clientWidth` und `overflow-x` ≠ `visible/hidden`).
  - `appTabSwipe` (Input `appTabSwipe: NavArea`): navigiert zum Nachbar-Tab mit `NavigationBehaviorOptions.info = { tabDirection: 'next' | 'prev' }`.
  - `OverlayBackService` (root): `register(close: () => void): () => void` – pusht History-Eintrag (gleiche URL, `history.state.overlayBack = <id>`); `popstate` mit diesem Marker ruft `close()`; die zurückgegebene Funktion entfernt den Eintrag per `history.back()` nur, wenn er noch oben liegt, und unterdrückt die dadurch ausgelöste `popstate`-Behandlung.
  - `SheetService` (root): `open<T, D = unknown, R = unknown>(component: ComponentType<T>, config?: MatBottomSheetConfig<D>): MatBottomSheetRef<T, R>` – registriert beim `OverlayBackService`, Panel-Klasse `andaha-sheet`.
  - `appSheetDrag` (am Griff): Input `appSheetDrag: MatBottomSheetRef`; Ziehen nach unten verschiebt das Panel per `transform`, Loslassen bei > 80 px oder Geschwindigkeit > 0,5 px/ms → `dismiss()`, sonst zurückfedern.
- [ ] **Step 1: Failing Tests:** `evaluateSwipe` (61 px waagrecht → next/prev; 59 px → null; 45°-Winkel → null; Start x = 10 bzw. viewportWidth − 10 → null); `isSwipeExcluded` (input, Element in `mat-form-field`, Chip-Streifen, scrollbarer Container, `data-no-swipe`, normales `div` → false) – **Review Focus 3**; `OverlayBackService`: popstate mit Marker ruft `close` einmal; programmatisches Schließen ruft `history.back` genau einmal und `close` nicht; danach löst ein weiteres `popstate` ohne Marker kein `close` aus (**Review Focus 4**).
- [ ] **Step 2: FAIL** – `npm test`.
- [ ] **Step 3: Implementieren.** View Transitions laut Context7 (`withViewTransitions({ onViewTransitionCreated })`): Klasse `tab-next`/`tab-prev` an `document.documentElement`, nach `transition.finished` entfernen; ohne `info.tabDirection` oder bei `prefers-reduced-motion: reduce` → `skipTransition()`; Tab-Tipp in `<app-area-tabs>` gibt die Richtung aus dem Index-Vergleich mit. Dialoge: `MatDialog.afterOpened` global abonnieren (in `AppComponent` oder einem `APP_INITIALIZER`) und je Dialog `register(() => ref.close())`, Freigabe bei `afterClosed`. Menüs: Direktive `appMenuBack` an den `matMenuTriggerFor`-Triggern der Shell (Kontomenü) und künftigen Menüs; Bottom Sheets nur über `SheetService`. Bestehende `MatBottomSheet.open`-Aufrufe (per Serena suchen) auf `SheetService` umstellen.
- [ ] **Step 4: PASS** – `npm test`, Build.
- [ ] **Step 5: Sichtprüfung** 390: Wischen zwischen Rechnungen-Tabs (Liste ↔ Analyse ↔ Statistik), kein Auslösen beim Wischen auf dem Filter-Chip-Streifen; bestehendes Sheet (z. B. Stunden) per Griff schließen; Zurück-Taste (`history.back()`) schließt offenes Sheet/Dialog zuerst. Screenshots `ui-testing/task-6/`.
- [ ] **Step 6: Commit** – `feat(miniclient): tab swipe, view transitions and back closes overlays (US-0007)`.

## Frontend – Schnellerfassung und Vorlagen

### Task 7: Reine Logik der Schnellerfassung

**Files:**
- Create in `FE/src/app/features/bill/quick-entry/logic/`: `amount-input.ts`, `tiles.ts`, `duplicate.ts`, `draft-store.ts`, `quick-entry-state.ts` (je mit `.spec.ts`)
- Create: `FE/src/app/shared/utils/haptics.ts` (`vibrate(ms = 30): void`, no-op ohne `navigator.vibrate`)
- Modify: `FE/src/app/shared/snackbar/snackbar-functions.ts` (+ `success-snackbar/`-Komponente): `openSuccessSnackbar(message: string, snackbar: MatSnackBar): void` – 4 s, ohne Aktion, Häkchen-Icon, `politeness: 'polite'`, Stil nach v2 „Snackbar“.

**Interfaces:**
- Produces:
  - `appendKey(current: string, key: '0'…'9' | ',' | 'del'): string` – max. 2 Nachkommastellen, ein Komma, führende Null bei „,“ → „0,“, keine führenden Nullen („007“ → „7“), max. 7 Vorkommastellen.
  - `parseAmount(text: string): number | null` – akzeptiert „12,5“, „12.5“, „1.234,50“, „1,234.50“ ist ungültig → null; ≤ 0 → null; mehr als 2 Nachkommastellen → null. `formatAmount(value: number): string` → „12,50“.
  - `type QuickTile = { key: string; kind: 'template' | 'suggestion'; templateId?: string; title: string; subtitle: string; categoryId: string; subCategoryId: string | null; shopName: string | null; pinned: boolean; color: string; count?: number }`; `buildTiles(templates: BillTemplateDto[], suggestions: BillSuggestionDto[], categories: BillCategoryDto[], max = 6): QuickTile[]` – Reihenfolge und Abdeckung laut design.md §3; Titel = Name, sonst Shop, sonst Kategoriename; Untertitel „Kategorie · Unterkategorie“ bzw. „Kategorie · Shop wählen“; Kacheln mit unbekannter Kategorie/Unterkategorie entfallen (**Review Focus 2**).
  - `findDuplicate(candidate: { shopName: string; price: number; date: Date; categoryName: string; subCategoryName: string | null }, bills: BillDto[]): BillDto | undefined` – Vergleich laut design.md §3 (Kalendertag lokal, Betrag auf Cent, Namen trim + case-insensitive).
  - `interface QuickEntryDraft { amountText: string; tileKey: string | null; shopName: string | null; categoryId: string | null; subCategoryId: string | null; date: string; savedAt: number }`; `class QuickEntryDraftStore { constructor(storage: Storage, now: () => number); load(userId: string): QuickEntryDraft | null; save(userId: string, draft: Omit<QuickEntryDraft, 'savedAt'>): void; clear(userId: string): void }` – Schlüssel `andaha.quickEntryDraft.<userId>`, älter als 24 h → null und entfernt; `restoreDraft(draft, categories): QuickEntryDraft` entfernt unbekannte Kategorie/Unterkategorie/Kachel und behält Betrag und Datum (**Review Focus 2**).
  - `class QuickEntryState` (Signals): `amountText`, `tile`, `shopName`, `date`, `keypadOpen`; Methoden `pressKey(k)`, `selectTile(t: QuickTile)`, `selectShop(name: string)`, `openKeypad()`; berechnet `amount(): number | null`, `missing(): ('amount' | 'template' | 'shop')[]`, `canSave(): boolean`, `hint(): string` – „Betrag eingeben und Vorlage wählen“, „Betrag eingeben“, „Vorlage wählen“, „Shop wählen“; Tastatur klappt ein, sobald `missing()` leer ist.
- [ ] **Step 1: Failing Tests** – je Funktion die oben genannten Regeln, zusätzlich **Review Focus 1** (`parseAmount('12.5') === 12.5`, `parseAmount('12,50') === 12.5`, `parseAmount('1.234,50') === 1234.5`, `parseAmount('0') === null`, `parseAmount('1,234') === null`); `buildTiles` mit 4 Vorlagen + 5 Vorschlägen → 6 Kacheln, abgedeckter Vorschlag fehlt (fester Shop gleich; Vorlage „Shop wählen“ gleiche Kategorie/Unterkategorie); `findDuplicate` trifft Partner-Rechnung mit anderer Kategorie-ID aber gleichem Namen; trifft nicht bei anderem Tag/Betrag; Draft-Ablauf bei 24 h + 1 ms.
- [ ] **Step 2: FAIL**; **Step 3: Implementieren**; **Step 4: PASS** – `npm test`, Build.
- [ ] **Step 5: Commit** – `feat(miniclient): quick entry logic (US-0007)`.

### Task 8: Schnellerfassung – Dock, Sheet, Tastatur, Kacheln, Speichern [UI]

**Files:**
- Create in `FE/src/app/features/bill/quick-entry/`: `quick-entry-dock/quick-entry-dock.component.*`, `quick-entry-sheet/quick-entry-sheet.component.*` (+ `.spec.ts`), `amount-keypad/amount-keypad.component.*`, `quick-entry.service.ts` (öffnet Sheet mobil bzw. Dialog ab 1024 px)
- Create: `FE/src/app/shared/directives/long-press.directive.ts` (`appLongPress`, Output `longPress`, 500 ms, Abbruch bei > 10 px Bewegung; auch `contextmenu`)
- Modify: `FE/src/app/features/bill/modules/bill-list/bill-list.component.{ts,html,scss}` (Dock einbinden; `?quick=1` öffnet Sheet, entfernt Parameter per `replaceUrl`; Hervorhebung neuer Zeile), `bill-list-item.component.*` (Klasse `is-new`), `FE/src/app/features/bill/services/bill-context.service.ts` (`lastAddedId(): Observable<string | null>` für die Hervorhebung)

**Interfaces:**
- Consumes: Task 4 (`BillTemplateContextService`, `ShopStatsContextService`, `BillApiService.searchBills`), Task 6 (`SheetService`, `appSheetDrag`, `OverlayBackService`), Task 7 (alle Logik), `BillContextService.addBill(dto, category, subCategory)`, `BillCategoryContextService`.
- Produces: `QuickEntryService.open(): void`; `BillCreatePrefill` (in `FE/src/app/features/bill/models/bill-create-prefill.ts`): `{ price?: number; shopName?: string; categoryId?: string; subCategoryId?: string | null; date?: string; notes?: string; image?: File; analyzedBillId?: string; notice?: 'analysis-failed' }` – „Alle Felder“ navigiert `router.navigate(['/bill/create'], { state: { prefill } })`.
- [ ] **Step 1: Failing Tests** (`quick-entry-sheet.component.spec.ts`, Fakes für Services): Speichern gesperrt mit Hinweis bis Betrag + Kachel; Vorlage ohne Shop zeigt Shop-Chips mit häufigstem vorausgewählt; „Andere …“ mit „Als Vorlage merken“ ruft nach `addBill` `save(null, …)` mit festem Shop; Duplikat → Text „Heute schon eingetragen“ und Button „Trotzdem speichern“; **Review Focus 5:** `searchBills` wirft → kein Hinweis, Speichern möglich, `addBill` wird aufgerufen; Entwurf: Schließen ohne Speichern → `save` im Draft-Store, erneutes Öffnen zeigt „Entwurf wiederhergestellt“, „Verwerfen“ leert; nach Speichern: `openSuccessSnackbar('Gespeichert · <Shop> <Betrag> €')`, `vibrate(30)`, Draft gelöscht, Sheet geschlossen.
- [ ] **Step 2: FAIL**.
- [ ] **Step 3: Implementieren** exakt nach v2 `02-schnellerfassung` a–g und README „Schnell-Sheet“, „Zifferntastatur“, „Duplikat-Hinweis“, „Entwurf-Zeile“, „Kontextmenü“: Kacheln als `radiogroup`; langer Druck auf Vorschlag → Menü „Als Vorlage anheften“ / „Nicht mehr vorschlagen“ (AC21; Kontextmenü-Kopf „Vorschlag“ + Kombination); Datumszeile mit Menü Heute · Gestern · Datum wählen (Datepicker); Desktop als `MatDialog` 480 px mit `input inputmode="decimal"` statt Tastatur, Aktionen „Abbrechen | Speichern“. Shop-Autocomplete unter „Andere …“ und „Anderer …“ aus `ShopStatsContextService.shopNames`. Nach Speichern `ShopStatsContextService.recordLocal(...)`.
- [ ] **Step 4: PASS** – `npm test`, Build.
- [ ] **Step 5: Sichtprüfung** 390 gegen `02-schnellerfassung.png` (Zustände a–g, so weit nachstellbar) und 1440 gegen `04-shortcut-desktop.png` (Dialog); Speichern mit echter Rechnung → Zeile hervorgehoben, Snackbar; danach Testrechnung löschen. Screenshots `ui-testing/task-8/`.
- [ ] **Step 6: Commit(s)** – `feat(miniclient): quick entry sheet with templates and suggestions (US-0007)`.

### Task 9: Vorlagen verwalten [UI]

**Files:**
- Create: `FE/src/app/features/settings/modules/templates/templates.routes.ts`, `template-list/template-list.component.*` (+ `.spec.ts`), `template-edit/template-edit.component.*`
- Modify: `FE/src/app/features/settings/settings.routes.ts` (`templates`), `FE/src/app/core/navigation/more-page/more-page.component.html` (Eintrag „Vorlagen“ mit Zähler), Desktop-Sidebar-Gruppe „Mehr“

**Interfaces:**
- Consumes: `BillTemplateContextService` (Task 4), `BillCategoryContextService`, `ConfirmationDialogService`.
- Produces: Routen `/settings/templates`, `/settings/templates/create`, `/settings/templates/:id`.
- [ ] **Step 1: Failing Tests:** Drag & Drop-Ende ruft `reorder` mit neuer ID-Reihenfolge; „Anheften“ ruft `pin`; Bearbeiten mit Segment „Beim Erfassen wählen“ speichert `shopName: null`; Löschen fragt nach und ruft `remove`.
- [ ] **Step 2: FAIL**; **Step 3: Implementieren** nach v2 `03-vorlagen` (Abschnitte „Angeheftet“ mit Griff 36×44 und CDK Drag & Drop wie Kategorien, „Vorschläge“ mit „5×“ und „Anheften“, Aktionsleiste „Vorlage hinzufügen“; Bearbeiten: Name mit Hinweis „Leer lassen = Shopname“, Segment 44 px, Shopname bei fest, Kategorie, Unterkategorie, Löschen icon-only links, Speichern primär); **Step 4: PASS**.
- [ ] **Step 5: Sichtprüfung** 390 gegen `03-vorlagen.png`; Reihenfolge per Griff ändern und zurücksetzen. Screenshots `ui-testing/task-9/`.
- [ ] **Step 6: Commit** – `feat(miniclient): manage bill templates (US-0007)`.

## Frontend – Formular, Scan, Analyse, PWA

### Task 10: Großes Formular und Foto [UI]

**Files:**
- Modify: `FE/src/app/features/bill/modules/add-bill/add-bill.component.{ts,html,scss}` (+ `.spec.ts`), `FE/src/app/features/bill/functions/bill-form-functions.ts`
- Create: `FE/src/app/features/bill/modules/photo-picker/photo-picker.component.*` (Knöpfe „Kamera“ und „Galerie“, zwei versteckte `input type="file" accept="image/*"`, eines mit `capture="environment"`; Ausgabe `photoSelected: File` nach Verkleinerung; Ladezustand)
- Modify: `FE/src/app/shared/utils/image-utils.ts` (+ spec): Standard `compressImage(file, maxEdge = 1600, quality = 0.8)`; Abkürzung nur ohne EXIF-Drehung
- Delete: `FE/src/app/features/bill/modules/add-bill-image-dialog/*` (und Aufrufer per Serena umstellen, z. B. `bill-image.component`)
- Modify: alle Aufrufer von `compressImage` mit eigenen Parametern auf den Standard umstellen (Offline-Cache `bill-cache.service.ts`, Analyse).

**Interfaces:**
- Consumes: `BillCreatePrefill` (Task 8), `ShopStatsContextService` (Task 4), `openSuccessSnackbar`, `vibrate` (Task 7), `parseAmount` (Task 7).
- Produces: `readExifOrientation(file: Blob): Promise<number>` (1 = normal) in `image-utils.ts`; `AddBillComponent` übernimmt `history.state.prefill`; bei `prefill.analyzedBillId` Online-Speichern über `BillApiService.addBill`, danach `deleteAnalyzedBill(id)` und `AnalyzedBillContextService.refresh()`; ohne Netz Fehlersnackbar „Zum Übernehmen wird eine Verbindung gebraucht“; bei `prefill.notice === 'analysis-failed'` Hinweis „Die Rechnung konnte nicht gelesen werden. Bitte die Felder ausfüllen.“
- [ ] **Step 1: Failing Tests:** Preis-Feld ist erstes Feld und fokussiert; „12,5“ ergibt 12,5 im DTO; Shop-Auswahl aus Autocomplete belegt Kategorie/Unterkategorie aus `lastCategoryFor`, aber nicht, wenn schon von Hand gesetzt; Prefill füllt alle Felder inkl. Foto; Übernehmen-Modus: Reihenfolge `addBill` → `deleteAnalyzedBill`, bei Fehler kein `deleteAnalyzedBill`; nach Speichern Snackbar + `vibrate` + Navigation `/bill/list`; `compressImage`: JPEG 1200 px ohne Drehung unverändert, mit Orientation 6 neu kodiert, 3000 px → 1600 px lange Kante.
- [ ] **Step 2: FAIL**; **Step 3: Implementieren** (Datum-Schnellwahl wie im Sheet; `inputmode="decimal"`; Validator Preis > 0 über `parseAmount`); **Step 4: PASS**, Build.
- [ ] **Step 5: Sichtprüfung** 390/1440: Formular, Foto über Galerie (Datei-Upload), Ladezustand, Speichern mit Rückmeldung; Testrechnung löschen. Screenshots `ui-testing/task-10/`.
- [ ] **Step 6: Commit(s)** – `feat(miniclient): bill form with quick date, shop autocomplete and native photo (US-0007)`.

### Task 11: Scan-Ablauf und Analyse-Tab [UI]

**Files:**
- Create: `FE/src/app/features/bill/scan/scan.service.ts` (+ `.spec.ts`), `scan-overlay/scan-overlay.component.*`
- Modify: `quick-entry-dock.component` (Kamera-Knopf → Datei-Auswahl mit `capture` → `ScanService.start`), Desktop-Knopf „Scannen“ neben der Eingabezeile
- Modify: `FE/src/app/features/bill-analysis/modules/analyzed-bill/analyzed-bill-list.component.{ts,html}` (Paginator raus), `AnalyzedBillDataSource.ts`, `analyzed-bill-context.service.ts` (keine Seitenparameter; `remove(id)`)
- Modify: `FE/src/app/features/bill-analysis/modules/analyzed-bill-details/analyzed-bill-details.component.{ts,html,scss}` (Positionen, „Als Rechnung übernehmen“, „Verwerfen“), `analyzed-bill-image/*` (Pinch-Zoom-Dialog der Rechnungen wiederverwenden)
- Modify: `FE/src/app/features/bill/modules/bill-image-dialog/*` (Daten-Typ verallgemeinern: `{ imageUrl$ | blob }` statt `BillDto`)

**Interfaces:**
- Consumes: `BillApiService.analyzeBill/deleteAnalyzedBill/downloadAnalyzedBillImage` (Task 4), `BillCreatePrefill` (Task 8), `compressImage` (Task 10), `ConfirmationDialogService`.
- Produces: `ScanService.start(file: File): Promise<void>` – verkleinert, zeigt `ScanOverlayComponent` (Vollbild, Foto-Vorschau, „Rechnung wird gelesen …“, „Abbrechen“), ruft `analyzeBill` mit `timeout(30_000)`, navigiert zu `/bill/create` mit Prefill (Erfolg: Felder + Foto; Fehler/Timeout: nur Foto + `notice: 'analysis-failed'`; Abbruch: nur Foto, kein Hinweis). `mapAnalyzeResultToPrefill(result: AnalyzeBillResultDto, image: File): BillCreatePrefill` (reine Funktion).
- [ ] **Step 1: Failing Tests:** `mapAnalyzeResultToPrefill` (Datum als ISO-Tag, fehlende Felder bleiben undefined); `ScanService`: Erfolg → Prefill mit Feldern; Fehler → `notice`; Timeout nach 30 s (Fake-Timer) → `notice`; Abbrechen → kein `notice`, Request abbestellt; Analyse-Details: „Verwerfen“ fragt nach, ruft `deleteAnalyzedBill`, entfernt Eintrag, navigiert zu `/bill/analysis`; „Als Rechnung übernehmen“ navigiert mit Prefill inkl. `analyzedBillId` und geladenem Foto.
- [ ] **Step 2: FAIL**; **Step 3: Implementieren** (Badge-Zählung kommt aus derselben Liste, Task 5); **Step 4: PASS**, Build.
- [ ] **Step 5: Sichtprüfung** 390: Scan mit Testbild (Datei-Upload statt Kamera) bis zum vorbefüllten Formular, Abbrechen; Analyse-Details mit Positionen und Zoom; Verwerfen nur an einem Eintrag, der dafür angelegt wurde (z. B. über den vorhandenen Backend-Endpoint `upload-for-analysis` per Testskript), sonst nur bis zur Rückfrage. Screenshots `ui-testing/task-11/`.
- [ ] **Step 6: Commit(s)** – `feat(miniclient): scan flow and analysis take-over/discard (US-0007)`.

### Task 12: App-Shortcut und Share Target [UI]

**Files:**
- Modify: `FE/src/manifest.webmanifest` (`shortcuts`, `share_target`)
- Create: `FE/src/custom-sw.js`; Modify: `FE/angular.json` (Asset `src/custom-sw.js`), `FE/src/app/app.config.ts` (`provideServiceWorker('custom-sw.js', …)`, sonst unverändert)
- Create: `FE/src/app/features/bill/scan/shared-image.ts` (+ `.spec.ts`)
- Modify: `bill-list.component.ts` (`?shared=1` und Start-Prüfung)

**Interfaces:**
- Produces: Manifest `shortcuts: [{ name: "Rechnung eintragen", short_name: "Eintragen", url: "/bill/list?quick=1", icons: [<96-px-Icon aus assets>] }]`; `share_target: { action: "/share-target?ngsw-bypass=true", method: "POST", enctype: "multipart/form-data", params: { files: [{ name: "image", accept: ["image/*"] }] } }`. Service Worker: Cache `share-target`, Schlüssel `/shared-image`, Antwort `Response.redirect('/bill/list?shared=1', 303)`. `takeSharedImage(cacheStorage: CacheStorage = caches): Promise<File | null>` liest und löscht den Eintrag.
- [ ] **Step 1: Failing Tests** `shared-image.spec.ts`: liefert Datei mit Typ und löscht den Eintrag; leerer Cache → null; zweiter Aufruf → null.
- [ ] **Step 2: FAIL**; **Step 3: Implementieren** (custom-sw.js nach angular.dev „Custom service worker scripts“ via Context7: `importScripts('./ngsw-worker.js')` zuerst, eigener Code in IIFE, `event.respondWith` nur für `POST` auf `/share-target`); `BillListComponent`: bei `quick=1` `QuickEntryService.open()`, bei `shared=1` oder vorhandenem Cache-Eintrag `ScanService.start(file)`, Parameter danach per `replaceUrl` entfernen; **Step 4: PASS**, Produktions-Build enthält `custom-sw.js`, `ngsw-worker.js`, `ngsw.json`, Deploy-Tokens unverändert.
- [ ] **Step 5: Prüfung am Produktions-Build** (`npx http-server dist/andaha.web-apps.mini-client -p 4300 -c-1`): Manifest im Browser (Application-Panel bzw. `fetch('/manifest.webmanifest')`) enthält Shortcut und Share Target; SW-Handler per `fetch('/share-target?ngsw-bypass=true', { method: 'POST', body: FormData })` im kontrollierten Fenster → Redirect auf `/bill/list?shared=1` und Bild im Cache. Login auf 4300 ist nicht möglich (B2C nur 4200), daher endet der Test an der Weiterleitung; `?quick=1` und `?shared=1` am Dev-Server auf 4200 prüfen (Bild dort manuell in den Cache legen). Ergebnis und Grenzen in design.md „Abweichungen“ festhalten. Screenshots `ui-testing/task-12/`.
- [ ] **Step 6: Commit** – `feat(miniclient): app shortcut and share target (US-0007)`.
