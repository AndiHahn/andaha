# US-0013 Strengere Scan-Regeln, Konfidenzen sichtbar, direkt zu Scans – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Falsch erkannte Beträge (z. B. abgedeckte Cents) werden nicht mehr automatisch angelegt. Die Konfidenzen je Feld sind sichtbar, und ein Foto auf der Rechnungsliste führt direkt zu „Scans“.

**Architecture:**
- Der Analyse-Service liefert zusätzlich Shop- und Datums-Konfidenz, den Rohtext des Betrags und vorzeichenkorrigierte Positionen.
- `AutoCreationRules.Evaluate` bekommt einen Eingabe-Record und die neuen Regeln.
- Scans und automatisch angelegte Rechnungen speichern die neuen Werte, und die API liefert sie.
- Das Frontend zeigt sie an, kennt die neuen Gründe und navigiert nach dem Upload.

**Tech Stack:** .NET 10, EF Core 10 (SQL Server, Tests mit SQLite), Azure.AI.DocumentIntelligence, xUnit/NSubstitute; Angular 22 MiniClient, Vitest über `ng test`.

**Spec:** [design.md](./design.md) (verbindlich inklusive §4a), Story: [story.md](./story.md)

Abkürzungen: `SH` = `src/Services/Shopping/Andaha.Services.Shopping`, `SHT` = `src/Services/Shopping/Andaha.Services.Shopping.Tests`, `MC` = `src/WebApps/MiniClient/Andaha.WebApps.MiniClient/src/app`.

## Global Constraints

- **Schwellen** als `public const` in `AutoCreationRules`, exakt:
  - `MinShopConfidence = 0.75`, `MinDateConfidence = 0.80`
  - `MinDocumentConfidence = 0.75` (strikt größer)
  - `SureTotalAmountConfidence = 0.90`, `MinTotalAmountConfidence = 0.60`
  - `LineItemSumTolerance = 0.10` (inklusive)
  - `MaxDaysInFuture = 1`
  - Vergleiche: `>=` für Shop, Datum und Betrag, `>` für das Dokument (wie bisher). Alle Vergleiche null- und NaN-sicher in der Form `!(x >= t)`.
- **Codes in dieser Reihenfolge** (Namen werden gespeichert, nie umbenennen oder entfernen):
  `AnalysisFailed, ShopMissing, ShopUncertain, DateMissing, DateUncertain, DateInFuture, AmountMissing, AmountIncomplete, AmountUncertain, LowConfidence, CategoryUnclear`.
  Der Doc-Kommentar des Enums wird angepasst: Die Namen sind gespeichert und Teil der API, umsortieren ist erlaubt, umbenennen oder entfernen nicht.
- **Regel „Betrag vollständig“:** Der Rohtext (`InvoiceTotal.Content`) muss eine Zahl mit genau zwei Nachkommastellen enthalten, Regex `\d[.,]\d{2}(?!\d)`. Ist der Rohtext `null` oder leer, ist der Betrag unvollständig.
- **Positionssumme:** Summe der vorzeichenkorrigierten `TotalPrice`, `null` = 0. „Mindestens eine Position“ heißt: mindestens ein `TotalPrice` ungleich `null`.
- **Vorzeichen:** Negativ, wenn der Wert < 0 ist oder der Rohtext (`Content` des Positionsfelds `Amount`) ein `-` oder `−` (U+2212) enthält. Ist der korrigierte `TotalPrice` negativ, wird ein positiver `UnitPrice` derselben Position negativ.
- **Bei neuer Analyse gilt: fehlender Wert = unsicher.** Bei der Ableitung für alte Scans entfallen die Regeln für `ShopUncertain`, `DateUncertain`, `DateInFuture` und `AmountIncomplete`.
- **„Zukunft“:** `date.Date > referenceUtcDate.AddDays(MaxDaysInFuture)`. Das Bezugsdatum kommt aus einem injizierten `TimeProvider` (`TimeProvider.System` registrieren, falls nicht vorhanden).
- **Neue Texte** (Kurztext / Satz, exakt):
  - `ShopUncertain`: „Shop unsicher“ / „Der Shop wurde nicht sicher erkannt.“
  - `DateUncertain`: „Datum unsicher“ / „Das Datum wurde nicht sicher erkannt.“
  - `DateInFuture`: „Datum in der Zukunft“ / „Das erkannte Datum liegt in der Zukunft.“
  - `AmountIncomplete`: „Betrag unvollständig“ / „Beim Betrag fehlen die Cent-Stellen oder sind nicht lesbar.“
  - `AmountUncertain`, neuer Satz: „Der Betrag ist unsicher erkannt, und die Positionen ergeben nicht diesen Betrag (Toleranz 0,10 €).“
- **Neue Spalten** (nullable) auf `AnalyzedBill` und `Bill`: `ShopNameConfidence` (float), `DateConfidence` (float), `TotalAmountText` (varchar(50), längere Werte werden gekürzt). Eine Migration fügt sie hinzu, ohne Default und ohne Datenänderung.
- **Bibliotheks-APIs** per Context7 nachschlagen: Azure.AI.DocumentIntelligence `DocumentField.Content`/`Confidence`, `DocumentIntelligenceModelFactory` für Tests; EF Core; Angular und Material.
- **Code-Arbeit:** Bestehenden Code mit Serena lesen und ändern (`.claude/rules/serena.md`).
- **Restore:** Der private Feed liefert hier 401. Dann eine Scratch-NuGet-Config (nuget.org und `%USERPROFILE%/.nuget/packages`) per `--configfile` nutzen, danach `--no-restore`. Nie Projekt-Referenzen oder die NuGet.Config des Users ändern.
- **Gates:**
  - Backend:
    - `dotnet test src/Services/Shopping/Andaha.Services.Shopping.Tests/Andaha.Services.Shopping.Tests.csproj` grün. Die 7 Azurite-Tests werden ohne laufendes Azurite übersprungen.
    - `dotnet build src/Services/Monolith/Andaha.Services.Monolith/Andaha.Services.Monolith.csproj` mit 0 Fehlern.
  - Frontend (in `src/WebApps/MiniClient/Andaha.WebApps.MiniClient`):
    - `npx ng test --watch=false` grün.
    - `npx ng build --configuration production` mit nur den 2 bekannten NG8113-Warnungen und ohne Budget-Warnung.
    - Komponenten-CSS über Variablen, kein `@use` der Tokens.

## Review Focus

1. **Der Auslöser-Fall:** Betrag 7,00, Rohtext „7,“, Betrags-Konfidenz 0,95, Positionssumme 7,25. Erwartet: nicht anlegen, Gründe enthalten `AmountIncomplete`. Test in Task 2.
2. **Bon mit Rabatt-Zeile `1,00-`:** Positionen 3,50 / 4,75 / `1,00-` ergeben die Summe 7,25. Bei Betrag 7,25 und Konfidenz 0,7 wird angelegt. Test in Tasks 1 und 2.
3. **Grenzwerte:**
   - Toleranz genau 0,10 ist ok, 0,11 nicht.
   - Betrags-Konfidenz genau 0,90 reicht allein, genau 0,60 nur mit passender Summe.
   - Shop genau 0,75 und Datum genau 0,80 sind ok.

   Test in Task 2.
4. **Datum morgen** (UTC heute + 1) ist ok, übermorgen ergibt `DateInFuture`. Test in Task 2.
5. **Offline-Foto auf der Liste:** keine Navigation, nur die Fehlermeldung. Test in Task 4.

---

### Task 1: Analyse-Ergebnis um Konfidenzen, Rohtext und Vorzeichen erweitern (Backend, kein UI)

**Files:**
- Modify:
  - `SH/Infrastructure/InvoiceAnalysis/Models/InvoiceAnalysisResult.cs` (`VendorNameConfidence`, `InvoiceDateConfidence`, `TotalAmountText`)
  - `SH/Infrastructure/InvoiceAnalysis/InvoiceAnalysisService.cs` (`MapInvoice`)
- Create: `SH/Infrastructure/InvoiceAnalysis/AmountSign.cs` mit `static (double? total, double? unit) AmountSign.Apply(double? totalPrice, double? unitPrice, string? amountContent)`
- Test:
  - `SHT/Bill/AmountSignTests.cs`
  - `SHT/Bill/InvoiceMappingTests.cs` (Mapping über `DocumentIntelligenceModelFactory`, falls verfügbar; dazu `MapInvoice` intern statt privat machen, für Tests per `InternalsVisibleTo`, das es bereits gibt)

- [ ] **Step 1: Failing tests:**
  - `AmountSign`:
    - `(1.00, null, "1,00-")` → `(-1.00, null)`
    - `(1.00, 1.00, "-1,00")` → `(-1.00, -1.00)`
    - `(-1.00, 1.00, "−1,00")` → `(-1.00, -1.00)`
    - `(3.50, 3.50, "3,50")` → unverändert
    - `(null, …)` → `null`
  - Mapping, falls die ModelFactory es erlaubt:
    - `VendorName`- und `InvoiceDate`-Konfidenz werden übernommen, der Rohtext des Betrags ist `Content` von `InvoiceTotal`.
    - Die Positionen 3,50 / 4,75 / `1,00-` ergeben die `TotalPrice` 3,50 / 4,75 / -1,00.
- [ ] **Step 2:** `dotnet test` → FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** `dotnet test` → PASS.
- [ ] **Step 5:** Commit `feat(shopping): analysis result carries field confidences, raw total and signed line items (US-0013)`.

### Task 2: Neue Regeln (Backend, kein UI)

**Files:**
- Modify:
  - `SH/Core/NotCreatedReason.cs` (neue Werte und Reihenfolge laut Global Constraints)
  - `SH/Core/AutoCreationRules.cs`
  - `SH/Infrastructure/InvoiceAnalysis/Models/InvoiceAnalysisResult.cs` (`IsReasonableResult` delegiert)
  - `SH/Requests/Bill/AnalyzeBill/BillAnalysisProcessor.cs` (Aufruf, `TimeProvider`)
  - der Aufrufer von `DeriveForLegacy` (`SH/Requests/Bill/GetAnalyzedBills/V1/GetAnalyzedBillsQueryHandler.cs`)
- Test: `SHT/Bill/AutoCreationRulesTests.cs` (anpassen und erweitern), Prozessor-Tests in `SHT/BackgroundJobs/ImmediateAnalysisTests.cs`, soweit betroffen.

**Interfaces (Produces):**
- `public sealed record AutoCreationInput(string? ShopName, double? ShopConfidence, DateTime? Date, double? DateConfidence, double? TotalAmount, double? TotalAmountConfidence, string? TotalAmountText, double? DocumentConfidence, double LineItemsSum, int LineItemsWithPrice, bool CategoryValid)`
- `IReadOnlyList<NotCreatedReason> AutoCreationRules.Evaluate(AutoCreationInput input, DateTime referenceUtcDate)`
- `IReadOnlyList<NotCreatedReason> AutoCreationRules.DeriveForLegacy(...)`: bisherige Parameter plus `int lineItemsWithPrice`. Neue Betragsregel mit 0,10 € Toleranz, ohne die vier Regeln, die bei alten Scans entfallen.

- [ ] **Step 1: Failing tests:**
  - **Positiv:** Alles gut (Shop 0,9, Datum 0,9, Rohtext „7,25“, Betrags-Konfidenz 0,95, Dokument 0,9, Kategorie gültig) ergibt eine leere Liste.
  - **Je Regel einzeln:**
    - Shop-Konfidenz 0,74 → `[ShopUncertain]`, `null` ebenso, 0,75 ok.
    - Datums-Konfidenz 0,79 → `[DateUncertain]`, 0,80 ok.
    - Datum = Bezug + 2 Tage → `[DateInFuture]`, Bezug + 1 ok.
    - Rohtext „7,“, „7“, „7,2“, `null` → `[AmountIncomplete]`. „7,25“, „7.25“, „EUR 7,25“, „7,25 €“ sind ok.
  - **Betragsregel 8:**
    - Konfidenz 0,90 ohne Positionen ist ok.
    - Konfidenz 0,89 mit Summe auf 0,10 genau und ≥ 1 Position ist ok.
    - Konfidenz 0,89 mit einer Abweichung von 0,11 → `[AmountUncertain]`.
    - Konfidenz 0,89 ohne Positionen → `[AmountUncertain]`.
    - Konfidenz 0,60 mit passender Summe ist ok.
    - Konfidenz 0,59 → `[AmountUncertain]`, auch mit passender Summe. `null` ebenso.
  - **Auslöser-Fall** (Review Focus 1) → enthält `AmountIncomplete`.
  - **Rabatt-Fall** (Review Focus 2) → leer.
  - **Reihenfolge:** Alles schlecht ergibt die Codes in der Enum-Reihenfolge. `AmountIncomplete` und `AmountUncertain` dürfen gemeinsam erscheinen.
  - **Gleichwertigkeits-Test:** Er wird auf ein neues unabhängiges Orakel umgestellt, das die Formel aus design.md §2 im Test ausschreibt, über mindestens 12 Kombinationen.
  - **Ableitung bei alten Scans:** Konfidenz 0,5 ohne Positionen → `LowConfidence` + `AmountUncertain`. Nie erscheinen die vier neuen Codes.
  - **Prozessor:** Ein Analyse-Ergebnis mit Rohtext „7,“ landet unter „Zu prüfen“ mit `AmountIncomplete`, nicht als Rechnung. Das Bezugsdatum kommt aus einem `FakeTimeProvider` bzw. einem eigenen Stub.
- [ ] **Step 2:** `dotnet test` → FAIL.
- [ ] **Step 3:** Implementieren. Die Positionssumme kommt aus den vorzeichenkorrigierten Positionen von Task 1, `TimeProvider` wird in DI registriert (falls nicht vorhanden).
- [ ] **Step 4:** `dotnet test` → PASS. `dotnet build` (Monolith) → 0 Fehler.
- [ ] **Step 5:** Commit `feat(shopping): stricter auto-creation rules (US-0013)`.

### Task 3: Speichern und API (Backend, kein UI)

**Files:**
- Modify:
  - `SH/Core/AnalyzedBill.cs`, `SH/Core/Bill.cs` (Properties und Konstruktor-Parameter optional am Ende)
  - die EntityConfiguration beider Entitäten
  - `SH/Requests/Bill/AnalyzeBill/BillAnalysisProcessor.cs` (Werte übergeben)
  - `SH/Requests/Bill/Dtos/V1/AnalyzedBillDto.cs` und Mapping, `SH/Requests/Bill/Dtos/V1/BillDto.cs` und Mapping (`BillDtoMapping.cs`)
- Create: Migration `BillFieldConfidences` (Shopping-Projekt als Startprojekt)
- Test: `SHT/BackgroundJobs/ImmediateAnalysisTests.cs`, `SHT/Bill/AnalysisTests.cs` und ein passender Bill-DTO-Test (z. B. in `SHT/Bill/BillUpdateTests.cs` oder neu `SHT/Bill/BillConfidenceDtoTests.cs`)

**Interfaces (Produces):** JSON-Felder in `AnalyzedBillDto` und `BillDto`. In `BillDto` kommen `confidence` und `totalAmountConfidence` neu dazu, in beiden DTOs `shopNameConfidence`, `dateConfidence`, `totalAmountText`. Alle sind nullable und stehen als neue letzte Parameter bzw. Properties.

- [ ] **Step 1: Failing tests:**
  - Ein automatisch angelegter Scan bzw. eine automatisch angelegte Rechnung speichert die drei neuen Werte. Ein manuell angelegter Bill hat `null`.
  - `GET analyzed` und das Laden einer Rechnung (DTO) liefern die Werte.
  - Ein `TotalAmountText` über 50 Zeichen wird gekürzt.
- [ ] **Step 2:** `dotnet test` → FAIL.
- [ ] **Step 3:** Implementieren und die Migration prüfen: nur 3×2 nullable `AddColumn`, keine Datenänderung.
- [ ] **Step 4:** `dotnet test` → PASS. `dotnet build` (Monolith) → 0 Fehler.
- [ ] **Step 5:** Commit `feat(shopping): store and return field confidences (US-0013)`.

### Task 4: Frontend – DTOs, Gründe, Navigation nach dem Foto **[UI]**

**Files:**
- Modify:
  - `MC/api/shopping/dtos/BillAnalyzedDto.ts`, `MC/api/shopping/dtos/BillDto.ts` (neue optionale Felder)
  - `MC/features/bill-analysis/functions/not-created-reasons.ts` und `.spec.ts` (neue Codes, neuer `AmountUncertain`-Satz)
  - `MC/features/bill-analysis/services/analysis-upload.service.ts`: `uploadAll` liefert `boolean` (true = Upload gestartet) und hat die Option `{ notify?: boolean }` (false = keine Snackbar)
  - `MC/features/bill/modules/bill-list/bill-list.component.ts` (`onScan` und Share-Target: bei `true` nach `/bill/analysis` navigieren und ohne Snackbar)
- Test: zugehörige Specs (`analysis-upload.service.spec.ts`, `bill-list.component.spec.ts`, `not-created-reasons.spec.ts`)

- [ ] **Step 1: Failing tests:**
  - Die neuen Codes ergeben Kurztext und Satz exakt laut Global Constraints, auch der neue `AmountUncertain`-Satz.
  - `uploadAll` liefert online `true`. Offline liefert es `false` und zeigt die Fehler-Snackbar wie heute. Mit `notify: false` erscheint keine Info-Snackbar.
  - `bill-list` `onScan([foto])` online ruft `router.navigateByUrl('/bill/analysis')` (oder das im Projekt übliche `navigate`) auf, offline nicht.
  - Das Share-Target navigiert ebenso.
- [ ] **Step 2:** `npx ng test --watch=false` → FAIL.
- [ ] **Step 3:** Implementieren. Andere Aufrufer von `uploadAll`, etwa die Scan-Seite selbst, behalten ihr Verhalten.
- [ ] **Step 4:** `npx ng test --watch=false` → PASS. `npx ng build --configuration production` → keine neuen Warnungen.
- [ ] **Step 5:** Commit `feat(miniclient): new not-created reasons and jump to Scans after a photo (US-0013)`.

### Task 5: Frontend – Konfidenzen anzeigen **[UI]**

**Files:**
- Modify:
  - `MC/features/bill-analysis/modules/analyzed-bill-details/analyzed-bill-details.component.{ts,html,scss,spec.ts}`: Der Block „Erkennung“ ersetzt die heutige Zeile „Analyse-Konfidenz“.
  - `MC/features/bill/modules/bill-details/bill-details.component.{ts,html,scss,spec.ts}`: eingeklappter Block „Automatisch erkannt“
- Create, optional: eine kleine gemeinsame Präsentationskomponente `MC/features/bill-analysis/modules/confidence-list/confidence-list.component.ts`, die beide Blöcke nutzen (Eingaben: die vier Konfidenzen). Hilfsfunktion `confidencePercent` aus `analyzed-bill-functions.ts` wiederverwenden.

- [ ] **Step 1: Failing tests:**
  - Scan-Detail:
    - Vier Zeilen „Shop“, „Datum“, „Betrag“, „Dokument“ mit Prozentwerten, z. B. 0,876 → „88 %“, fehlende Werte als „–“.
    - Bei `notCreatedReasons` mit `AmountIncomplete` und `totalAmountText` „7,“ wird „erkannt: 7,“ angezeigt, sonst nicht.
    - Die alte Zeile „Analyse-Konfidenz“ ist weg.
  - Rechnungs-Detail:
    - Gibt es Konfidenzen (`confidence` oder `totalAmountConfidence` ungleich `null`), erscheint ein eingeklappter Block „Automatisch erkannt“. Ein Klick klappt ihn auf und zeigt die vier Zeilen.
    - Ohne Konfidenzen erscheint kein Block.
  - Werte unter der jeweiligen Schwelle (Frontend-Konstanten: Shop 75, Datum 80, Betrag 90, Dokument 75) bekommen die Warn-Klasse.
- [ ] **Step 2:** `npx ng test --watch=false` → FAIL.
- [ ] **Step 3:** Implementieren. Das Design folgt `DESIGN.md` (ruhig, Balken wie bisher), das Klappen ist zugänglich (`button` mit `aria-expanded`).
- [ ] **Step 4:** `npx ng test --watch=false` → PASS. `npx ng build --configuration production` → keine neuen Warnungen und kein Budget-Problem.
- [ ] **Step 5:** Commit `feat(miniclient): show field confidences for scans and auto-created bills (US-0013)`.

## Danach (Controller)

- Whole-Branch-Review.
- UI-Prüfung mit Playwright bei 390 px und 1440 px:
  - Scan-Detail mit Block „Erkennung“ und Rohtext-Hinweis.
  - Rechnungs-Detail mit „Automatisch erkannt“.
  - Foto auf der Liste → „Scans“.
  - Die Testdaten kommen per SQL in die lokale Datenbank.
- `cost-tracking`, Story auf „In Review“.
