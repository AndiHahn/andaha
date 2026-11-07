# US-0011 Begründung im Scan-Tab – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jeder Scan unter „Zu prüfen“ zeigt, warum er nicht automatisch als Rechnung angelegt wurde: kurz in der Liste, ausführlich in der Detailansicht.

**Architecture:**
- Die Regeln für das automatische Anlegen wandern mit ihren Schwellen in eine einzige Klasse, `AutoCreationRules`. Sie liefert eine Liste von `NotCreatedReason`.
- Die Analyse entscheidet damit und speichert die Gründe beim Scan, als JSON-Spalte (EF Primitive Collection).
- Für alte Scans (Spalte `NULL`) leitet das Backend die Gründe beim Lesen ab.
- Die API liefert die Codes als Strings. Das Frontend übersetzt sie in Texte.

**Tech Stack:** .NET 10, EF Core 10 (SQL Server, Tests mit SQLite in-memory), xUnit; Angular 22 MiniClient, Vitest über `ng test`.

**Spec:** [design.md](./design.md), Story: [story.md](./story.md)

Abkürzungen: `SH` = `src/Services/Shopping/Andaha.Services.Shopping`, `SHT` = `src/Services/Shopping/Andaha.Services.Shopping.Tests`, `MC` = `src/WebApps/MiniClient/Andaha.WebApps.MiniClient/src/app`.

## Global Constraints

**Fachlich**
- Reihenfolge und Namen der Codes, exakt: `AnalysisFailed, ShopMissing, DateMissing, AmountMissing, LowConfidence, AmountUncertain, CategoryUnclear`.
- Schwellen unverändert und nur in `AutoCreationRules`:
  - `Confidence > 0.75`
  - `TotalAmountConfidence > 0.6`
  - Toleranz Positionssumme ↔ Betrag `<= 5.0`
  - Betrag `> 0`
- Die Entscheidung bleibt gleich (AC6). Angelegt wird genau dann, wenn `Evaluate(...)` leer ist. `IsReasonableResult()` darf nur noch delegieren oder entfallen.
- `AnalysisFailed` steht immer allein. `AmountUncertain` wird nur geprüft, wenn der Betrag vorhanden und > 0 ist.

**Texte** (Kurztext / Satz, exakt)
- `AnalysisFailed`: „Analyse fehlgeschlagen“ / „Das Foto konnte nicht ausgewertet werden. Bitte die Daten selbst eintragen.“
- `ShopMissing`: „Shop fehlt“ / „Der Shop wurde nicht erkannt.“
- `DateMissing`: „Datum fehlt“ / „Das Datum wurde nicht erkannt.“
- `AmountMissing`: „Betrag fehlt“ / „Der Betrag wurde nicht erkannt.“
- `LowConfidence`: „Analyse unsicher“ / „Die Analyse ist sich insgesamt zu unsicher.“
- `AmountUncertain`: „Betrag unsicher“ / „Der Betrag ist unsicher erkannt, und die Positionen ergeben nicht diesen Betrag.“
- `CategoryUnclear`: „Kategorie unklar“ / „Es wurde keine passende Kategorie gefunden.“
- Detail-Titel: „Nicht automatisch angelegt“. Trenner in der Liste: „ · “.

**Technik**
- Bibliotheks-APIs (EF Core Primitive Collections und Value Conversion, Angular, Material) per Context7 nachschlagen, nicht aus dem Gedächtnis.
- Bestehenden Code mit Serena lesen und ändern (`.claude/rules/serena.md`).
- Migration mit dem Shopping-Projekt als Startprojekt. Sie fügt nur eine nullable Spalte hinzu und ändert keine bestehenden Daten.
- Komponenten-CSS-Budget: Warnung ab 2 kB, Fehler ab 4 kB. Farben über CSS-Variablen (`--mut` usw.), kein `@use` der Tokens in Komponenten.

**Gates je Task, je nach Seite**
- Backend:
  - `dotnet test src/Services/Shopping/Andaha.Services.Shopping.Tests/Andaha.Services.Shopping.Tests.csproj` grün
  - `dotnet build src/Services/Monolith/Andaha.Services.Monolith/Andaha.Services.Monolith.csproj`; bei gesperrtem `bin/` mit `-o` in ein Temp-Verzeichnis
- Frontend, im Ordner `src/WebApps/MiniClient/Andaha.WebApps.MiniClient`:
  - `npx ng test --watch=false` grün
  - `npx ng build --configuration production` ohne neue Warnungen (bekannt sind 2× NG8113)

## Review Focus

1. Ein alter Scan (Spalte `NULL`) in `GET analyzed`: kein Fehler, abgeleitete Gründe ohne `DateMissing`. Test in Task 3.
2. Ein Scan aus fehlgeschlagener Analyse (alle Felder `null`): genau `[AnalysisFailed]`, nicht sechs Gründe. Dies gilt gespeichert (Task 2) und abgeleitet (Task 1).
3. Unbekannter Code von einem neueren Backend: ignoriert, keine leere Kurz-Zeile und kein leerer Hinweis. Test in Task 4 und 5.
4. Ein Scan mit vielen Gründen: Die Kurz-Zeile wird abgeschnitten, und die Zeilenhöhe bleibt `pixelHeightPerItem`. Test in Task 5.
5. Grenzwerte: Konfidenz genau 0,75 ergibt `LowConfidence`. `TotalAmountConfidence` genau 0,6 mit einer Summenabweichung von genau 5,0 ergibt **kein** `AmountUncertain`, weil die Toleranz inklusiv ist. Test in Task 1.

---

### Task 1: Regeln und Gründe (Backend, kein UI)

**Files:**
- Create: `SH/Core/NotCreatedReason.cs`, `SH/Core/AutoCreationRules.cs`
- Modify: `SH/Infrastructure/InvoiceAnalysis/Models/InvoiceAnalysisResult.cs` (`IsReasonableResult`, `LineItemSumEqualsTotalAmount` delegieren an die Regeln oder entfallen)
- Test: `SHT/Bill/AutoCreationRulesTests.cs`

**Interfaces:**
- Produces:
  - `public enum NotCreatedReason { AnalysisFailed, ShopMissing, DateMissing, AmountMissing, LowConfidence, AmountUncertain, CategoryUnclear }`
  - `public static IReadOnlyList<NotCreatedReason> AutoCreationRules.Evaluate(string? shopName, DateTime? date, double? totalAmount, double? confidence, double? totalAmountConfidence, double lineItemsSum, bool categoryValid)`. Das Ergebnis ist in Enum-Reihenfolge und enthält nie `AnalysisFailed`.
  - `public static IReadOnlyList<NotCreatedReason> AutoCreationRules.DeriveForLegacy(string? shopName, double? price, double? confidence, double? totalAmountConfidence, double lineItemsSum, bool hasCategory)`. Bei `confidence == null && string.IsNullOrWhiteSpace(shopName) && price == null` liefert sie `[AnalysisFailed]`. Sonst liefert sie dieselben Regeln wie `Evaluate`, aber nie `DateMissing`.

- [ ] **Step 1: Failing tests** in `AutoCreationRulesTests`, je ein `[Fact]` oder `[Theory]`:
  - `All_good_returns_empty`: Shop „Billa“, Datum, Betrag 10, Konfidenz 0,9, TAC 0,9, Summe 10, Kategorie gültig → leer.
  - `Each_missing_field_yields_its_reason`: als Theory, je ein Feld schlecht → genau `[ShopMissing]`, `[DateMissing]`, `[AmountMissing]` (Betrag `null` und Betrag `0`), `[LowConfidence]` (Konfidenz `null`), `[CategoryUnclear]`.
  - `Amount_uncertain_when_sum_off_and_tac_low`: Betrag 10, Summe 20, TAC 0,5 → `[AmountUncertain]`. Mit TAC 0,61 → leer.
  - `Boundaries`:
    - Konfidenz 0,75 → enthält `LowConfidence`.
    - TAC 0,6, Summe 15 bei Betrag 10 (Abweichung genau 5,0) → kein `AmountUncertain`.
    - Summe 15,01 → `AmountUncertain`.
  - `No_amount_uncertain_without_amount`: Betrag `null`, Summe 20, TAC 0 → `[AmountMissing]`, ohne `AmountUncertain`.
  - `Order_follows_enum`: alles schlecht → `[ShopMissing, DateMissing, AmountMissing, LowConfidence, CategoryUnclear]`.
  - `Legacy_failed_analysis_is_only_analysis_failed`: alle Felder `null` → `[AnalysisFailed]`.
  - `Legacy_never_reports_date_missing`: Shop leer, Konfidenz 0,9 → `[ShopMissing]`. Kategorie fehlt → zusätzlich `CategoryUnclear`.
  - `Evaluate_matches_IsReasonableResult`: als Theory über mindestens 6 Kombinationen. `Evaluate(..., categoryValid: true).Count == 0` gleicht `InvoiceAnalysisResult.IsReasonableResult()` (sichert AC6).
- [ ] **Step 2:** `dotnet test` (Shopping) → FAIL (Typen fehlen).
- [ ] **Step 3:** Implementieren. Die Schwellen sind `public const` in `AutoCreationRules`. `InvoiceAnalysisResult.IsReasonableResult()` delegiert mit `categoryValid: true` und der Summe aus `LineItems`.
- [ ] **Step 4:** `dotnet test` (Shopping) → PASS. Auch alle bestehenden Analyse-Tests sind grün.
- [ ] **Step 5:** Commit `feat(shopping): one rule source for auto-creating analysed bills, with reasons (US-0011)`.

### Task 2: Gründe speichern (Backend, kein UI)

**Files:**
- Modify:
  - `SH/Core/AnalyzedBill.cs`: Property und Konstruktor-Parameter
  - `SH/Infrastructure/EntityConfiguration/AnalyzedBillModelBuilder.cs`
  - `SH/Requests/Bill/AnalyzeBill/BillAnalysisProcessor.cs`
  - `SH/BackgroundJobs/FailedAnalysisImageHandler.cs`
- Create: Migration `AnalyzedBillNotCreatedReasons` in `SH/Infrastructure/Migrations/`
- Test: `SHT/BackgroundJobs/ImmediateAnalysisTests.cs`, `SHT/BackgroundJobs/FailedAnalysisImageHandlerTests.cs`

**Interfaces:**
- Consumes: `AutoCreationRules.Evaluate`, `NotCreatedReason` (Task 1).
- Produces:
  - `AnalyzedBill.NotCreatedReasons` (`IReadOnlyList<NotCreatedReason>?`). `null` heißt alter Scan.
  - Neuer optionaler letzter Konstruktor-Parameter `IEnumerable<NotCreatedReason>? notCreatedReasons = null`.
  - Spalte `NotCreatedReasons`, nullable, JSON mit den Enum-Namen als Strings.

- [ ] **Step 1: Failing tests:**
  - `ImmediateAnalysisTests.Immediate_processing_creates_analyzed_bill_when_not_plausible`: zusätzlich prüfen, dass der gespeicherte Scan die erwarteten Gründe in Enum-Reihenfolge hat, gelesen über einen frischen Context. Die Werte richten sich nach dem Fake-Ergebnis des Tests.
  - Neuer Test `Analyzed_bill_stores_category_unclear_when_classification_invalid`: Analyse plausibel, Klassifikation ungültig → `[CategoryUnclear]`.
  - `FailedAnalysisImageHandlerTests.Creates_analyzed_bill_with_empty_fields_and_image_for_owner`: zusätzlich `NotCreatedReasons == [AnalysisFailed]`.
  - Neuer Test `Legacy_row_without_reasons_loads_as_null`: Scan ohne Gründe anlegen, neu laden → `NotCreatedReasons` ist `null`.
- [ ] **Step 2:** `dotnet test` (Shopping) → FAIL.
- [ ] **Step 3:** Implementieren.
  - Die Entity hält ein privates `List<NotCreatedReason>?`-Feld hinter dem `IReadOnlyList`-Property.
  - Im Model-Builder eine Primitive Collection, Elemente als String gespeichert. Die API steht in Context7, EF Core „primitive collections“ und „HasConversion<string>“ für den Elementtyp.
  - Der Processor ruft `Evaluate(..., categoryValid: classificationResult is not null)` auf. Ist das Ergebnis leer, legt er die Rechnung an, sonst den Scan mit diesen Gründen.
  - Der Failed-Handler gibt `[NotCreatedReason.AnalysisFailed]` mit.
  - Migration erzeugen und prüfen: nur `AddColumn` nullable, kein Default, keine Datenänderung.
- [ ] **Step 4:** `dotnet test` (Shopping) → PASS. `dotnet build` (Monolith) ist grün.
- [ ] **Step 5:** Commit `feat(shopping): store why an analysed bill was not created (US-0011)`.

### Task 3: Gründe in der API (Backend, kein UI)

**Files:**
- Modify:
  - `SH/Requests/Bill/Dtos/V1/AnalyzedBillDto.cs`: neues letztes Feld
  - `SH/Requests/Bill/Dtos/V1/AnalyzedBillDtoMapping.cs` und/oder `SH/Requests/Bill/GetAnalyzedBills/V1/GetAnalyzedBillsQueryHandler.cs`
- Test: `SHT/Bill/AnalysisTests.cs`

**Interfaces:**
- Consumes: `AnalyzedBill.NotCreatedReasons`, `AutoCreationRules.DeriveForLegacy` (Tasks 1 und 2).
- Produces: `AnalyzedBillDto.NotCreatedReasons` (`IReadOnlyCollection<string>`, nie `null`), JSON `notCreatedReasons`. Werte sind die Enum-Namen.

- [ ] **Step 1: Failing tests** in `AnalysisTests`:
  - `AnalyzedBills_list_contains_stored_not_created_reasons`: Scan mit `[DateMissing, CategoryUnclear]` → DTO `["DateMissing", "CategoryUnclear"]`.
  - `AnalyzedBills_list_derives_reasons_for_legacy_rows`: Scan ohne Gründe, Shop „Billa“, Betrag 10, Konfidenz 0,5, keine Kategorie → `["LowConfidence", "AmountUncertain", "CategoryUnclear"]`, ohne Positionen und mit TAC 0,5. Ein zweiter Scan mit allen Feldern `null` → `["AnalysisFailed"]`.
  - `AnalyzedBills_list_contains_confidence_and_image_flag` bleibt grün.
- [ ] **Step 2:** `dotnet test` (Shopping) → FAIL.
- [ ] **Step 3:** Implementieren.
  - Die Projektion liest die gespeicherte Liste mit.
  - Nach `ToListAsync` gilt für jedes DTO: gespeicherte Namen, oder bei `null` `DeriveForLegacy` aus Shop, Preis, Konfidenz, TAC, Summe der `TotalPrice` der Positionen und `CategoryId != null`.
  - Bilder nicht mitladen, `ImageAvailable` bleibt `Images.Any()`.
- [ ] **Step 4:** `dotnet test` (Shopping) → PASS. `dotnet build` (Monolith) ist grün.
- [ ] **Step 5:** Commit `feat(shopping): analysed bills list returns not-created reasons (US-0011)`.

### Task 4: DTO und Texte (Frontend, kein UI)

**Files:**
- Modify: `MC/api/shopping/dtos/BillAnalyzedDto.ts`: `notCreatedReasons?: string[]` in `BillAnalyzedDtoBase`, mit JSDoc
- Create: `MC/features/bill-analysis/functions/not-created-reasons.ts`, `MC/features/bill-analysis/functions/not-created-reasons.spec.ts`

**Interfaces:**
- Produces: `export interface NotCreatedReasonText { short: string; sentence: string }` und `export function notCreatedReasonTexts(codes?: string[] | null): NotCreatedReasonText[]`.

- [ ] **Step 1: Failing tests** in `not-created-reasons.spec.ts`:
  - Jeder der 7 Codes ergibt Kurztext und Satz exakt wie in den Global Constraints.
  - `['DateMissing', 'CategoryUnclear']` → Kurztexte `['Datum fehlt', 'Kategorie unklar']`, die Reihenfolge der Eingabe bleibt.
  - `['Foo', 'ShopMissing']` → nur `Shop fehlt`.
  - `undefined`, `null` und `[]` → `[]`.
- [ ] **Step 2:** `npx ng test --watch=false` → FAIL.
- [ ] **Step 3:** Implementieren (Konstante als Map Code → Texte).
- [ ] **Step 4:** `npx ng test --watch=false` → PASS.
- [ ] **Step 5:** Commit `feat(miniclient): texts for not-created scan reasons (US-0011)`.

### Task 5: Liste und Detailansicht **[UI]**

**Files:**
- Modify:
  - `MC/features/bill-analysis/modules/analyzed-bill/analyzed-bill-list-item/analyzed-bill-list-item.component.{ts,html,scss}`
  - `MC/features/bill-analysis/modules/analyzed-bill/analyzed-bill-list.component.ts`: `pixelHeightPerItem` 64 → 80
  - `MC/features/bill-analysis/modules/analyzed-bill-details/analyzed-bill-details.component.{ts,html,scss}`
- Create: `MC/features/bill-analysis/modules/analyzed-bill/analyzed-bill-list-item/analyzed-bill-list-item.component.spec.ts`
- Test: `MC/features/bill-analysis/modules/analyzed-bill-details/analyzed-bill-details.component.spec.ts`

**Interfaces:**
- Consumes: `notCreatedReasonTexts` (Task 4), `BillAnalyzedDto.notCreatedReasons`.

- [ ] **Step 1: Failing tests:**
  - **List-Item-Spec, neu:**
    - Mit `notCreatedReasons: ['DateMissing', 'CategoryUnclear']` gibt es ein Element `.reasons` mit dem Text `Datum fehlt · Kategorie unklar`, sein Icon hat `aria-hidden="true"`.
    - Ohne Gründe, und mit nur `['Foo']`, gibt es kein `.reasons`.
    - Die Zeile `.analyzed-row` ist 80 px hoch (`getBoundingClientRect().height`), mit und ohne Gründe.
    - Mit allen 6 Nicht-Fehler-Gründen bei 390 px Breite ist `.reasons` einzeilig: `scrollWidth > clientWidth`, die Höhe bleibt 80.
  - **Detail-Spec:**
    - Mit Gründen gibt es einen Block `.why` mit dem Titel „Nicht automatisch angelegt“ und einem `li` je Satz in API-Reihenfolge. Er steht im DOM vor dem ersten `.kv`.
    - Ohne Gründe, und mit nur unbekannten Codes, gibt es kein `.why`.
  - **Listen-Spec:** Die bestehenden Tests in `analyzed-bill-list.component.spec.ts` bleiben grün. Wo sie 64 erwarten, gilt jetzt 80.
- [ ] **Step 2:** `npx ng test --watch=false` → FAIL.
- [ ] **Step 3:** Implementieren.
  - **Liste:** dritte Zeile `.reasons` unter `.s`, mit `mat-icon` `info` (klein, `aria-hidden`) und den Kurztexten, verbunden mit „ · “. Sie ist einzeilig, `ellipsis`, Farbe `var(--mut)`, Schrift 12 px. Die Zeilenhöhe 80 px steht in SCSS und Konstante, den SCSS-Kommentar entsprechend anpassen.
  - **Detail:** `.why` als ruhiger Info-Block, z. B. Hintergrund `var(--pri-soft)`, Radius und Innenabstand nach den Nachbarn in der Datei. Er enthält den Titel als Element mit `role="heading" aria-level="2"` und darunter eine `ul` mit den Sätzen.
  - Beide Komponenten berechnen die Texte über `notCreatedReasonTexts`. Die Texte stehen nicht im Template.
  - Das CSS-Budget beachten.
- [ ] **Step 4:** `npx ng test --watch=false` → PASS. `npx ng build --configuration production` hat keine neuen Warnungen.
- [ ] **Step 5:** Commit `feat(miniclient): show why a scan was not created, in list and details (US-0011)`.

## Danach (Controller, nicht Teil der Tasks)

- Whole-Branch-Review.
- UI-Prüfung mit Playwright bei 390 px und 1440 px: Liste mit Gründen, eine lange abgeschnittene Zeile, Detail-Hinweis, Scan ohne Gründe. Vorher die Migration auf die lokale DB anwenden.
- `cost-tracking`, Story auf „In Review“.
