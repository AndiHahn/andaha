# US-0008 Übrige Verbesserungen aus dem Review – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Liste, Statistik, Haushalt, Stunden, Einstellungen, Verbindungen, Export, Datenschutz und allgemeines App-Verhalten der MiniClient-PWA auf den Stand von US-0007 bringen: Summen, Gruppierung, Vergleich, Rückmeldungen, Rückfragen, Fehler- und Leerzustände. Dazu die nötigen Endpoints in Shopping, BudgetPlan, Work und Collaboration und die Restpunkte aus US-0006/US-0007.

**Architecture:**
- **Backend:** Erweiterungen je Service, alle gehostet im Monolith, nach dem bestehenden Muster: Minimal APIs, MediatR, FluentValidation, EF Core.
  - BudgetPlan und Collaboration bekommen Testprojekte.
- **Frontend:** zuerst gemeinsame Bausteine.
  - Lade-, Fehler- und Leerzustand, Fehler-Interceptor mit Opt-out-Token, Offline-Banner, Teilen-oder-Herunterladen;
  - API-Clients und Context-Services mit Fehlerzustand;
  - danach je Bereich ein UI-Task.
- Reine Logik (Gruppierung, Vergleich, Datum, Vorbelegung, Gesten) liegt in eigenen, getesteten Funktionen.

**Tech Stack:**
- **Frontend:** Angular 22.2 (Standalone, Material 22 M2, CDK), chart.js 4 und ng2-charts 11, angular-oauth2-oidc, ngx-mat-timepicker 21, Vitest im Browser-Modus.
- **Backend:** .NET 10 (Minimal APIs, MediatR, FluentValidation, EF Core SQL Server), xUnit, NSubstitute, SQLite in-memory.

**Spec:** [`design.md`](./design.md) (vom Nutzer freigegeben, binding), [`story.md`](./story.md) (AC1–AC41), UI-Vorlage [`mockups/`](./mockups/) (01–03), Grundlagen `docs/design/DESIGN.md` und `docs/design/v2/`.

## Global Constraints

**Repository und Pfade**
- Branch `feature/us-0008-review-verbesserungen` (existiert, enthält Design und Mockups), ein Merge am Ende, nicht pushen.
- Pfadkürzel:
  - `FE/` = `src/WebApps/MiniClient/Andaha.WebApps.MiniClient`, App-Code `FE/src/app/`
  - `SH/` = `src/Services/Shopping/Andaha.Services.Shopping`, Tests `SHT/` = `…Shopping.Tests`
  - `BP/` = `src/Services/BudgetPlan/Andaha.Services.BudgetPlan`, Tests `BPT/` = `…BudgetPlan.Tests` (neu)
  - `WK/` = `src/Services/Work/Andaha.Services.Work`, Tests `WKT/` = `…Work.Tests`
  - `CO/` = `src/Services/Collaboration/Andaha.Services.Collaboration`, Tests `COT/` = `…Collaboration.Tests` (neu)

**Werkzeuge**
- Code lesen und ändern über Serena MCP (`get_symbols_overview`, `find_symbol`, `find_referencing_symbols`, `replace_symbol_body`, `replace_content`; per ToolSearch laden). Read/Grep/Edit nur für Markdown, Konfiguration und Suche.
- Bibliotheks-APIs per Context7 nachschlagen, nicht aus dem Gedächtnis: Angular/Material/CDK, chart.js/ng2-charts, angular-oauth2-oidc, ngx-mat-timepicker, EF Core (Migrations, Temporal Tables, `DeleteBehavior`), FluentValidation. Web Share API per MDN.

**Backend-Stil**
- Ordner `Requests/<Bereich>/<Name>/V1/{Command|Query}.cs`, `…Handler.cs`, `…Validator.cs`; `IIdentityService.GetUserId()`; Ergebnisse `IResult`/`Results.*`.
- Endpoints über `MediateGet/MediatePost/MediatePut/MediateDelete` mit `.Produces(...)`, in der Endpoint-Gruppe des Bereichs (versioniert wie die Nachbarn).
- Besitzprüfung wie bei den Nachbar-Handlern: Fremdes verhält sich wie nicht vorhanden (404), soweit nicht anders angegeben.
- Monat im Format `"yyyy-MM"`.

**Frontend-Stil**
- Neue Komponenten standalone, Muster der Nachbarn: `inject()`, Signals bzw. bestehende Streams, `changeDetection` wie die Nachbarn, `@if/@for` mit `track`.
- UI-Texte deutsch, exakt wie in design.md und den Mockups.
- Farben, Radien und Abstände nur über Tokens aus `FE/src/themes/_andaha-tokens.scss` bzw. die CSS-Variablen aus `styles.scss`, keine neuen Hex-Werte in Komponenten. Ausnahme ist die Farbpalette in Task 15 (Daten, nicht Stil).
- Zahlen mit der App-Locale formatieren (Tausenderpunkt, Komma, „€“ nachgestellt), über die bestehende Pipe bzw. `formatNumber`.
- Desktop ab `(min-width: 1024px)`: Sheets werden dort Dialoge, wie in US-0007.

**Querschnittsregeln für jeden UI-Task**
- Jede Liste bzw. Seite, die der Task anfasst, nutzt `app-load-state` (Task 7) für Laden, Fehler mit „Erneut versuchen“ und den Leerzustand mit Erklärung (AC34). Das gilt auch für Kategorien (Task 15) und Vorlagen (Task 18).
- Jede Lösch-Aktion hat eine Rückfrage über `ConfirmationDialogService` (AC26).
- Jedes erfolgreiche Löschen ruft `vibrate()` aus `shared/utils/haptics.ts` auf (AC35).
- Der Bericht listet die Lösch-Aktionen, die der Task angefasst hat.

**Gates je Task (soweit betroffen)**
- `cd FE && npm test` grün (Vitest; `npm test` reicht die Flags durch, `-- --run` gibt es nicht);
- `npx ng build --configuration production` ohne neue Warnungen;
- `dotnet build src/Services/Monolith/Andaha.Services.Monolith/Andaha.Services.Monolith.csproj` (ein laufender Monolith auf 8900 sperrt `bin/`: dann `dotnet build` mit `-o` in ein Temp-Verzeichnis oder vorher fragen);
- `dotnet test` des betroffenen Testprojekts grün.

**UI-Tasks und Sichtprüfung**
- UI-Tasks sind mit **[UI]** markiert. Nach dem Review prüft der Controller die eigenen Screens bei 390 × 844 und 1440 × 900 gegen die Mockups, Screenshots nach `docs/stories/US-0008-review-verbesserungen/ui-testing/task-N/`.
- Login über B2C mit dem Testzugang aus dem Dispatch. Zugangsdaten nie in Dateien, Commits, Screenshots oder Berichte.
- Testdaten mit Präfix „ZZ“ anlegen und wieder löschen.

**Server**
- Dev-Server `npx ng serve` (Port 4200 fest, wegen B2C-Redirect).
- Backend `dotnet run --launch-profile Andaha.Services.MonolithApi` in `src/Services/Monolith/Andaha.Services.Monolith` (8900, LocalDB, migriert automatisch).
- Laufende Server wiederverwenden, nur selbst gestartete stoppen. Vor `npm ci` den Dev-Server stoppen (EBUSY).
- Die Shopping-csproj nie mit einer lokalen ProjectReference auf CrossCutting committen.

**Commits und Datenbank**
- Commits klein und konventionell, Betreff mit „(US-0008)“, Trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Nur explizite Pfade stagen.
- Migrationen ohne Datenänderung an bestehenden Zeilen (Ausnahme: keine). Migrationen mit dem Service-Projekt als Startprojekt erzeugen, wie in US-0007.

## Review Focus

1. **Filter ohne Treffer** (z. B. Kategorie und Monat ohne Rechnungen): Erwartet wird
   - die Summe „0 Rechnungen“ und „0,00 €“;
   - der Leerzustand der Liste;
   - keine Monatsköpfe, kein Fehler.

   → Test in Task 1 (`Search_without_matches_returns_zero_sum_and_no_months`) und Task 9 (`groupByMonth([])`).
2. **Arbeitszeit am Monatsersten 00:30 und am Tag der Sommerzeitumstellung:**
   - Der Eintrag landet auf genau dem gewählten Tag.
   - Er zählt in diesem Monat.

   → Tests in Task 13 (`toLocalDateTime`).
3. **„Benutzerdaten löschen“, während ein verbundener Partner Rechnungen in meinen Kategorien hat:**
   - Die Rechnungen des Partners bleiben bestehen.
   - Sie stehen danach in seiner Standardkategorie, ohne Unterkategorie.

   → Test in Task 3 (`DeleteUserData_moves_partner_bills_to_partner_default_category`).
4. **Zahlung so bearbeitet, dass mehr bezahlt als gearbeitet ist:**
   - Der offene Betrag zeigt 0,00 €, nicht negativ.
   - „Zahlung offen“ verschwindet.
   - Der Dialog belegt 0 vor.

   → Test in Task 12 (`openAmount` klemmt bei 0).
5. **Offline eine Rechnung speichern:**
   - Es erscheint nur die bestehende Offline-Meldung aus US-0005/US-0007.
   - Keine zusätzliche Interceptor-Snackbar.

   → Test in Task 7 (Request mit `SKIP_GLOBAL_ERROR`) und Task 8 (`addBill` setzt das Token).

---

## Backend

### Task 1: Shopping – Summen der Suche und Monatsreihe der Ausgaben

**Files:**
- Modify: `SH/Requests/Bill/SearchBills/V1/SearchBillsQueryHandler.cs`, `SearchBillsQuery.cs` (Rückgabetyp), Endpoint in `SH/Requests/Bill/*EndpointExtensions.cs`
- Create: `SH/Requests/Bill/Dtos/V1/BillSearchResultDto.cs`, `MonthSumDto.cs`
- Create: `SH/Requests/Expense/GetMonthlyExpenses/V1/{GetMonthlyExpensesQuery,Handler,Validator}.cs`, `SH/Requests/Expense/Dtos/V1/MonthlyCostsDto.cs`; Endpoint in der Expense-Gruppe
- Test: `SHT/Bill/SearchBillsSumTests.cs`, `SHT/Expense/GetMonthlyExpensesTests.cs`

**Interfaces:**
- Produces:
  - `GET api/bill/` liefert `BillSearchResultDto(IReadOnlyCollection<BillDto> Values, int TotalCount, double TotalSum, IReadOnlyCollection<MonthSumDto> MonthSums)` mit `MonthSumDto(string Month, double Sum)`.
    - Die Felder `values` und `totalCount` bleiben JSON-kompatibel zum bisherigen `PagedResultDto`.
    - `MonthSums` deckt alle Monate der Treffer ab (nicht nur die Seite), absteigend sortiert.
    - Die Summen nutzen dieselben Filter wie die Liste (eigene und verbundene Benutzer, Suche, Kategorie-Namen, Datum). Der Typ der Beträge folgt `Bill.Price`.
  - `GET api/expense/monthly?until=yyyy-MM&months=12` liefert `MonthlyCostsDto(string Month, double Costs)[]`.
    - Aufsteigend sortiert, genau `months` Einträge (fehlende Monate mit 0), der letzte ist `until`.
    - Gleiche Grundlage wie `GetExpenses`: eigene und verbundene Benutzer, nur Kategorien mit `IncludeToStatistics`.
    - Validator: `months` 1–24, `until` im Format `yyyy-MM`.

- [ ] **Step 1: Failing Tests** (Muster der bestehenden Bill-Tests mit `TestDb.CreateShopping()`; Collaboration-Proxy per NSubstitute):
  - `Search_returns_total_sum_and_month_sums_over_all_pages`: 3 Rechnungen Okt (10, 20, 5) und 1 Nov (7), `PageSize` 2. Erwartet:
    - `TotalCount` 4, `TotalSum` 42;
    - `MonthSums` = [("2026-11", 7), ("2026-10", 35)].
  - `Search_sums_respect_category_and_date_filter`.
  - `Search_without_matches_returns_zero_sum_and_no_months`.
  - `Monthly_returns_exact_months_with_zero_gaps`: `until` = "2026-03", `months` = 3, nur Feb hat Kosten. Erwartet [Jan 0, Feb x, Mär 0].
  - `Monthly_excludes_categories_not_in_statistics`.
  - `Monthly_validator_rejects_months_0_and_25`.
- [ ] **Step 2:** `dotnet test src/Services/Shopping/Andaha.Services.Shopping.Tests` → FAIL (Typen fehlen).
- [ ] **Step 3: Implementieren.** Summe und Monatssummen per `GroupBy(Year, Month)` in der Datenbank, vor dem Paging, aus derselben gefilterten Query.
- [ ] **Step 4:** Tests grün, und der Monolith-Build ist grün.
- [ ] **Step 5: Commit** `feat(shopping): search sums, month sums and monthly expenses (US-0008)`.

### Task 2: Shopping – Kategorien: Standard schützen, Rechnungen nie über Kategorien löschen, idempotente Standardkategorien, Besitzprüfung, Export-Filter

**Files:**
- Modify: `SH/Requests/BillCategory/DeleteBillCategory/V1/DeleteBillCategoryCommandHandler.cs`
- Modify: `SH/Requests/BillCategory/ListBillCategories/V1/ListBillCategoriesQueryHandler.cs` (Seed via `ShoppingDbContextSeed.CreateInitialCategories`)
- Modify: `SH/Infrastructure/EntityConfiguration/BillModelBuilder.cs` (`Bill→Category`, `Bill→SubCategory`: `DeleteBehavior.Restrict`), plus Migration `BillCategoryRestrict`
- Modify: `SH/Requests/Bill/CreateBill/V1/*Validator.cs`, `SH/Requests/Bill/UpdateBill/V1/*Validator.cs` (prüfen, ggf. ergänzen)
- Modify: `SH/Requests/Expense/ExportExpenses/V1/ExportExpensesRequest.cs`, `ExportExpensesRequestHandler.cs`
- Create: `SH/Requests/BillCategory/Services/BillCategoryReassignment.cs` (gemeinsame Neuzuordnung für Task 3)
- Test: `SHT/BillCategory/DeleteDefaultCategoryTests.cs`, `SHT/BillCategory/DefaultCategorySeedTests.cs`, `SHT/Bill/BillCategoryOwnershipValidationTests.cs`, `SHT/Expense/ExportCategoryFilterTests.cs`

**Interfaces:**
- Produces:
  - `DELETE api/billcategory/{id}` auf die eigene Standardkategorie liefert `Results.BadRequest`.
  - `Task MoveBillsToOwnersDefaultCategoryAsync(ShoppingDbContext db, IReadOnlyCollection<Guid> categoryIds, CancellationToken ct)` in `BillCategoryReassignment`.
    - Gilt für alle Rechnungen in diesen Kategorien, gleich welchem Benutzer sie gehören.
    - Jede Rechnung bekommt die Standardkategorie ihres Besitzers, `SubCategoryId = null`.
    - Hat der Besitzer keine Standardkategorie, wird sie über den Seed angelegt.
    - Wird in Task 3 wiederverwendet.
  - `ExportExpensesRequest.CategoryFilter` ist `string[]?` `[FromQuery]` (Kategorie-Namen; leer heißt alle).

- [ ] **Step 1: Failing Tests:**
  - `Delete_default_category_returns_bad_request_and_changes_nothing`.
  - `Delete_category_moves_own_bills_to_own_default_and_clears_subcategory`.
  - `Delete_category_moves_partner_bill_to_partner_default`: Die Rechnung von Benutzer B liegt in einer Kategorie von A, A löscht die Kategorie. Erwartet:
    - Die Rechnung existiert weiter.
    - Sie liegt in Bs Standardkategorie.
  - `Never_reassigns_to_the_category_being_deleted`.
  - `List_seeds_defaults_once_when_called_twice_concurrently`: Zwei Handler-Aufrufe auf zwei Kontexten derselben SQLite-Verbindung, nacheinander mit leerem Bestand vor dem zweiten Commit (so gut SQLite es zulässt). Mindestens: Ein zweiter Aufruf nach dem ersten legt nichts mehr an.
  - `Create_bill_rejects_category_of_unconnected_user` und `Update_bill_rejects_category_of_unconnected_user`. Falls schon abgedeckt, ist das im Bericht festzuhalten.
  - `Export_with_category_names_filters_including_connected_users`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
  - Seeding in einer Transaktion: anlegen nur, wenn der Benutzer noch keine Kategorie hat. Kein Unique-Index.
  - Migration erzeugen und prüfen, dass sie nur die FK-Löschregel ändert.
- [ ] **Step 4:** Tests grün, Monolith-Build grün.
- [ ] **Step 5: Commit** `fix(shopping): protect default category, never cascade-delete bills, idempotent seed, export category filter (US-0008)`.

### Task 3: Shopping – ausgeblendete Vorschläge verwalten, Benutzerdaten löschen

**Files:**
- Create: `SH/Requests/BillTemplate/ListHiddenSuggestions/V1/*`, `SH/Requests/BillTemplate/UnhideBillSuggestion/V1/*`, `SH/Requests/BillTemplate/Dtos/V1/HiddenBillSuggestionDto.cs`
- Modify: `SH/Requests/BillTemplate/BillTemplateEndpointExtensions.cs`
- Create: `SH/Requests/UserData/DeleteUserData/V1/{DeleteUserDataCommand,Handler}.cs`, Endpoint-Datei `SH/Requests/UserData/UserDataEndpointExtensions.cs`
- Modify: `SH/ProgramEndpointExtensions.cs`
- Modify: Image-Repositories (Löschen nach Name existiert; für „analysis“ ein Auflisten bzw. Löschen nach Metadaten-`userId` ergänzen, falls nötig)
- Test: `SHT/BillTemplate/HiddenSuggestionTests.cs`, `SHT/UserData/DeleteUserDataTests.cs`

**Interfaces:**
- Consumes: `BillCategoryReassignment.MoveBillsToOwnersDefaultCategoryAsync` (Task 2).
- Produces:
  - `GET api/bill-template/hidden-suggestions` → `HiddenBillSuggestionDto(Guid Id, string ShopName, Guid CategoryId, string CategoryName, Guid? SubCategoryId, string? SubCategoryName)[]`.
  - `DELETE api/bill-template/hidden-suggestions/{id}` → 204, bei fremd oder unbekannt 404.
  - `DELETE api/bill/user-data` → 204, idempotent. Löscht für den angemeldeten Benutzer:
    - Rechnungen mit Positionen und Bildern, inklusive der Blobs in „images“;
    - analysierte Rechnungen samt Blobs;
    - noch nicht verarbeitete Analyse-Uploads mit dieser `userId`;
    - Vorlagen und ausgeblendete Vorschläge;
    - Kategorien und Unterkategorien, nachdem fremde Rechnungen darin per Task 2 verschoben wurden.

- [ ] **Step 1: Failing Tests:**
  - `Hidden_list_returns_only_own_with_names`.
  - `Unhide_removes_own_and_404_for_foreign`.
  - `DeleteUserData_removes_all_own_rows_and_image_blobs`: Die Image-Repositories sind per NSubstitute ersetzt; geprüft wird, dass Löschaufrufe für alle Bildnamen erfolgen.
  - `DeleteUserData_moves_partner_bills_to_partner_default_category`.
  - `DeleteUserData_keeps_other_users_data`.
  - `DeleteUserData_twice_returns_no_content`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.** Reihenfolge:
  1. fremde Rechnungen verschieben;
  2. eigene Rechnungen und Analysen samt Blobs löschen;
  3. Vorlagen und ausgeblendete Vorschläge;
  4. Kategorien.

  Blob-Löschfehler werden protokolliert, aber das Löschen läuft weiter. Ein erneuter Aufruf räumt Reste auf.
- [ ] **Step 4:** Tests grün, Monolith-Build grün.
- [ ] **Step 5: Commit** `feat(shopping): hidden suggestions list/unhide and delete user data (US-0008)`.

### Task 4: BudgetPlan – Lebenserhaltungs-Anteil, Benutzerdaten löschen, Testprojekt

**Files:**
- Create: `src/Services/BudgetPlan/Andaha.Services.BudgetPlan.Tests/` (csproj nach dem Muster von `SHT/`: xunit 2.9.3, NSubstitute 5.3.0, EF Core Sqlite 10.0.1), `TestDb.cs`; Eintrag in `Andaha.sln`
- Create: `BP/Core/BudgetPlanSettings.cs`, `BP/Infrastructure/EntityConfiguration/BudgetPlanSettingsEntityConfiguration.cs`, DbSet in `BP/Infrastructure/BudgetPlanDbContext.cs`, Migration `AddBudgetPlanSettings`
- Create: `BP/Requests/Settings/{GetBudgetPlanSettings,UpdateBudgetPlanSettings}/V1/*`, `BP/Requests/Settings/Dtos/V1/BudgetPlanSettingsDto.cs`, `BP/Requests/Settings/SettingsEndpointExtensions.cs`
- Create: `BP/Requests/UserData/DeleteUserData/V1/*`, Endpoint
- Modify: `BP/ProgramEndpointExtensions.cs`
- Test: `BPT/Settings/BudgetPlanSettingsTests.cs`, `BPT/UserData/DeleteUserDataTests.cs`, `BPT/UserData/DeleteUserDataHistorySqlServerTests.cs`

**Interfaces:**
- Produces:
  - `GET api/budgetplan/settings` → `BudgetPlanSettingsDto(int LivingCostShare)`, Standard 35, wenn nichts gespeichert ist.
  - `PUT api/budgetplan/settings`, Body `UpdateBudgetPlanSettingsCommand(int LivingCostShare)`, 0–100 (sonst 400) → 204. Legt an oder ändert.
  - `DELETE api/budgetplan/user-data` → 204, idempotent. Löscht Fixkosten, Einkommen und Einstellungen des Benutzers sowie deren Zeilen in den History-Tabellen der Temporal Tables.
    - Rohes SQL in einer Transaktion: `SYSTEM_VERSIONING = OFF`, löschen, wieder `ON` mit derselben History-Tabelle.
    - Nur wenn der Provider SQL Server ist.

- [ ] **Step 1: Testprojekt anlegen.**
  - `TestDb.CreateBudgetPlan()`. Wenn `ConfigureTemporalTable` unter SQLite `EnsureCreated` stört, wird das nur im Testkontext umgangen, z. B. mit einem abgeleiteten Kontext oder Provider-Check. Der Produktivcode bleibt unverändert.
  - Aufnahme in `Andaha.sln`.
- [ ] **Step 2: Failing Tests:**
  - `Get_returns_35_when_nothing_saved`.
  - `Put_then_get_returns_saved_value`.
  - `Put_is_per_user`.
  - `Put_rejects_101_and_minus_1`.
  - `DeleteUserData_removes_own_fixed_costs_incomes_settings_and_keeps_others`.
  - `DeleteUserData_twice_returns_no_content`.
  - `DeleteUserData_purges_history` gegen LocalDB (`(localdb)\MSSQLLocalDB`, eigene Wegwerf-Datenbank), wie die Azurite-Tests in Shopping übersprungen (`Skip`), wenn LocalDB nicht erreichbar ist.
- [ ] **Step 3:** `dotnet test src/Services/BudgetPlan/Andaha.Services.BudgetPlan.Tests` → FAIL.
- [ ] **Step 4: Implementieren.** Migration mit `BP` als Startprojekt erzeugen.
- [ ] **Step 5:** Tests grün (der LocalDB-Test läuft lokal), Monolith-Build grün.
- [ ] **Step 6: Commit** `feat(budgetplan): living cost share setting and delete user data incl. history (US-0008)`.

### Task 5: Work – Zahlungen ändern/löschen, Plausibilität, Einträge monatsweise, Statistik mit Personenfilter und Monatsreihe, Benutzerdaten löschen

**Files:**
- Modify: `WK/Core/Payment.cs` (`Update`), `WK/Core/Person.cs` (`RemovePayment`, `UpdatePayment`), `WK/Core/WorkingEntry.cs` (`Update` prüft Reihenfolge)
- Create: `WK/Requests/Person/UpdatePayment/V1/*`, `WK/Requests/Person/DeletePayment/V1/*`, Endpoints in der Person-Gruppe
- Modify: Validatoren von `CreateWorkingEntry`, `CreateWorkingEntries`, `UpdateWorkingEntry`
- Create: `WK/Requests/WorkingEntry/ListWorkingEntryMonths/V1/*`, `WK/Requests/WorkingEntry/Dtos/V1/WorkingEntryMonthsDto.cs`
- Modify: `WK/Requests/Statistics/GetStatistics/V1/*` (`GetStatisticsParameters.PersonFilter`), `GetFullStatistics/V1/*`, `Extensions/WorkingTimeQueryExtensions.cs`
- Create: `WK/Requests/Statistics/GetMonthlyHours/V1/*`, `WK/Requests/Statistics/Dtos/V1/MonthlyHoursDto.cs`
- Create: `WK/Requests/UserData/DeleteUserData/V1/*`, Endpoint; Modify `WK/ProgramEndpointExtensions.cs`
- Test: `WKT/Person/PaymentTests.cs`, `WKT/WorkingEntry/WorkingEntryValidationTests.cs`, `WKT/WorkingEntry/ListWorkingEntryMonthsTests.cs`, `WKT/Statistics/StatisticsPersonFilterTests.cs`, `WKT/UserData/DeleteUserDataTests.cs`

**Interfaces:**
- **Zahlungen:**
  - `PUT api/person/{personId}/payments/{paymentId}`, Body `UpdatePaymentCommand` mit denselben Feldern und Einheiten wie der bestehende `PayPerson`-Body (bezahlte Stunden, Betrag, Trinkgeld, Notiz) → 204.
  - `DELETE api/person/{personId}/payments/{paymentId}` → 204.
  - Beide liefern 404 für fremde oder unbekannte Personen bzw. Zahlungen.
- **Validierung der Arbeitszeit** bei Anlegen, Bulk und Ändern:
  - `Until > From`, sonst 400 mit Fehler am Feld `Until`.
  - `Break < Until − From`, sonst 400 am Feld `Break`.
  - `WorkingEntry.Update` wirft wie der Konstruktor.
- **Einträge monatsweise:** `GET api/working-entry/{personId}/months?until=yyyy-MM&months=3` → `WorkingEntryMonthsDto(IReadOnlyCollection<WorkingEntryDto> Entries, string? NextUntil)`.
  - `Entries` sind die Einträge der neuesten `months` Monate mit Einträgen, deren Monat ≤ `until` ist (ohne `until`: ab dem neuesten), immer ganze Monate, absteigend nach `From`.
  - `NextUntil` ist der Monat vor dem ältesten gelieferten Monat, wenn es ältere Einträge gibt, sonst `null`.
  - Der Monat zählt nach `From`.
  - Der bisherige `GET api/working-entry/{personId}` bleibt.
- **Statistik:**
  - `GetStatisticsParameters` bekommt `Guid[]? PersonFilter`.
  - `GET api/work-statistics/full?personFilter=…` (wiederholbarer Query-Parameter).
  - `GET api/work-statistics/monthly?until=yyyy-MM&months=12&personFilter=…` → `MonthlyHoursDto(string Month, double Hours)[]`, aufsteigend, genau `months` Einträge.
  - Leerer oder fehlender Filter heißt alle Personen (eigene und verbundene, wie bisher).
- **Benutzerdaten:** `DELETE api/person/user-data` → 204, idempotent. Löscht die Personen des Benutzers samt Arbeitszeiten und Zahlungen.

- [ ] **Step 1: Failing Tests:**
  - Zahlungen:
    - `UpdatePayment_changes_values_and_person_totals`.
    - `DeletePayment_removes_it`.
    - `Payment_endpoints_404_for_foreign_person`.
  - Validierung:
    - `Create_rejects_until_before_from`.
    - `Update_rejects_until_before_from`.
    - `Create_rejects_break_longer_than_duration`.
  - Monatsweise:
    - `Months_returns_three_full_months_and_next_until`: Daten aus 5 Monaten, `months` = 3. Erwartet die neuesten 3 Monate vollständig und `NextUntil` = Monat 4.
    - `Months_with_until_continues_from_there`.
    - `Months_last_page_has_null_next`.
  - Statistik:
    - `Statistics_person_filter_limits_hours_and_money`.
    - `Full_statistics_person_filter`.
    - `Monthly_hours_returns_exact_months_with_zero_gaps`.
  - Benutzerdaten:
    - `DeleteUserData_removes_own_persons_entries_payments_and_keeps_others`.
    - `DeleteUserData_twice_returns_no_content`.
- [ ] **Step 2:** `dotnet test src/Services/Work/Andaha.Services.Work.Tests` → FAIL.
- [ ] **Step 3: Implementieren.**
- [ ] **Step 4:** Tests grün, Monolith-Build grün.
- [ ] **Step 5: Commit** `feat(work): edit/delete payments, entry validation, monthly entries and stats with person filter, delete user data (US-0008)`.

### Task 6: Collaboration – Verbindung trennen, Anfrage zurückziehen, Benutzerdaten löschen, Testprojekt

**Files:**
- Create: `src/Services/Collaboration/Andaha.Services.Collaboration.Tests/` (Muster wie `SHT/`), `TestDb.cs`; Eintrag in `Andaha.sln`
- Create: `CO/Requests/RemoveConnection/V1/*`, `CO/Requests/WithdrawConnectionRequest/V1/*`, `CO/Requests/DeleteUserData/V1/*`
- Modify: `CO/Requests/CollaborationEndpointExtensions.cs`
- Test: `COT/ConnectionTests.cs`, `COT/DeleteUserDataTests.cs`

**Interfaces:**
- `DELETE api/connection/{userId:guid}` → 204.
  - Entfernt alle `Connection`-Zeilen zwischen dem Benutzer und `userId` in beide Richtungen, ebenso die angenommenen `ConnectionRequest`-Zeilen zwischen beiden. Danach ist eine neue Anfrage möglich.
  - Ohne bestehende Verbindung: 404.
  - Im Accept-Handler zuerst prüfen, wie eine Verbindung gespeichert wird, und das Ergebnis im Bericht festhalten.
- `DELETE api/connection/request/{targetUserId:guid}` → 204. Entfernt die eigene offene Anfrage (weder angenommen noch abgelehnt) an `targetUserId`. Sonst 404.
- `DELETE api/connection/user-data` → 204, idempotent. Entfernt alle Verbindungen und Anfragen, in denen der Benutzer vorkommt.

- [ ] **Step 1:** Testprojekt anlegen und in die `.sln` aufnehmen.
- [ ] **Step 2: Failing Tests:**
  - `Remove_connection_deletes_both_directions_and_allows_new_request`.
  - `Remove_unknown_connection_returns_not_found`.
  - `Withdraw_removes_own_pending_request_only`: Eine angenommene oder abgelehnte Anfrage gibt 404, eine fremde Anfrage ebenfalls.
  - `DeleteUserData_removes_everything_involving_user_and_keeps_others`.
  - `DeleteUserData_twice_returns_no_content`.
- [ ] **Step 3:** FAIL.
- [ ] **Step 4: Implementieren.**
- [ ] **Step 5:** Tests grün, Monolith-Build grün.
- [ ] **Step 6: Commit** `feat(collaboration): remove connection, withdraw request, delete user data (US-0008)`.

---

## Frontend

### Task 7: Gemeinsame Bausteine – Ladezustand, Fehler-Interceptor, Offline-Banner, Zoom, Login-Ladebildschirm, Teilen, Tokens, Testlaufzeit [UI]

**Files:**
- Create: `FE/src/app/shared/load-state/load-state.component.{ts,html,scss,spec.ts}`
- Create: `FE/src/app/core/http/skip-global-error.ts`, `FE/src/app/core/http/error.interceptor.ts` (+ spec). Delete: `FE/src/app/core/error-http-interceptor.service.ts`. Modify: `FE/src/app/app.config.ts`
- Create: `FE/src/app/core/online-status.service.ts` (+ spec), `FE/src/app/core/offline-banner/offline-banner.component.{ts,scss}`; Modify: `FE/src/app/app.component.{html,scss,ts}` (Banner, Login-Ladebildschirm)
- Modify: `FE/src/index.html` (Viewport, `oncontextmenu`)
- Modify: `FE/src/app/shared/utils/file-utils.ts` (+ spec)
- Modify: `FE/src/styles.scss`, `FE/src/themes/_andaha-tokens.scss` (fest kodierte M2-Farben als Tokens)
- Modify: Vitest-Konfiguration (`testTimeout` auf 15000)

**Interfaces:**
- Produces:
  - `type LoadState = 'loading' | 'error' | 'empty' | 'ready'`.
  - `LoadStateComponent` (`app-load-state`):
    - `input.required<LoadState>()` als `state`, `input<string>('')` als `emptyText`, `output<void>()` als `retry`.
    - Content-Projektion für `ready`.
    - Fehlertexte: „Laden fehlgeschlagen“, „Die Daten konnten nicht geladen werden.“, Button „Erneut versuchen“.
  - `SKIP_GLOBAL_ERROR = new HttpContextToken<boolean>(() => false)`.
  - `errorInterceptor: HttpInterceptorFn`. Zeigt `openErrorSnackbar` bei
    - Status 0: „Keine Verbindung zum Server“;
    - Status ≥ 500: „Etwas ist schiefgelaufen. Bitte später erneut versuchen.“

    Nicht bei 4xx und nicht mit dem Token. Der Fehler wird immer weitergereicht.
  - `OnlineStatusService.online: Signal<boolean>`.
  - Bannertext: „Keine Verbindung – neue Rechnungen werden später übertragen.“
  - `canShareFiles(): boolean`.
  - `shareOrDownload(blob: Blob, fileName: string, mimeType: string): Promise<'shared' | 'downloaded' | 'cancelled'>`:
    - `navigator.share({ files })`, wenn `canShare({ files: [file] })` true liefert;
    - `AbortError` ergibt `'cancelled'`;
    - andernfalls `downloadFile`.

- [ ] **Step 1: Failing Specs:**
  - Interceptor:
    - `shows offline snackbar on status 0`.
    - `shows generic snackbar on 500`.
    - `stays silent on 404`.
    - `stays silent with SKIP_GLOBAL_ERROR`.
    - `always rethrows`.
  - `OnlineStatusService`:
    - `follows online/offline events`.
  - `LoadStateComponent`:
    - `renders error with retry and emits retry`.
    - `renders empty text`.
    - `projects content when ready`.
  - `shareOrDownload`:
    - `shares when canShare files`.
    - `falls back to download`.
    - `returns cancelled on AbortError`.
- [ ] **Step 2:** `cd FE && npm test` → FAIL.
- [ ] **Step 3: Implementieren.**
  - `withInterceptors([errorInterceptor])`. Context7: Angular `HttpInterceptorFn`, `HttpContextToken`.
  - Viewport `width=device-width, initial-scale=1.0, viewport-fit=cover`, das `oncontextmenu` am `body` entfernen. Danach prüfen, dass der lange Druck auf Kacheln (US-0007) kein Kontextmenü zeigt.
  - Login-Ladebildschirm: zentriert, App-Name „Andaha“, Spinner, Farben aus Tokens. Er ersetzt „Warten auf Login …“.
  - Banner unter dem Seitenkopf, app-weit.
- [ ] **Step 4:** Gates grün, Build ohne neue Warnungen.
- [ ] **Step 5: Commit** `feat(miniclient): load state, error interceptor, offline banner, zoom, login screen, share helper (US-0008)`.

### Task 8: API-Clients und Context-Services – neue Endpoints, Fehlerzustände, einmal laden, Abmelden

**Files:**
- Modify:
  - `FE/src/app/api/shopping/bill-api.service.ts`, `expense-api.service.ts`, `bill-template-api.service.ts` (Name wie vorhanden), DTOs in `api/shopping/dtos/`
  - `FE/src/app/api/budgetplan/*`
  - `FE/src/app/api/work/*` (person, working-entry, statistics)
  - `FE/src/app/api/collaboration/collaboration-api.service.ts`
- Create: `FE/src/app/api/user-data/user-data-api.service.ts`
- Modify:
  - `FE/src/app/features/bill/services/bill-context.service.ts`, `expense-context.service.ts`
  - `FE/src/app/services/bill-category-context.service.ts` (Kategorien beim Start genau einmal laden)
  - `FE/src/app/features/budgetplan/services/{budgetplan,fixed-cost,income}-context.service.ts`
  - `FE/src/app/features/work/services/*`
  - `FE/src/app/services/collaboration-context.service.ts`
- Modify (AC37): `takeUntilDestroyed` in `overview`, `fixed-cost`, `income`, `person`, `add-working-entry`, Stunden-`statistics` und jeder weiteren Komponente mit Root-Stream-Abo ohne Abmeldung. Die Fundstellen kommen in den Bericht.
- Test: Specs neben den Services

**Interfaces:**
- Consumes: die Endpoints und DTOs aus Task 1–6, genau wie in deren Interfaces-Blöcken.
- **Bill-Context:** `BillContextService` bietet `totalSum$: Observable<number>` und `monthSums$: Observable<Map<string, number>>`. Beide werden bei Suche und Refresh mitgeladen.
- **Requests mit `SKIP_GLOBAL_ERROR`:**
  - `addBill`, wegen der Offline-Meldung aus US-0005/US-0007;
  - jeder Aufruf, dessen Aufrufer heute eine eigene, genauere Fehlermeldung zeigt. Die Liste kommt in den Bericht.
- **Fehlerzustand:** Jeder List-Context bekommt `error: Signal<boolean>` (oder `error$`) und `retry()`. Gilt für Fixkosten, Einkommen, Haushaltsplan, Personen, Stunden-Statistik, Ausgaben-Statistik, Verbindungen (3), Kategorien und Vorlagen.
- **Haushaltsplan (AC38):**
  - `BudgetPlanContextService` lädt beim ersten Bedarf genau einmal.
  - Danach lädt er nur nach einer erfolgreichen Server-Antwort von Anlegen, Ändern oder Löschen bei Fixkosten oder Einkommen neu.
- **Neue Client-Methoden** (Namen verbindlich):
  - Ausgaben: `getMonthlyExpenses(until: string, months: number)`.
  - Vorschläge: `listHiddenSuggestions()`, `unhideSuggestion(id)`.
  - Haushalt: `getBudgetPlanSettings()`, `updateBudgetPlanSettings(livingCostShare: number)`.
  - Zahlungen: `updatePayment(personId, paymentId, dto)`, `deletePayment(personId, paymentId)`.
  - Arbeitszeiten: `listWorkingEntryMonths(personId, until?: string, months = 3)`.
  - Stunden-Statistik: `getStatistics(start, end, personFilter?: string[])` (Parameter wird jetzt gesendet), `getFullStatistics(personFilter?)`, `getMonthlyHours(until, months, personFilter?)`.
  - Verbindungen: `removeConnection(userId)`, `withdrawRequest(targetUserId)`.
  - Export: `exportExpenses(start, end, categoryNames?: string[])`.
  - `UserDataApiService.deleteAll(): Observable<void>` ruft nacheinander `DELETE api/bill/user-data`, `api/budgetplan/user-data`, `api/person/user-data` und zuletzt `api/connection/user-data`.

- [ ] **Step 1: Failing Specs:**
  - `budget plan loads once on start and once per successful change`: Zahl der HTTP-Requests über `HttpTestingController`.
  - `budget plan does not reload on optimistic delete before server response`.
  - `bill search exposes totalSum and monthSums`.
  - `categories load once on start`.
  - `addBill sets SKIP_GLOBAL_ERROR`.
  - `statistics api sends personFilter`.
  - `deleteAll calls the four endpoints in order and stops on first error`.
  - Je ein Spec `exposes error and retry reloads` für Fixkosten und Personen. Die übrigen folgen demselben Muster.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(miniclient): api clients and context services for US-0008, error states, single loads (US-0008)`.

### Task 9: Rechnungsliste – Monatsgruppen, Summe, Wischaktionen, Pull-to-Refresh, Duplizieren/Löschen in der Detailseite, Foto-Löschen mit Rückfrage [UI]

**Files:**
- Create: `FE/src/app/shared/utils/month-groups.ts` (+ spec), `FE/src/app/features/bill/modules/bill-list/row-swipe.ts` (+ spec), `row-swipe.directive.ts`, `pull-to-refresh.directive.ts`
- Modify: `FE/src/app/features/bill/modules/bill-list/bill-list.component.{ts,html,scss}`, `bill-list-item/*`, `bill-list-filter/*` (Datumschip)
- Modify: `FE/src/app/features/bill/modules/bill-details/bill-details.component.{ts,html}`
- Modify: `FE/src/app/features/bill/modules/bill-image-dialog/*` (Rückfrage beim Löschen)
- Modify: `FE/src/styles.scss` (`overscroll-behavior`, nur so weit nötig)

**Interfaces:**
- Consumes: `BillContextService.totalSum$`, `monthSums$` (Task 8); `BillCreatePrefill` (US-0007).
- Produces:
  - `groupByMonth<T>(items: T[], dateOf: (item: T) => Date): { month: string; items: T[] }[]`: Monat `yyyy-MM`, lokale Zeit, Reihenfolge wie die Eingabe.
  - `evaluateRowSwipe(dx: number, dy: number, rowWidth: number): 'delete' | 'duplicate' | 'open-delete' | 'open-duplicate' | null`:
    - Winkel unter 30° zur Waagrechten, sonst `null`;
    - unter 24 px `null`;
    - ab 40 % der Breite die Aktion, darunter der Offen-Zustand;
    - links heißt Löschen, rechts Duplizieren.
  - `duplicatePrefill(bill: BillDto, today: Date): BillCreatePrefill`: Preis, Shop, Kategorie, Unterkategorie und Notizen; Datum heute als `YYYY-MM-DD`; kein Foto.
  - Statistik-Filter: Task 10 setzt Kategorie- und Datumsfilter über die bestehenden `BillContextService`-Setter und navigiert zu `/bill/list`. Die Liste zeigt aktive Filter als Chips mit ×, z. B. „November 2026“ oder „01.01.–31.12.2026“.

- [ ] **Step 1: Failing Specs:**
  - `groupByMonth`: leer, ein Monat, Jahreswechsel, Rechnung am Monatsersten 00:30 lokal.
  - `evaluateRowSwipe`: steil heißt `null`; 20 px heißt `null`; −30 % heißt `open-delete`; −45 % heißt `delete`; +45 % heißt `duplicate`.
  - `duplicatePrefill` setzt das Datum auf heute und lässt das Foto weg.
  - Liste: `shows total line "126 Rechnungen" and sum`, `renders month header with backend sum`, `delete via swipe asks confirmation then deletes and vibrates`.
  - Detail: `duplicate navigates to /bill/create with prefill`.
  - Fotodialog: `delete photo asks confirmation`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
  - Zeilen mit `data-no-swipe`, damit `tab-swipe` sie ausschließt.
  - Touch Events, passiv, wie bei `tab-swipe.directive.ts`.
  - Pull-to-Refresh nur bei `scrollTop` 0. Der Indikator ist rund wie in Mockup 01 C und ruft `refreshBills()` auf.
  - Monatsköpfe zusammen mit dem virtuellen Scrollen: Lösung frei wählbar, siehe design §3.1.
  - Ein Leerzustand ohne Treffer zeigt keine Monatsköpfe.
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(miniclient): bill list month groups, totals, row swipe, pull-to-refresh, duplicate (US-0008)`.

### Task 10: Rechnungen-Statistik – Zeitraum mit Pfeilen, Vergleich, Balkendiagramm, Kategoriezeilen [UI]

**Files:**
- Modify: `FE/src/app/features/bill/modules/expenses/timerange-selection/*` (gemeinsam mit der Stunden-Statistik)
- Modify: `FE/src/app/features/bill/modules/expenses/expenses.component.{ts,html,scss}`
- Create: `FE/src/app/features/bill/modules/expenses/functions/compare.ts` (+ spec), `expenses/monthly-bars/monthly-bars.component.ts`, `expenses/category-rows/category-rows.component.{ts,html,scss}`
- Delete: `expenses/chart/*`, `expenses/chart-details-dialog/*` (inklusive Auge zum Ausblenden)

**Interfaces:**
- Consumes: `ExpenseApiService.getMonthlyExpenses` (Task 8), bestehendes `getExpenses`, Filter-Setter von `BillContextService`.
- Produces:
  - `TimerangeSelectionComponent`, Ausgabe unverändert `TimeRange { startDate, endDate, dateType }`.
    - Segment Monat / Jahr / Gesamt (und Benutzerdefiniert, falls heute vorhanden).
    - ‹ › bei Monat und Jahr; an den Grenzen von `availableTimeRange` deaktiviert.
    - Kein `mat-select` mehr, kein Setzen von Formwerten in `ngOnChanges`; das NG0100 ist damit weg.
  - `percentChange(current: number, previous: number): number | null`: gerundet auf ganze %; `previous` 0 ergibt `null` (Anzeige „neu“).
  - `previousRange(range: TimeRange): TimeRange | null`: Monat ergibt den Vormonat, Jahr das Vorjahr, sonst `null`.

- [ ] **Step 1: Failing Specs:**
  - `percentChange`: (112, 100) ergibt 12; (88, 100) ergibt −12; (5, 0) ergibt `null`.
  - `previousRange`: Jänner ergibt den Dezember des Vorjahres.
  - Timerange: `arrows step month`, `next disabled at last available month`, `arrows hidden for total`.
  - Seite: `shows +12 % zum Vormonat`, `bar chart highlights selected month`, `category tap sets filters and navigates to /bill/list`, `expand shows subcategory sums including ohne Unterkategorie`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
  - chart.js Bar-Chart über ng2-charts, mit `provideCharts` wie bisher, API per Context7.
  - Badge: mehr Ausgaben in `--neg`, weniger in `--pos`.
  - Kein Diagramm bei Gesamt und Benutzerdefiniert.
  - Leer-, Fehler- und Ladezustand über `app-load-state`.
- [ ] **Step 4:** Gates grün. In der Konsole kein NG0100 auf der Statistikseite.
- [ ] **Step 5: Commit** `feat(miniclient): expense statistics with month arrows, comparison, bars and category drill-down (US-0008)`.

### Task 11: Haushalt – Lebenserhaltungs-Anteil, Kategorie antippen, Fixkostensummen, Rückmeldung nach Anlegen, Texte [UI]

**Files:**
- Modify: `FE/src/app/features/budgetplan/modules/overview/overview.component.{ts,html,scss}`
- Create: `FE/src/app/features/budgetplan/modules/overview/living-cost-sheet/living-cost-sheet.component.{ts,html,scss}`
- Create: `FE/src/app/features/budgetplan/functions/monthly-value.ts` (+ spec)
- Modify:
  - `FE/src/app/features/budgetplan/modules/fixed-cost/fixed-cost.component.*`, `fixed-cost-list/*`, `create-fixed-cost/*`
  - `FE/src/app/features/budgetplan/modules/income/income.component.*`, `income-list/*`, `create-income/*`, `income-details/*`
  - `FE/src/app/features/budgetplan/budgetplan.routes.ts` bzw. `fixed-cost.routes.ts` (Query-Parameter `category`)

**Interfaces:**
- Consumes: `getBudgetPlanSettings` und `updateBudgetPlanSettings` (Task 8); `SheetService` aus US-0007 (Desktop: Dialog).
- Produces:
  - `monthlyValue(value: number, duration: Duration): number`, mit den Faktoren 1, 3, 6 und 12.
  - Route `/budgetplan/fixedcost?category=<CostCategory-Wert>` filtert die Liste. Darüber steht ein Chip mit ×, der den Filter entfernt.

- [ ] **Step 1: Failing Specs:**
  - `monthlyValue`: (360, QuarterYear) ergibt 120; (240, Year) ergibt 20.
  - Übersicht:
    - `living costs use saved share and show "35 % vom Einkommen"`.
    - `sheet saves share and recalculates`.
    - `category row navigates with category query`.
  - Fixkosten: `section header shows "… € / Monat"`, `row shows monthly value for non-monthly`.
  - Anlegen:
    - `create shows snackbar "Gespeichert · <Name>" and leaves to list`, für Fixkosten und Einkommen.
  - Texte:
    - Einkommen-Formular heißt „Betrag“.
    - Leerzustand „Keine Einkommen.“
    - Die bestehende Löschmeldung „Einkommen konnte nicht gelöscht werden.“ bleibt; wird im Bericht bestätigt.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
  - Das Prozentfeld nimmt ganze Zahlen von 0 bis 100. Hinweis „Entspricht … € im Monat. Standard: 35 %.“
  - Nach dem Anlegen `vibrate()` und `historyTrail.leaveTo(<liste>)`.
  - `app-load-state` auf Übersicht, Fixkosten und Einkommen.
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(miniclient): budget plan living cost share, category drill-down, monthly values, create feedback (US-0008)`.

### Task 12: Stunden – Personenliste, Personenseite, Zahlungen, Arbeitszeitenliste nach Monaten [UI]

**Files:**
- Create: `FE/src/app/features/work/functions/payment-functions.ts` (+ spec)
- Modify:
  - `FE/src/app/features/work/modules/person/person-list/*`, `person-details/*`, `person-payment-dialog/*`
  - `FE/src/app/features/work/functions/payment-form-functions.ts`
  - `FE/src/app/features/work/modules/person/work-entry-list/*`
  - `FE/src/app/features/work/services/working-entries-context.service.ts`

**Interfaces:**
- Consumes: `updatePayment`, `deletePayment`, `listWorkingEntryMonths` (Task 8); `groupByMonth` (Task 9).
- Produces:
  - `openHours(person: PersonDto): number` in Stunden als Dezimalzahl, nie unter 0.
  - `openAmount(person: PersonDto): number`: `openHours × hourlyRate`, auf Cent gerundet, nie unter 0.
  - `paymentPrefill(person: PersonDto): { payedHours: string; payedMoney: number; payedTip: number }` mit `payedHours` im Format `hh:mm` und `payedTip` 0.
  - `PAYED_HOURS_PATTERN = /^\d{1,4}:[0-5]\d$/`.
  - Der Zahlungsdialog bekommt zusätzlich `hourlyRate` und optional `payment` (Bearbeiten).

- [ ] **Step 1: Failing Specs:**
  - `openAmount`: 12:30 h × 15 € ergibt 187,50; bei mehr bezahlten als gearbeiteten Stunden ergibt es 0.
  - `paymentPrefill` ergibt die offenen Stunden, den Betrag und Trinkgeld 0.
  - Pattern: „12:30“ gültig, „12:60“ ungültig, „abc“ ungültig, „0:00“ ungültig (größer als 0).
  - Personenliste: `shows open amount in euro`, `"Zahlung offen" only when openAmount > 0`.
  - Personenseite:
    - `"Arbeitszeit erfassen" navigates with person preselected`.
    - `payment row has no double h`.
    - `edit payment opens dialog with values`.
    - `delete payment asks confirmation`.
  - Liste:
    - `groups by month with hours and euro subtotal`.
    - `"Ältere Monate laden" appends next months`.
    - `after edit/delete entry person totals refresh`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
  - Layout nach Mockup 02 C.
  - Der Monatskopf zeigt „8:30 h · 127,50 €“.
  - Nach Bearbeiten oder Löschen eines Eintrags laden Einträge und `PersonContextService.refetch()`.
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(miniclient): work persons with open amount, payment edit/delete and prefill, monthly entry list (US-0008)`.

### Task 13: Stunden – Arbeitszeit erfassen und bearbeiten: Datum, Plausibilität, letzter Eintrag, vorgewählte Person, deutsche Zeitauswahl [UI]

**Files:**
- Modify: `FE/src/app/features/work/functions/date-time-functions.ts` (+ spec), `working-entry-form-functions.ts`
- Modify: `FE/src/app/features/work/modules/person/add-working-entry/*`, `work-entry-details/work-entry-details-dialog.component.*`
- Modify: `FE/src/app/features/work/modules/person/person-details/person-details.routes.ts` (toten Routen-Provider entfernen)
- Modify: `FE/src/app/shared/date-picker/time-picker-form-field/*` (deutsche Button-Texte, falls die Bibliothek das erlaubt; Context7)

**Interfaces:**
- Consumes: `listWorkingEntryMonths` (Task 8), `StatisticsContextService` (Zeitraum neu laden).
- Produces:
  - `toLocalDateTime(day: Date, time: string): Date`: lokale Bestandteile von `day` plus `HH:mm`, ohne UTC-Getter. Ersetzt beide Kopien von `setFormTime`/`formatDateAsString`.
  - `validateWorkTime(from: Date, until: Date, breakMinutes: number): 'until-not-after-from' | 'break-too-long' | null`.
  - `netWorkingTime(from, until, breakMinutes): number | null` in Minuten; `null` bei ungültig (Anzeige „–“).
  - Route `create-working-entry?person=<id>`.

- [ ] **Step 1: Failing Specs:**
  - `toLocalDateTime(1.11.2026, '00:30')` liegt am 1. November und in Monat 11.
  - Tag der Sommerzeitumstellung (29.03.2026 bzw. 25.10.2026) mit 07:00: lokaler Tag und Uhrzeit bleiben.
  - Monatsletzter 23:30.
  - `validateWorkTime`: Ende vor Beginn, Ende gleich Beginn, Pause zu lang, gültig.
  - `netWorkingTime` ist nie negativ.
  - Erfassen:
    - `preselects person from query`.
    - `"Übernehmen" copies times, break, notes and keeps today`.
    - `row hidden when several persons selected`.
    - `shows "Ende liegt vor dem Beginn" and disables save`.
    - `save error says "Arbeitszeit konnte nicht gespeichert werden."`.
    - `after save the statistics time range refreshes`.
  - Bearbeiten: `edit dialog reads and writes local date`, plus dieselbe Plausibilität.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.** Den letzten Eintrag liefert `listWorkingEntryMonths(personId, undefined, 1)`, der erste Eintrag der Antwort.
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `fix(miniclient): working entry dates in local time, plausibility, copy last entry, preselected person (US-0008)`.

### Task 14: Stunden-Statistik – Personenfilter, Zahlenformat, Diagramm, Leerzustand, kein alter Stand, Export [UI]

**Files:**
- Modify: `FE/src/app/features/work/modules/statistics/statistics.component.{ts,html,scss}`, `FE/src/app/features/work/services/statistics-context.service.ts`
- Delete: `FE/src/app/features/work/modules/statistics/worktime/*`
- Reuse: `monthly-bars.component.ts` (Task 10), `shareOrDownload` (Task 7)

**Interfaces:**
- Consumes: `getStatistics`, `getFullStatistics`, `getMonthlyHours` mit `personFilter` (Task 8); `TimerangeSelectionComponent` (Task 10).
- Produces: `StatisticsContextService.load(range: TimeRange, personIds: string[])`. Leert alte Werte sofort und setzt den Ladezustand.

- [ ] **Step 1: Failing Specs:**
  - `person chips filter statistics`.
  - `amounts formatted with thousands separator`.
  - `clears previous values on range change`.
  - `empty state "Noch keine Arbeitszeiten – erfasse sie unter Personen." with link`.
  - `bars show hours per month`.
  - `export action shares person export`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
  - Chips „Alle“ plus eine pro Person, mit Einfachauswahl.
  - Kopfaktion „Exportieren“ über den `PageTitleService`, wie die Aktionen der Nachbarseiten.
  - Kein Diagramm bei Gesamt und Benutzerdefiniert.
  - Den leeren Platzhalter `<!-- Person filter -->` entfernen.
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(miniclient): work statistics with person filter, chart, empty state and export (US-0008)`.

### Task 15: Kategorien – Farbraster, Standardkategorie, Speichern-Fixes, Rückfrage bei Unterkategorien [UI]

**Files:**
- Modify: `FE/src/app/features/settings/modules/categories/functions/category-functions.ts`, `color-item/*`
- Modify: `FE/src/app/features/settings/modules/categories/category-item-details/*`, `functions/form-functions.ts`
- Create: `FE/src/app/features/settings/modules/categories/color-swatches/color-swatches.component.{ts,html,scss}` (+ spec)

**Interfaces:**
- Produces:
  - `CATEGORY_COLORS: readonly string[]`: 18 Hex-Werte nach Mockup 03 A. Die Werte legt der Implementierer fest; sie müssen auf `--bg` gut unterscheidbar sein.
  - `ColorSwatchesComponent` ist ein `ControlValueAccessor` mit dem Wert als String (Hex oder CSS-Name).
    - Ein Wert, der nicht in `CATEGORY_COLORS` steht, erscheint vorne als gestrichelter Punkt mit dem Hinweis „Gestrichelt: bisherige Farbe „<name>““.
  - Die Doppelbindung `[(ngModel)]` mit `[formControl]` entfällt.

- [ ] **Step 1: Failing Specs:**
  - `swatches select hex value`.
  - `legacy css name stays selected and is shown first`.
  - `default category: delete disabled with explanation`.
  - `after save cancel restores saved state`.
  - `save, add subcategory, save again sends server id (no duplicate)`.
  - `removing a subcategory asks confirmation`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
  - Text unter dem deaktivierten Löschen: „Die Standardkategorie kann nicht gelöscht werden. Rechnungen gelöschter Kategorien landen hier.“
  - Nach dem Speichern `this.category` und die Form aus dem gespeicherten Stand mit Server-IDs neu aufbauen.
  - Löschen der Kategorie: `vibrate()`.
- [ ] **Step 4:** Gates grün, keine Warnung „ngModel mit formControl“ mehr in der Konsole.
- [ ] **Step 5: Commit** `feat(miniclient): category color swatches, default category guard, save fixes (US-0008)`.

### Task 16: Verbindungen – Ladezustand, Rückmeldung, Trennen, Zurückziehen [UI]

**Files:**
- Modify: `FE/src/app/features/settings/modules/connection/connection.component.*`, `incoming-connection-requests/*`, `active-connections/*`, `outgoing-connection-requests/*`, `add-connection-dialog/*`

**Interfaces:**
- Consumes: `removeConnection` und `withdrawRequest` sowie die Fehlerzustände des `CollaborationContextService` (Task 8).

- [ ] **Step 1: Failing Specs:**
  - `accept shows spinner, disables row and shows "Verbindung mit … hergestellt"`.
  - `decline shows "Anfrage abgelehnt"`.
  - `error keeps row and shows error snackbar`.
  - `send request shows "Anfrage an … gesendet"`.
  - `remove asks "Verbindung mit … trennen? …" then reloads bills and budget plan`.
  - `withdraw asks then removes`.
  - Jede der drei Listen hat Lade-, Fehler- und Leerzustand.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.** Layout nach Mockup 03 B. Nach dem Trennen `vibrate()`.
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(miniclient): connections with feedback, remove and withdraw (US-0008)`.

### Task 17: Export und Benutzerdaten löschen [UI]

**Files:**
- Modify: `FE/src/app/features/export/export.component.{ts,html,scss}`, `FE/src/app/features/bill/services/expense-context.service.ts` (`downloadExpenses` mit Zeitraum und Kategorien)
- Modify: `FE/src/app/features/data-protection/user-data/user-data.component.{ts,html,scss}`
- Create: `FE/src/app/features/data-protection/user-data/delete-confirm-dialog/*`

**Interfaces:**
- Consumes:
  - `exportExpenses(start, end, categoryNames?)` und `UserDataApiService.deleteAll()` (Task 8);
  - `shareOrDownload` und `canShareFiles` (Task 7);
  - `AuthService.logout()`.
- Produces: `exportRangePreset(preset: 'this-month' | 'this-year' | 'last-year' | 'all', today: Date, available: TimeRange): { start: Date; end: Date }`.

- [ ] **Step 1: Failing Specs:**
  - `exportRangePreset` für alle vier Werte, mit dem Jahreswechsel.
  - Export:
    - `default "Dieses Jahr"`.
    - `sends selected category names`.
    - `button label "teilen" when canShareFiles else "herunterladen"`.
    - `cancelled share is no error`.
    - `error shows snackbar`.
  - Benutzerdaten:
    - `first confirm lists what is deleted`.
    - `final button enabled only after typing LÖSCHEN`.
    - `success logs out`.
    - `failure shows "Löschen nicht vollständig. Bitte erneut versuchen." and stays logged in`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
  - Layout nach Mockup 03 C/D.
  - Texte der Rückfragen wie in design §6.4 bzw. Mockup 03 D.
  - Während des Löschens Ladezustand und gesperrte Buttons.
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(miniclient): export with range, categories and share; delete user data (US-0008)`.

### Task 18: Restpunkte – Rechnungsdatum, Formularfehler, Schnellerfassung, Desktop-Zurück-Pfeil, ausgeblendete Vorschläge, Zurück nach Neuladen [UI]

**Files:**
- Modify: `FE/src/app/shared/utils/utils.ts` (+ spec), ggf. `SH/Requests/Bill/*` (wenn das Backend die Uhrzeit verschiebt; dann mit Test in `SHT/`)
- Modify: `FE/src/app/features/bill/modules/add-bill/*` (`mat-error`), `FE/src/app/features/settings/modules/templates/template-edit/*` (`mat-error`)
- Modify: `FE/src/app/features/bill/quick-entry/*`: Duplikat-Hinweis mit Uhrzeit; nach „Andere …“ Tastenfeld offen bzw. Fokus im Betrag
- Modify: Seitenkopf bzw. Route-Daten für `/settings/*` (kein Zurück-Pfeil ab 1024 px)
- Modify: `FE/src/app/features/settings/modules/templates/*` (Abschnitt „Ausgeblendet“ mit „Wieder anzeigen“)
- Modify: `FE/src/app/core/auth.service.ts` (+ spec)
- Modify: `docs/stories/US-0007-navigation-schnellerfassung/design.md` §9 (Neuladen-Satz), `docs/design/DESIGN.md` (neue Bausteine: Ladezustand, Offline-Banner, Wischaktionen, Monatsköpfe, Farbraster)

**Interfaces:**
- Consumes: `listHiddenSuggestions` und `unhideSuggestion` (Task 8).

- [ ] **Step 1: Failing Specs:**
  - `bill date picked today at 23:30 local is sent as that local day`. Auch der gespeicherte Tag stimmt; bei Bedarf ein Backend-Test.
  - `big form shows "Pflichtfeld" and "Betrag größer 0"`.
  - `template form shows field errors`.
  - `duplicate hint shows time of existing bill`.
  - `after "Andere …" amount keeps focus / keypad open`.
  - `settings pages have no back arrow at 1440`.
  - `hidden section lists suggestions and "Wieder anzeigen" unhides`.
  - Login:
    - `tryLogin keeps history state when URL has no code`.
    - `tryLogin clears hash only when code present`.

    `preventClearHashAfterLogin` per Context7 (angular-oauth2-oidc) prüfen.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
  - Die Login-Änderung darf Login, Logout und Silent Refresh nicht verändern. Die bestehenden Auth-Specs bleiben grün.
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `fix(miniclient): bill date day, form errors, quick entry polish, settings back arrow, unhide suggestions, history after reload (US-0008)`.

---

## Abschluss (nach Task 18, durch den Controller)

- Whole-Branch-Review nach subagent-driven-development.
- Phase 4: UI-Prüfung bei 390 und 1440 px über alle Bereiche gegen `mockups/` und die ACs (AC41).
- Phase 5: Kostenerfassung.
- Status in `story.md` setzen.
