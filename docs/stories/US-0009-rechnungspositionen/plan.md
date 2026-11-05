# US-0009 Asynchron scannen und Rechnungspositionen – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den synchronen Scan durch einen asynchronen Mehrfach-Scan mit sofortiger Analyse im Backend ersetzen. Der Tab „Analyse“ wird zum Eingang mit „In Arbeit“, „Zu prüfen“ und „Angelegt“. Rechnungspositionen bleiben erhalten und lassen sich anzeigen, bearbeiten und durchsuchen.

**Architecture:**

- **Shopping-Backend:**
  - Der Upload claimt das Bild sofort und stellt es in eine In-Process-Warteschlange. Ein Hosted Service verarbeitet es über einen gemeinsamen Analyse-Dienst (aus `AnalyzeBillMessageHandler` herausgezogen). Der Worker bleibt als Netz.
  - Neue Lese-Endpoints für „In Arbeit“ und „heute angelegt“.
  - Positionen bekommen eine Reihenfolge und Unicode. Sie werden beim Anlegen und Ändern ersetzt und sind durchsuchbar.
- **Frontend:**
  - Ein root `AnalysisUploadService` lädt mit Fortschritt hoch und fragt den Stand ab.
  - Der Analyse-Tab zeigt drei Abschnitte.
  - Positionen gibt es in den Details, im großen Formular und als Treffer in der Liste.

**Tech Stack:**

- **Frontend:** Angular 22.2 (Standalone, Material 22 M2, CDK), Vitest im Browser-Modus.
- **Backend:** .NET 10 (Minimal APIs, MediatR, FluentValidation, EF Core SQL Server), xUnit + NSubstitute + SQLite, Azure Blob Storage bzw. FileSystem-Repository.

**Spec:** [`design.md`](./design.md) (vom Nutzer freigegeben), [`story.md`](./story.md) (AC1–AC18).

## Global Constraints

**Repository und Pfade**
- Branch `feature/us-0009-async-scan-positionen` (existiert), ein Merge am Ende. Nicht pushen.
- Pfadkürzel:
  - `FE/` = `src/WebApps/MiniClient/Andaha.WebApps.MiniClient`, App-Code `FE/src/app/`
  - `SH/` = `src/Services/Shopping/Andaha.Services.Shopping`, Tests `SHT/` = `src/Services/Shopping/Andaha.Services.Shopping.Tests`

**Werkzeuge**
- Code lesen und ändern über Serena MCP (per ToolSearch laden). Neue Dateien per Write. Read/Grep/Edit nur für Markdown, Konfiguration und Suche.
- Bibliotheks-APIs per Context7: Angular HttpClient (`reportProgress`, `HttpEventType`), Material (`mat-progress-bar`), EF Core (Migrationen, `IsUnicode`), `System.Threading.Channels`, Azure.Storage.Blobs (Metadaten).

**Backend-Stil**
- `Requests/<Bereich>/<Name>/V1/{Command|Query}.cs`, `…Handler.cs`, `…Validator.cs`; `IIdentityService.GetUserId()`; `Results.*`.
- Endpoints in der Bill-Gruppe, versioniert wie die Nachbarn.
- Besitzprüfung: Fremdes verhält sich wie nicht vorhanden.
- Validatoren laufen über `HttpResultValidationBehavior` (US-0008 6b).
- Migrationen mit dem Shopping-Projekt als Startprojekt, ohne Datenänderung bestehender Zeilen (nur Spaltentyp oder neue Spalte mit Standardwert).

**Frontend-Stil**
- Standalone, `inject()`, Signals, `takeUntilDestroyed`.
- Texte deutsch, exakt wie in design.md.
- Nur Tokens aus `FE/src/themes/_andaha-tokens.scss` bzw. CSS-Variablen.
- `app-load-state` für Laden, Fehler und Leer; jedes Löschen mit Rückfrage und `vibrate()` (US-0008). Ausnahme: das Entfernen einer Position im Bearbeiten-Modus (design §5.4).

**Gates je Task (soweit betroffen)**
- `cd FE && npm test` grün (kein `-- --run`);
- `npx ng build --configuration production` ohne neue Warnungen (bekannt: 2× NG8113 in den Kategorie-Komponenten);
- `dotnet test src/Services/Shopping/Andaha.Services.Shopping.Tests/Andaha.Services.Shopping.Tests.csproj` grün;
- `dotnet build src/Services/Monolith/Andaha.Services.Monolith/Andaha.Services.Monolith.csproj` (bei gesperrtem `bin/` mit `-o` in ein Temp-Verzeichnis).

**UI-Tasks und Sichtprüfung**
- UI-Tasks sind mit **[UI]** markiert. Nach dem Review prüft der Controller per Browser bei 390 × 844 und 1440 × 900, Screenshots nach `docs/stories/US-0009-rechnungspositionen/ui-testing/task-N/`.
- Login über den B2C-Testzugang aus dem Dispatch, nie in Dateien.
- Testdaten mit Präfix „ZZ“, danach löschen.

**Commits:** klein und konventionell, Betreff mit „(US-0009)“, Trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, nur explizite Pfade.

**Lokal:** Kein Dapr-Sidecar und kein KI-Dienst. Der Analyse-Dienst wird in Tests per NSubstitute ersetzt, im Browser per Playwright-Route gestubbt.

## Review Focus

1. **Fünf Fotos schnell hintereinander, eins davon scheitert beim Upload (Netz):** Die anderen vier laufen weiter. Das fehlgeschlagene zeigt „Upload fehlgeschlagen“ mit „Erneut versuchen“, keine Snackbar-Flut. → Test in Task 5 (`one failed upload does not stop the others`).
2. **Worker-Durchlauf genau während des sofortigen Uploads:** Keine doppelte Rechnung, der Worker überspringt das geclaimte Bild. → Test in Task 2 (`Worker_skips_image_claimed_by_upload`).
3. **Analyse liefert Positionen mit leerer Beschreibung, negativem Preis und Menge 0:** Die Rechnung entsteht trotzdem. Leere Positionen fallen weg, der negative Preis bleibt, Menge 0 wird `null`. → Test in Task 1 (`LineItemSanitizer` Theory) und Task 2 (`Auto_created_bill_keeps_sanitized_line_items_in_order`).
4. **Rechnung bearbeiten, ohne die Positionen anzufassen (älterer Client ohne `lineItems`-Feld):** Die Positionen bleiben unverändert. → Test in Task 1 (`Update_without_lineItems_field_keeps_items`).
5. **Tab offen, App im Hintergrund, 10 Minuten:** Keine Abfragen im Hintergrund. Beim Zurückkommen ein sofortiges Abfragen. → Test in Task 5 (`pauses polling while document hidden and refreshes on visible`).

---

## Backend

### Task 1: Positionen – Reihenfolge, Unicode, Anlegen/Ändern ersetzen, DTO, Detail vs. Liste

**Files:**
- Modify: `SH/Core/BillLineItem.cs`, `SH/Core/AnalyzedBillLineItem.cs` (`Position` int), `SH/Core/Bill.cs` (`ReplaceLineItems(IEnumerable<LineItemData> items)`), `SH/Core/AnalyzedBill.cs` (Positionen mit `Position` anlegen)
- Modify: `SH/Infrastructure/EntityConfiguration/BillLineItemModelBuilder.cs`, `AnalyzedBillLineItemModelBuilder.cs` (`Description` Unicode, max. 200)
- Create: Migration `LineItemPositionAndUnicode`
- Create: `SH/Requests/Bill/LineItems/LineItemData.cs`, `SH/Requests/Bill/LineItems/LineItemSanitizer.cs`, `SH/Requests/Bill/LineItems/LineItemsFormField.cs` (Parsen des JSON-Felds)
- Modify: `SH/Requests/Bill/Dtos/V1/BillLineItemDto.cs`, `BillLineItemDtoMapping.cs`, `BillDtoMapping.cs` (Detail mit, Liste ohne Positionen)
- Modify: `SH/Requests/Bill/CreateBill/V1/*`, `SH/Requests/Bill/UpdateBill/V1/*`, `SH/Requests/Bill/BillEndpointExtensions.cs` (Formularfeld `lineItems`)
- Modify: `SH/Requests/Bill/SearchBills/V1/SearchBillsQueryHandler.cs` (Liste ohne Positionen)
- Test: `SHT/Bill/LineItemTests.cs`, `SHT/Bill/LineItemSanitizerTests.cs`, `SHT/Bill/LineItemValidationPipelineTests.cs`

**Interfaces:**
- Produces:
  - `record LineItemData(string Description, int? Quantity, double? UnitPrice, double? TotalPrice)`.
  - `static IReadOnlyList<LineItemData> LineItemSanitizer.Sanitize(IEnumerable<(string? Description, int? Quantity, double? UnitPrice, double? TotalPrice)> raw)`: trimmt, lässt leere Beschreibungen weg, kürzt auf 200 Zeichen, Menge ≤ 0 wird `null`, Preise unverändert (auch negativ).
  - `Bill.ReplaceLineItems(IEnumerable<LineItemData>)` vergibt `Position` 0..n in Eingabereihenfolge.
  - **Formularfeld `lineItems`:** JSON `[{ description, quantity, unitPrice, totalPrice }]`.
    - `POST`: optional.
    - `PUT`: fehlt das Feld, bleiben die Positionen unverändert; `[]` löscht sie.
    - Ungültiges JSON → 400 (`ValidationProblem` mit Schlüssel `lineItems`).
  - **Validator:** höchstens 200 Positionen; `description` 1–200 nach Trim; `quantity` ≥ 1, wenn gesetzt; Preise beliebig.
  - `BillLineItemDto(Guid Id, string Description, int? Quantity, double? UnitPrice, double? TotalPrice)`, sortiert nach `Position`.
  - **Detail und Liste:**
    - `GET api/bill/{id}` liefert `lineItems`.
    - `GET api/bill/` liefert `lineItems` **nicht** mehr: Das Feld fehlt bzw. ist ein leeres Array; einheitlich leeres Array.

- [ ] **Step 1: Failing Tests:**
  - `LineItemSanitizer`: Theory für leere/Whitespace-Beschreibung (fällt weg), 250 Zeichen (gekürzt auf 200), Menge 0 und −1 (wird `null`), Preis −0,50 (bleibt).
  - `Create_with_lineItems_stores_them_in_order`.
  - `Update_replaces_lineItems`.
  - `Update_without_lineItems_field_keeps_items`.
  - `Update_with_empty_array_removes_items`.
  - `Invalid_lineItems_json_returns_400`.
  - Validator über die Pipeline: 201 Positionen und leere Beschreibung → 400.
  - `Get_by_id_returns_items_ordered`, `Search_list_returns_no_items`.
  - `Partner_can_read_but_not_change_items`: verbundener Benutzer liest per `GET {id}`; Ändern folgt den bestehenden Bill-Regeln.
  - `Deleting_bill_removes_items` und `DeleteUserData_removes_items` (US-0008-Handler).
- [ ] **Step 2:** `dotnet test` (Shopping) → FAIL.
- [ ] **Step 3: Implementieren.** Migration erzeugen und prüfen: nur Spaltentyp und neue Spalte mit Standardwert 0.
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(shopping): ordered unicode line items, replace on create/update, detail-only dto (US-0009)`.

### Task 2: Sofortige Analyse – Claim beim Upload, Warteschlange, Hosted Service, gemeinsamer Analyse-Dienst, SourceUploadId

**Files:**
- Modify: `SH/Infrastructure/ImageRepositories/Analysis/IAnalysisImageRepository.cs` und beide Implementierungen:
  - `UploadImageAsync` bekommt `AnalysisUploadOptions` (`UploadedAtUtc`, `Origin`, `ClaimedUntilUtc`, `Attempts`) und schreibt alles in einem Aufruf;
  - `ReleaseClaimAsync(string name)`;
  - `ImageMetadata` um `UploadedAtUtc` und `Origin` erweitert.
- Modify: `SH/Requests/Bill/UploadForAnalysis/V1/UploadBillForAnalysisCommandHandler.cs`: Antwort `202` mit `{ id }`, Claim 2 min, `Attempts = 1`, `Origin = "app"`, danach in die Warteschlange.
- Create: `SH/BackgroundJobs/AnalysisQueue.cs` (`Channel<string>`-Wrapper, Singleton), `SH/BackgroundJobs/ImmediateAnalysisService.cs` (Hosted Service).
- Create: `SH/Requests/Bill/AnalyzeBill/BillAnalysisProcessor.cs` (gemeinsamer Dienst, aus `AnalyzeBillMessageHandler` herausgezogen). Modify: `AnalyzeBillMessageHandler.cs` (ruft den Processor).
- Modify: `SH/BackgroundJobs/AnalyzeBillWorker.cs` (ruft den Processor direkt statt Pub/Sub; Begründung in den Bericht), `SH/BackgroundJobs/NasBillWorker.cs` (`Origin = "nas"`).
- Modify: `SH/Core/Bill.cs`, `SH/Core/AnalyzedBill.cs` (`SourceUploadId` string?), Migration `SourceUploadId`.
- Modify: `SH/ProgramExtensions.cs` (Registrierung von Queue, Hosted Service, Processor).
- Test: `SHT/BackgroundJobs/ImmediateAnalysisTests.cs`, `SHT/BackgroundJobs/AnalyzeBillWorkerTests.cs` (vorhanden, erweitern)

**Interfaces:**
- Consumes: `LineItemSanitizer`, `Bill.ReplaceLineItems` bzw. `AnalyzedBill`-Positionen mit `Position` (Task 1).
- Produces:
  - `POST api/bill/upload-for-analysis` → 202 `{ id: string }`.
  - `Task BillAnalysisProcessor.ProcessAsync(string imageName, CancellationToken ct)`:
    - analysiert das Bild;
    - legt eine Rechnung (plausibel, `fromAutoAnalysis`) oder ein `AnalyzedBill` an, beide mit `SourceUploadId = imageName` und bereinigten Positionen in Reihenfolge;
    - löscht das Quellbild.
    - Bei Fehler wirft er; der Aufrufer gibt den Claim frei.
  - Der Hosted Service liest die Queue, ruft `ProcessAsync` in eigenem DI-Scope, gibt bei Fehler den Claim frei (`ReleaseClaimAsync`) und erhöht `Attempts`. Die Grenze von 3 Versuchen bleibt (der Worker legt danach den leeren Eintrag an).

- [ ] **Step 1: Failing Tests:**
  - `Upload_returns_id_writes_claim_and_enqueues`: Metadaten `userId`, `uploadedAt`, `origin=app`, Claim etwa +2 min, `Attempts` 1.
  - `Immediate_processing_creates_bill_with_source_upload_id`, mit Analyse-Dienst per NSubstitute (plausibel).
  - `Immediate_processing_creates_analyzed_bill_when_not_plausible`.
  - `Auto_created_bill_keeps_sanitized_line_items_in_order`.
  - `Failure_releases_claim_and_counts_attempt`.
  - `Worker_skips_image_claimed_by_upload`.
  - `Worker_processes_after_claim_released`.
  - `Nas_images_get_origin_nas`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.** Context7: `System.Threading.Channels`, Azure Blob Metadaten.
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(shopping): immediate in-process analysis with claim on upload, source upload id (US-0009)`.

### Task 3: Lese-Endpoints „In Arbeit“ und „heute angelegt“, sync-Analyse entfernen, Suche über Positionen

**Files:**
- Create: `SH/Requests/Bill/GetPendingAnalyses/V1/*`, `SH/Requests/Bill/GetTodayAutoCreatedBills/V1/*` (mit `tz` wie Work in US-0008: IANA, Standard „Europe/Vienna“, unbekannt → 400), DTOs `PendingAnalysisDto`, `AutoCreatedBillDto`
- Modify: `SH/Requests/Bill/Dtos/V1/AnalyzedBillDto.cs` (+ `SourceUploadId`), `SH/Requests/Bill/BillEndpointExtensions.cs`
- Delete: `SH/Requests/Bill/AnalyzeBill/V1/AnalyzeBillCommand*`, synchroner Endpoint `POST api/bill/analyze`, `AnalyzeBillResultDto`, zugehörige Tests (Nachricht und Message-Handler bleiben, falls der Worker sie noch nutzt; sonst ebenfalls entfernen)
- Modify: `SH/Requests/Bill/SearchBills/V1/SearchBillsQueryHandler.cs` (Suche über `LineItems.Any(l => l.Description.Contains(search))`, `MatchedLineItem`), `SH/Requests/Bill/Dtos/V1/BillDto.cs` (+ `MatchedLineItemDto? MatchedLineItem`)
- Test: `SHT/Bill/PendingAndTodayTests.cs`, `SHT/Bill/SearchLineItemsTests.cs`

**Interfaces:**
- Produces:
  - `GET api/bill/analyzed/pending` → `PendingAnalysisDto(string Id, DateTimeOffset UploadedAt, string State)[]`: `State` ist „queued“ oder „analyzing“ (Claim aktiv); nur eigene Bilder, nur `origin=app`; aufsteigend nach `UploadedAt`.
  - `GET api/bill/analyzed/today?tz=…` → `AutoCreatedBillDto(Guid BillId, string? SourceUploadId, string ShopName, double Price, DateTime Date, DateTime CreatedAt)[]`: eigene Rechnungen mit `fromAutoAnalysis`, `CreatedAt` am heutigen lokalen Tag, neueste zuerst.
  - `AnalyzedBillDto` hat zusätzlich `SourceUploadId`.
  - `BillDto.MatchedLineItem: MatchedLineItemDto(string Description, double? TotalPrice)?`: nur bei aktiver Suche und Positions-Treffer, erste passende Position nach `Position`.
  - Summen und Monatssummen (US-0008) nutzen dieselbe gefilterte Abfrage.

- [ ] **Step 1: Failing Tests:**
  - `Pending_lists_only_own_app_uploads_with_state`.
  - `Today_returns_only_own_auto_created_bills_of_local_day`.
  - `Today_rejects_unknown_tz`.
  - `Analyzed_list_carries_source_upload_id`.
  - `Search_finds_bill_by_line_item_and_returns_match`.
  - `Search_match_is_null_when_shop_matches`.
  - `Search_sums_include_line_item_matches`.
  - `Analyze_endpoint_is_gone` (Route nicht registriert).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(shopping): pending and today analysis endpoints, line item search, remove sync analyze (US-0009)`.

---

## Frontend

### Task 4: API-Clients, DTOs und `AnalysisUploadService`

**Files:**
- Modify: `FE/src/app/api/shopping/bill-api.service.ts`:
  - `uploadForAnalysis(file: Blob, fileName: string): Observable<HttpEvent<{ id: string }>>` mit `reportProgress: true, observe: 'events'`;
  - `getPendingAnalyses()`, `getTodayAutoCreated()` (sendet `tz` über `currentTimeZone()` aus US-0008);
  - `analyzeBill` entfernen;
  - `addBill`/`updateBill` senden `lineItems` per `JSON.stringify`, wenn gesetzt.
- Modify/Create DTOs in `FE/src/app/api/shopping/dtos/`: `BillDto` (+ `lineItems?`, `matchedLineItem?`), `BillLineItemDto`, `PendingAnalysisDto`, `AutoCreatedBillDto`, `AnalyzedBillDto` (+ `sourceUploadId`), `BillCreateDto`/`BillUpdateDto` (+ `lineItems?`).
- Create: `FE/src/app/features/bill-analysis/services/analysis-upload.service.ts` (+ spec)

**Interfaces:**
- Produces:
  - `AnalysisUploadService`:
    - `uploads: Signal<LocalUpload[]>` mit `LocalUpload { localId, previewUrl, fileName, state: 'uploading' | 'analyzing' | 'failed', progress: number, serverId?: string }`;
    - `uploadAll(files: File[]): void`: komprimiert mit `compressImage(file, 1600, 0.8)`, lädt parallel, höchstens 3 gleichzeitig;
    - `retry(localId)`, `remove(localId)`;
    - `pending: Signal<PendingAnalysisDto[]>`, `todayCreated: Signal<AutoCreatedBillDto[]>`;
    - `inProgressCount: Signal<number>`: lokale Uploads in `uploading`/`failed` plus Server-`pending` ohne lokale Entsprechung, ohne Doppelzählung über `serverId`;
    - `refresh(): void`.
  - **Abfragen:**
    - Solange `inProgressCount() > 0` ist, ruft der Service `pending`, die Analyse-Liste (`AnalyzedBillContextService` reload) und `today` alle 3 s ab.
    - Nach 2 min ohne Änderung nur noch alle 15 s.
    - Während `document.hidden` pausiert er und fragt bei `visibilitychange → visible` sofort ab.
    - Ist nichts mehr in Arbeit, hört er auf.
  - **Abgeschlossene Uploads:** Ein lokaler Upload in `analyzing`, dessen `serverId` nicht mehr in `pending` steht, gilt als fertig, wird aus `uploads` entfernt und als `completed$: Observable<{ serverId: string }>` gemeldet. Der Tab nutzt das zum Hervorheben.
  - **Offline:** `uploadAll` zeigt ohne Verbindung (`OnlineStatusService.online()` false) die Snackbar „Ohne Verbindung können keine Rechnungen hochgeladen werden.“ und lädt nichts hoch.
  - Nach dem Start: `openInformationSnackbar` „3 Rechnungen werden analysiert“ bzw. „1 Rechnung wird analysiert“, Aktion „Anzeigen“ führt zu `/bill/analysis`.

- [ ] **Step 1: Failing Specs:**
  - Upload-Fortschritt wird gesetzt (`HttpTestingController` mit `UploadProgress`-Events).
  - `one failed upload does not stop the others`.
  - `retry re-uploads a failed one`.
  - Abfragen alle 3 s nur bei Arbeit, nach 2 min alle 15 s.
  - `pauses polling while document hidden and refreshes on visible`.
  - `completion detected when serverId leaves pending`.
  - Offline-Snackbar.
  - Snackbar-Texte für Einzahl und Mehrzahl.
  - `addBill sends lineItems as JSON string`.
  - `today request carries tz`.
- [ ] **Step 2:** `cd FE && npm test` → FAIL.
- [ ] **Step 3: Implementieren.** Context7: Angular `HttpEventType.UploadProgress`.
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(miniclient): analysis upload service with progress and polling, line item dtos (US-0009)`.

### Task 5: Kamera-Knopf und Teilen auf asynchron umstellen, synchronen Scan entfernen [UI]

**Files:**
- Modify: Dock bzw. Kamera-Knopf der Rechnungsliste (`FE/src/app/features/bill/quick-entry/...dock...` bzw. wo der Kamera-Input sitzt, per Serena finden): `<input type="file" accept="image/*" multiple>` ohne `capture`; ruft `AnalysisUploadService.uploadAll`.
- Delete: `FE/src/app/features/bill/scan/scan-overlay/*`, synchroner Teil von `scan.service.ts` (Datei entfällt, falls danach leer) samt Specs; Prefill-Hinweis „analysis-failed“ in `add-bill` und `BillCreatePrefill.notice`, soweit nur vom Scan genutzt.
- Modify: `FE/src/custom-sw.js` (alle Dateien: `formData.getAll('image')`, mehrere Cache-Einträge mit Index), `FE/src/app/features/bill/scan/shared-image.ts` (alle geteilten Bilder lesen und löschen), `FE/src/app/features/bill/modules/bill-list/bill-list.component.ts` (`?shared=1` → `uploadAll`), Specs `custom-sw.spec.ts`, `shared-image.spec.ts`
- Desktop: Der Button „Scannen“ in der Toolbar (US-0007) nutzt denselben Input.

**Interfaces:**
- Consumes: `AnalysisUploadService.uploadAll` (Task 4).

- [ ] **Step 1: Failing Specs:**
  - `camera input allows multiple and has no capture`.
  - `choosing 3 files starts 3 uploads and shows "3 Rechnungen werden analysiert"`.
  - `share target stores and uploads all shared images`, inklusive Dateiname mit Nicht-Latin-1-Zeichen und Datei ohne Typ (US-0007-Regeln bleiben).
  - `?shared=0 shows the existing failure snackbar`.
  - `no scan overlay or analyze call remains` (DOM und API).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(miniclient): async multi-photo scan and multi-image share target, remove sync scan (US-0009)`.

### Task 6: Tab „Analyse“ mit In Arbeit, Zu prüfen, Angelegt und Badge [UI]

**Files:**
- Modify: `FE/src/app/features/bill-analysis/modules/analyzed-bill/*` (die Liste wird die Seite mit drei Abschnitten)
- Create: `FE/src/app/features/bill-analysis/modules/analyzed-bill/in-progress-row/*`, `created-row/*`
- Create: `FE/src/app/features/bill-analysis/services/acknowledged-store.ts` (+ spec)
- Modify: Badge-Quelle (`nav-areas.ts` bzw. die Badge-Berechnung aus US-0007): zählt `inProgressCount()` plus „Zu prüfen“.

**Interfaces:**
- Consumes: `AnalysisUploadService` (Task 4), `AnalyzedBillContextService` (US-0007, Liste mit `sourceUploadId`).
- Produces: `AcknowledgedStore.isAcknowledged(billId)` und `acknowledge(billId)`, in `localStorage` unter dem Schlüssel `andaha.analysis.ack.<yyyy-MM-dd>`. Einträge früherer Tage werden beim Start entfernt.

**Inhalt:**
- **„In Arbeit“:**
  - Vorschau 48 px (rund 8; Belegsymbol ohne Vorschau);
  - „Wird hochgeladen · 45 %“ mit determiniertem `mat-progress-bar`, „Wird analysiert …“ mit indeterminiertem;
  - ab 2 min Zusatz „dauert länger als üblich“;
  - „Upload fehlgeschlagen“ mit „Erneut versuchen“ und „Entfernen“.
- **„Zu prüfen“:** wie bisher, mit Übernehmen und Verwerfen.
- **„Angelegt“:**
  - Shop, Betrag, Datum, Symbol „automatisch angelegt“;
  - Tipp öffnet `/bill/<billId>`;
  - Button „Erledigt“ rechts → `acknowledge`.
- Fertige Einträge werden über `sourceUploadId` kurz hervorgehoben (wie die neue Zeile in US-0007).
- **Leer:** „Keine Analysen – fotografiere Rechnungen mit dem Kamera-Knopf.“
- `app-load-state` für Laden und Fehler.

- [ ] **Step 1: Failing Specs:**
  - `shows three sections only when non-empty`.
  - `in-progress row shows upload percent and analyzing bar`.
  - `long analysis shows "dauert länger als üblich"`.
  - `failed upload offers retry and remove`.
  - `created row opens bill and Erledigt hides it (persisted per day)`.
  - `finished upload highlights its result via sourceUploadId`.
  - `badge counts in progress plus to review`.
  - `empty state text`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.** Context7: `mat-progress-bar` (mode `determinate`/`indeterminate`).
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(miniclient): analysis tab with in progress, to review and created sections (US-0009)`.

### Task 7: Positionen in den Rechnungsdetails – Anzeige, Summe, Abweichung, Filter [UI]

**Files:**
- Create: `FE/src/app/features/bill/modules/bill-details/line-items/line-items-view.component.{ts,html,scss}` (+ spec), `FE/src/app/features/bill/functions/line-items.ts` (+ spec)
- Modify: `FE/src/app/features/bill/modules/bill-details/bill-details.component.{ts,html}` (Positionen per `GET api/bill/{id}` nachladen; `?q=` lesen)

**Interfaces:**
- Produces:
  - `lineItemsSum(items: BillLineItemDto[]): number`: nur Positionen mit `totalPrice`, auf Cent gerundet.
  - `sumDeviates(items, price): boolean`: Differenz größer als 0,01 und mindestens eine Position mit Preis.
  - `filterLineItems(items, query): { item: BillLineItemDto; match: boolean }[]`: ohne Groß-/Kleinschreibung, getrimmt.
  - `LineItemsViewComponent`:
    - Eingaben `items`, `price`, `initialQuery`;
    - Abschnitt „Positionen“; Zeile mit Beschreibung, „2 × 1,49 €“ (wenn Menge und Einzelpreis bekannt), Gesamtpreis fett, negative in `--pos`;
    - „Summe der Positionen: 41,27 €“;
    - Abweichung: „Weicht vom Rechnungsbetrag ab (42,00 €)“ in `--mut`;
    - ab 8 Positionen Filterfeld „Positionen durchsuchen“ (mit `initialQuery` vorbelegt), Treffer hervorgehoben; unter 8 nur Hervorhebung bei `initialQuery`.

- [ ] **Step 1: Failing Specs:**
  - `lineItemsSum` mit null-Preisen und negativem Rabatt.
  - `sumDeviates`: Grenzfälle 0,01 und 0,02.
  - `filterLineItems`: Groß-/Kleinschreibung und Trim.
  - Komponente:
    - `hidden without items`;
    - `shows quantity × unit price line`;
    - `filter appears from 8 items`;
    - `?q= preselects and highlights`;
    - `partner bill shows items read-only`.
  - Detail: `loads items via getBillById after reload`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(miniclient): bill line items view with sum, deviation hint and filter (US-0009)`.

### Task 8: Positionen bearbeiten, im großen Formular und bei der Übernahme [UI]

**Files:**
- Create: `FE/src/app/features/bill/modules/bill-details/line-items/line-items-editor.component.{ts,html,scss}` (+ spec)
- Modify: `FE/src/app/features/bill/modules/bill-details/bill-details.component.*` (Bearbeiten-Modus mit Editor, Speichern sendet `lineItems`, Abbrechen stellt wieder her)
- Modify: `FE/src/app/features/bill/modules/add-bill/add-bill.component.*` (einklappbarer Abschnitt „Positionen (n)“, eingeklappt, mit Editor)
- Modify: `FE/src/app/features/bill/models/bill-create-prefill.ts` (`lineItems?: LineItemDraft[]`), `FE/src/app/features/bill-analysis/modules/analyzed-bill-details/analyzed-bill-details.component.ts` (Übernahme gibt die bereinigten Positionen mit)
- Modify: `FE/src/app/features/bill/functions/line-items.ts` (`sanitizeDrafts`)

**Interfaces:**
- Consumes: `addBill`/`updateBill` mit `lineItems` (Task 4), `LineItemsViewComponent` und Funktionen (Task 7).
- Produces:
  - `LineItemDraft { description: string; quantity: number | null; unitPrice: number | null; totalPrice: number | null }`.
  - `sanitizeDrafts(drafts)`: dieselben Regeln wie der Backend-Sanitizer (Task 1).
  - `LineItemsEditorComponent` ist ein `ControlValueAccessor` über `LineItemDraft[]`:
    - Zeile mit Beschreibung (Pflicht), Menge (ganze Zahl ≥ 1, optional), Gesamtpreis (optional, Komma, auch negativ) und ×;
    - „Position hinzufügen“;
    - Feldfehler „Pflichtfeld“ und „Ungültiger Wert“ (`.field-error`);
    - ändern sich Menge oder Gesamtpreis, wird `unitPrice` `null`.

- [ ] **Step 1: Failing Specs:**
  - Editor:
    - `remove without confirmation`;
    - `add row`;
    - `quantity 0 invalid`;
    - `negative total allowed`;
    - `changing total clears unit price`.
  - Details:
    - `edit mode shows editor for own bill only`;
    - `save sends lineItems JSON`;
    - `cancel restores items`.
  - Formular:
    - `section collapsed with count`;
    - `take-over prefill carries sanitized line items`;
    - `save sends them`.
  - `duplicate does not copy line items`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(miniclient): edit line items in bill details and form, carry them on take-over (US-0009)`.

### Task 9: Suchtreffer über Positionen in der Rechnungsliste, Doku [UI]

**Files:**
- Modify: `FE/src/app/features/bill/modules/bill-list/bill-list.component.{html,ts,scss}` (dritte Zeile bei `matchedLineItem`; Tipp öffnet `/bill/<id>?q=<Suchbegriff>`)
- Modify: `docs/design/DESIGN.md` (neue Bausteine: Analyse-Tab mit drei Abschnitten, Upload-Fortschritt, Positionsliste und -editor, Treffer-Zeile), `docs/stories/US-0007-navigation-schnellerfassung/design.md` §5.1 (Hinweis „ersetzt durch US-0009“)

**Interfaces:**
- Consumes: `BillDto.matchedLineItem` (Task 3/4), BillContextService-Suchbegriff (bestehend).

**Inhalt:** Die dritte Zeile steht in `--mut`, mit Such-Icon, Text „Druckerpatronen XL · 34,99 €“ auf eine Zeile gekürzt. Ohne Suchbegriff gibt es keine dritte Zeile. Langer Druck und Pull-to-Refresh bleiben.

- [ ] **Step 1: Failing Specs:**
  - `shows matched line item row during search`.
  - `tap opens bill with q param`.
  - `no extra row without search`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementieren.**
- [ ] **Step 4:** Gates grün.
- [ ] **Step 5: Commit** `feat(miniclient): line item search matches in bill list, docs (US-0009)`.

---

## Abschluss (Controller)

- Whole-Branch-Review.
- Phase 4: UI-Prüfung bei 390 und 1440 px. Uploads gehen echt an den lokalen Monolith. `pending`, `today` und die Analyse-Liste werden per Playwright-Route gestubbt. Rechnungen mit Positionen werden per SQL in LocalDB angelegt und wieder entfernt.
- Kostenerfassung.
- Status in `story.md`.
