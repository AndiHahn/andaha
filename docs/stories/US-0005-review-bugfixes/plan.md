# Bugfixes aus dem Review – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die sieben Daten-Bugs aus dem Review sowie zwei beim Design gefundene Backend-Fehler sind behoben (Analyse, Personen-Notizen und -Zahlungen, Offline-Rechnungen, App-Update, Detailseiten, Speicherfehler, Unterkategorie-Prüfung, idempotentes Anlegen von Rechnungen).

**Architecture:**
- **Backend:** Shopping speichert Analyse-Uploads im Analyse-Speicher, legt Rechnungen idempotent an und liefert die Analyse-Felder und Bilder vollständig. Work trennt Notizen und Zahlungen im `PersonDto`.
- **Frontend Speicher:** Offline-Rechnungen liegen in IndexedDB, Fotos werden vorher verkleinert. Die Synchronisierung ist fehlertolerant.
- **Frontend Seiten:** Detailseiten warten über ein `byId`-Observable ihres Kontext-Services auf die Daten. Formulare bleiben nach Speicherfehlern bearbeitbar.
- **Testprojekte:** Zwei neue xUnit-Testprojekte entstehen.

**Tech Stack:**
- Backend: .NET 10, EF Core 10, MediatR, FluentValidation, Dapr. Tests mit xUnit, NSubstitute und `Microsoft.EntityFrameworkCore.Sqlite`.
- Frontend: Angular 14 (Material 14, `@angular/service-worker`), Jasmine/Karma, native IndexedDB-API.

**Spec:** `docs/stories/US-0005-review-bugfixes/design.md` (Story: `story.md` daneben). Executors lesen beides.

## Global Constraints

**Pfadkürzel**
- `MC` = `src/WebApps/MiniClient/Andaha.WebApps.MiniClient`, Angular-Code unter `MC/src/app`.
- `SH` = `src/Services/Shopping/Andaha.Services.Shopping`.
- `WK` = `src/Services/Work/Andaha.Services.Work`.

**Befehle**
- Frontend, in `MC` ausgeführt:
  - Tests: `npx ng test --watch=false --browsers=ChromeHeadless [--include <spec>]`
  - Build: `npx ng build`
- Backend:
  - `dotnet build Andaha.sln`
  - `dotnet test src/Services/Shopping/Andaha.Services.Shopping.Tests`
  - `dotnet test src/Services/Work/Andaha.Services.Work.Tests`
- Jede Task endet mit grünem Build des betroffenen Teils. Tasks, die Backend-Code ändern, brauchen außerdem `dotnet build` von `src/Services/Monolith/Andaha.Services.Monolith`, weil der Monolith die Services referenziert.

**Design und Texte**
- „Tinte & Kupfer“ (`docs/design/DESIGN.md`) bleibt. Nur bestehende Klassen und Tokens verwenden (`kv`, `k`, `v`, `field`, `btn`, `progress-slot`, `empty`, `--fg`, `--mut`, `--dim`).
- Texte sind deutsch und stehen exakt so im Plan.
- Snackbars laufen nur über `openInformationSnackbar` bzw. `openErrorSnackbar` (`MC/src/app/shared/snackbar/snackbar-functions.ts`), nie über `snackbar.open`.
- Specs, die die Pipe `number:…:'de'` oder `date` mit `'de'` rendern, rufen `registerLocaleData(localeDe, 'de')` auf.

**Grenzen**
- Keine neuen Frontend-Abhängigkeiten. IndexedDB wird nativ angesprochen.
- Die Analyse-Pipeline (`AnalyzeBillWorker`, `AnalyzeBillMessageHandler`, Analyse-Repositories) bleibt unverändert, ebenso der Endpoint `POST bill/analyze`.
- Keine EF-Migrationen: Es ändern sich keine Entitäten, nur DTOs und Abfragen.
- `pipeline/`-Ordner und Bicep bleiben unverändert. Die neuen Tests laufen lokal.
- Library-APIs (Angular `SwUpdate`, `MatSnackBar`, EF Core SQLite, NSubstitute, IndexedDB) im Zweifel per Context7 nachschlagen statt aus dem Gedächtnis.

**Arbeitsweise**
- Nicht committen. Der Controller committet am Ende auf Anweisung des Nutzers.
- Serena-Werkzeuge für Navigation und symbolische Edits verwenden (`.claude/rules/agentflow.md`).

## Review Focus

1. **IndexedDB nicht verfügbar oder Schreiben schlägt fehl** (z. B. privater Modus, voller Speicher):
   - Erwartet: Die Fehler-Snackbar „Rechnung konnte nicht gespeichert werden.“ erscheint, die Rechnung verschwindet aus der Liste, das Formular bleibt ausgefüllt.
   - Tests: `saveNewBillLocal rejects when store put fails` (Task 7) und `addBill removes bill from list and rejects when local save fails` (Task 8).
2. **Zwei Sync-Auslöser kurz hintereinander** (`online` und `visibilitychange` gleichzeitig):
   - Erwartet: Jede Rechnung wird genau einmal gepostet.
   - Test: `concurrent sync triggers post each bill once` (Task 8).
3. **Erneuter Versuch, nachdem der Server die Rechnung schon angelegt hatte:**
   - Erwartet: Es entsteht keine zweite Rechnung, und der lokale Eintrag verschwindet.
   - Tests: `Create_same_id_twice_returns_existing_bill` (Task 2) und `successful sync removes local entry` (Task 8).
4. **Reload einer Detailseite, während das erste Laden der Liste fehlschlägt** (offline):
   - Erwartet: Kein endloser Spinner, sondern Navigation zur Liste mit Hinweis.
   - Test: `byId emits undefined when initial load fails` (Task 10) und `navigates to list when entry not found` (Task 11).
5. **Alte localStorage-Einträge beim Update:**
   - Mit Foto-Data-URL: Das Foto kommt als Blob in IndexedDB an. Der localStorage-Schlüssel wird erst nach erfolgreichem Schreiben gelöscht.
   - Kaputtes JSON: Kein Absturz, der Schlüssel bleibt stehen.
   - Tests: `migrates legacy localStorage bills with image` und `keeps legacy key when json is corrupt` (Task 7).

---

### Task 1: Shopping-Testprojekt und Unterkategorie-Prüfung (AC16)

**Files:**
- Create: `src/Services/Shopping/Andaha.Services.Shopping.Tests/Andaha.Services.Shopping.Tests.csproj`
- Create: `src/Services/Shopping/Andaha.Services.Shopping.Tests/TestDb.cs`
- Create: `src/Services/Shopping/Andaha.Services.Shopping.Tests/Bill/BillCommandValidatorTests.cs`
- Modify: `SH/Andaha.Services.Shopping.csproj` (InternalsVisibleTo)
- Modify: `SH/Requests/Bill/CreateBill/V1/CreateBillCommandValidator.cs:39`
- Modify: `SH/Requests/Bill/UpdateBill/V1/UpdateBillCommandValidator.cs:42`
- Modify: `Andaha.sln`

**Interfaces:**
- Produces:
  - `TestDb.CreateShopping(): (ShoppingDbContext Context, SqliteConnection Connection)`. SQLite in-memory (`DataSource=:memory:`), Verbindung offen, `Database.EnsureCreated()`. Der Aufrufer disposed die Verbindung.
  - Das Testprojekt mit Paketen `xunit`, `xunit.runner.visualstudio`, `Microsoft.NET.Test.Sdk`, `NSubstitute`, `Microsoft.EntityFrameworkCore.Sqlite` (10.0.1, passend zu EF Core im Service), `net10.0`, Projektverweis auf `SH`.
  - Im Service-csproj: `<InternalsVisibleTo Include="Andaha.Services.Shopping.Tests" />` und `<InternalsVisibleTo Include="DynamicProxyGenAssembly2" />`.

- [ ] **Step 1: Testprojekt anlegen und in die Solution aufnehmen**
  - Run: `dotnet new xunit -o src/Services/Shopping/Andaha.Services.Shopping.Tests -f net10.0`, dann Pakete und Projektverweis ergänzen.
  - Run: `dotnet sln Andaha.sln add src/Services/Shopping/Andaha.Services.Shopping.Tests/Andaha.Services.Shopping.Tests.csproj --solution-folder Shopping`. Prüfen, dass der Eintrag unter dem bestehenden Solution-Ordner „Shopping“ liegt, sonst `.sln` anpassen.
  - Den Platzhaltertest `UnitTest1.cs` löschen.
- [ ] **Step 2: `TestDb.CreateShopping()` schreiben.** Läuft `EnsureCreated` wegen SQL-Server-spezifischer Konfiguration (`HasColumnType` u. ä.) nicht durch, das Problem im Test-Helper lösen, nicht im Service.
- [ ] **Step 3: Failing Tests schreiben** in `BillCommandValidatorTests`. Testdaten: Benutzer A mit Kategorie K1 (Unterkategorie U1) und Kategorie K2 (Unterkategorie U2). `IIdentityService.GetUserId()` per NSubstitute liefert A.
  - `Create_with_valid_subcategory_is_valid`: `CategoryId = K1`, `SubCategoryId = U1` → `IsValid == true`
  - `Create_with_subcategory_of_other_category_is_invalid`: `K1` + `U2` → `IsValid == false`
  - `Create_without_subcategory_is_valid`: `K1` + `null` → `true`
  - `Update_with_valid_subcategory_is_valid`: `K1` + `U1` → `true`
  - `Update_with_subcategory_of_other_category_is_invalid`: `K1` + `U2` → `false`
- [ ] **Step 4: Tests ausführen.** Run: `dotnet test src/Services/Shopping/Andaha.Services.Shopping.Tests`. Expected: FAIL in beiden `*_with_valid_subcategory_is_valid`.
- [ ] **Step 5: Fix umsetzen:** in beiden Validatoren `subCategory.Id == command.SubCategoryId`.
- [ ] **Step 6: Tests erneut ausführen.** Expected: alle PASS.
- [ ] **Step 7: Build prüfen.** Run: `dotnet build Andaha.sln`. Expected: `Build succeeded`.

### Task 2: `CreateBill` idempotent (AC17)

**Files:**
- Modify: `SH/Requests/Bill/CreateBill/V1/CreateBillCommandHandler.cs`
- Test: `src/Services/Shopping/Andaha.Services.Shopping.Tests/Bill/CreateBillCommandHandlerTests.cs`

**Interfaces:**
- Consumes: `TestDb.CreateShopping()` aus Task 1.
- Produces: `POST bill` mit einer bereits existierenden ID verhält sich so:
  - eigene Rechnung → `200` mit dem `BillDto` der bestehenden Rechnung
  - fremde Rechnung → `409 Conflict`

- [ ] **Step 1: Failing Tests schreiben.** `ISender` und `IIdentityService` werden per NSubstitute ersetzt. Das Bild ist ein `IFormFile`-Substitute.
  - `Create_same_id_twice_returns_existing_bill`: zweimal `Handle` mit gleicher ID → `dbContext.Bill.Count() == 1`, zweites Ergebnis ist `Ok<BillDto>` mit gleicher ID.
  - `Create_existing_id_of_other_user_returns_conflict`: Rechnung mit ID X gehört Benutzer B, Aufruf als A → Ergebnis ist ein Conflict-Result, `Count() == 1`.
  - `Create_existing_bill_without_image_uploads_image`: erst ohne Bild anlegen, dann gleiche ID mit Bild → `sender.Send(Arg.Is<UploadBillImageCommand>(c => c.Id == X), …)` genau einmal empfangen. Den Property-Namen der ID im `UploadBillImageCommand` prüfen.
  - `Create_existing_bill_with_image_does_not_upload_again`: Rechnung hat bereits ein Bild (`bill.AddImage` o. ä.) → kein `Send`.
- [ ] **Step 2: Tests ausführen.** Run: `dotnet test src/Services/Shopping/Andaha.Services.Shopping.Tests --filter CreateBillCommandHandlerTests`. Expected: FAIL (Primärschlüssel-Fehler bzw. fehlendes Conflict).
- [ ] **Step 3: Umsetzen in `CreateBillCommandHandler.Handle`.** Vor dem Anlegen die bestehende Rechnung mit `Images` nach `request.Id` laden.
  - Existiert sie und `!existing.HasCreated(userId)` → `Results.Conflict()`.
  - Existiert sie und gehört dem Benutzer → bei `request.Image is not null && !existing.Images.Any()` das Bild über `UploadBillImageCommand` hochladen, dann `Results.Ok(FindBillDtoByIdAsync(...))`.
  - Sonst das bisherige Verhalten.
- [ ] **Step 4: Tests erneut ausführen.** Expected: PASS.
- [ ] **Step 5: Build prüfen.** Run: `dotnet build Andaha.sln`. Expected: `Build succeeded`.

### Task 3: Analyse im Backend: Upload, DTO, Bild-Endpoint (AC1, AC4)

**Files:**
- Modify: `SH/Requests/Bill/UploadForAnalysis/V1/UploadBillForAnalysisCommandHandler.cs`
- Modify: `SH/Requests/Bill/Dtos/V1/AnalyzedBillDto.cs`
- Modify: `SH/Requests/Bill/Dtos/V1/AnalyzedBillDtoMapping.cs`
- Modify: `SH/Requests/Bill/GetAnalyzedBills/V1/GetAnalyzedBillsQueryHandler.cs` (nur falls `Images` für die Expression ein Include braucht)
- Create: `SH/Requests/Bill/GetAnalyzedBillImage/V1/GetAnalyzedBillImageQuery.cs`
- Create: `SH/Requests/Bill/GetAnalyzedBillImage/V1/GetAnalyzedBillImageQueryHandler.cs`
- Modify: `SH/Requests/Bill/BillEndpointExtensions.cs` (neue Map-Methode, Aufruf in `MapBillEndpoint`)
- Test: `src/Services/Shopping/Andaha.Services.Shopping.Tests/Bill/AnalysisTests.cs`

**Interfaces:**
- Produces:
  - `AnalyzedBillDto(Guid Id, Guid? CategoryId, Guid? SubCategoryId, string? ShopName, double? Price, DateTime? Date, IReadOnlyCollection<AnalyzedBillLineItemDto> LineItems, double? Confidence, double? TotalAmountConfidence, bool ImageAvailable)`. JSON-Felder in camelCase: `confidence`, `totalAmountConfidence`, `imageAvailable`.
  - `GET api/bill/analyzed/{id}/image` → `200` mit `image/png` (wie `GetBillImageQueryHandler`), `404` ohne Analyse oder ohne Bild, `Forbid` bei fremdem Benutzer.
  - `GetAnalyzedBillImageQuery(Guid Id) : IHttpRequest`.
  - `POST api/bill/upload-for-analysis` → `202`. Das Bild liegt in `IAnalysisImageRepository` unter `Guid.NewGuid().ToString()` mit der `userId` des Aufrufers. Es wird keine Nachricht veröffentlicht.

- [ ] **Step 1: Failing Tests schreiben** in `AnalysisTests`:
  - `Upload_stores_image_in_analysis_repository_with_user`: `IAnalysisImageRepository`-Substitute empfängt `UploadImageAsync(Arg.Any<string>(), Arg.Any<Stream>(), userA, …)` einmal. Ergebnis ist Accepted (Status 202).
  - `Upload_does_not_publish_message`: Diesen Test nur schreiben, wenn `IMessageBroker` nach dem Umbau noch injiziert wird. Sonst entfällt er, und die Konstruktorsignatur ohne `IMessageBroker` ist der Nachweis.
  - `Upload_without_file_returns_bad_request`: leere Datei → 400 (bestehendes Verhalten bleibt).
  - `AnalyzedBills_list_contains_confidence_and_image_flag`: `AnalyzedBill` mit `confidence 0.87` und einem Bild in SQLite, `GetAnalyzedBillsQueryHandler` → DTO mit `Confidence == 0.87` und `ImageAvailable == true`. Eine zweite Analyse ohne Bild liefert `false`.
  - `AnalyzedBill_image_returns_not_found_without_image` und `AnalyzedBill_image_forbids_other_user`.
- [ ] **Step 2: Tests ausführen.** Run: `dotnet test src/Services/Shopping/Andaha.Services.Shopping.Tests --filter AnalysisTests`. Expected: FAIL (kompiliert nicht bzw. falsches Repository).
- [ ] **Step 3: Upload-Handler umbauen:** `IImageRepository` und `IMessageBroker` durch `IAnalysisImageRepository` ersetzen, `UploadImageAsync(name, stream, userId, ct)`.
- [ ] **Step 4: DTO und Mapping erweitern:** `ImageAvailable = bill.Images.Any()`.
- [ ] **Step 5: Bild-Query und -Handler anlegen und mappen:** `MediateGet<GetAnalyzedBillImage.V1.GetAnalyzedBillImageQuery>("analyzed/{id}/image")`, `Produces` wie bei `MapDownloadImage`. Prüfen, dass die Route nicht mit `GET analyzed` (Liste) und `{id}/image` kollidiert. Der Bildname kommt aus `analyzedBill.Images.First().Name`.
- [ ] **Step 6: Tests erneut ausführen.** Expected: PASS.
- [ ] **Step 7: Build prüfen.** Run: `dotnet build Andaha.sln`. Expected: `Build succeeded`.

### Task 4: Work-Testprojekt und `PersonDto` mit Zahlungen (AC5, AC6 Backend)

**Files:**
- Create: `src/Services/Work/Andaha.Services.Work.Tests/Andaha.Services.Work.Tests.csproj` (wie Task 1)
- Create: `src/Services/Work/Andaha.Services.Work.Tests/TestDb.cs`
- Create: `src/Services/Work/Andaha.Services.Work.Tests/Person/PersonDtoTests.cs`
- Create: `WK/Requests/Person/Dtos/V1/PaymentDto.cs`
- Modify: `WK/Requests/Person/Dtos/V1/PersonDto.cs`
- Modify: `WK/Requests/Person/Dtos/V1/PersonDtoMapping.cs`
- Modify: `WK/Requests/Person/UpdatePerson/V1/UpdatePersonRequestHandler.cs`
- Modify: `WK/Andaha.Services.Work.csproj` (InternalsVisibleTo wie Task 1)
- Modify: `Andaha.sln` (Solution-Ordner „Work“)

**Interfaces:**
- Produces:
  - `PaymentDto(Guid Id, DateTime PayedAt, TimeSpan PayedHours, double PayedMoney, double PayedTip, string? Notes)`
  - `PersonDto(Guid Id, string Name, double HourlyRate, string? Notes, TimeSpan TotalHours, TimeSpan PayedHours, IReadOnlyCollection<PaymentDto> Payments)`: `Notes = person.Notes`, `Payments` absteigend nach `PayedAt`.
  - JSON: `payments[].payedAt` (ISO), `payedHours` im Format des bestehenden `TimeSpanConverter`, `payedMoney`, `payedTip`, `notes`.
  - `TestDb.CreateWork(): (WorkDbContext Context, SqliteConnection Connection)`.

- [ ] **Step 1: Testprojekt anlegen** wie Task 1, Step 1 (Ordner „Work“).
- [ ] **Step 2: Failing Tests schreiben** in `PersonDtoTests`. Person P mit `Notes = "Schlüssel unter der Matte"` und zwei Zahlungen (2 h, 50 € inkl. 5 € Trinkgeld; 3 h, 60 €, 0 € Trinkgeld), dazu Arbeitszeiten über 5 h.
  - `List_returns_real_notes`: `ListPersonsRequestHandler` (SQLite, `ICollaborationApiProxy` per Substitute ohne Verbindungen) → `Notes == "Schlüssel unter der Matte"`.
  - `List_returns_payments_newest_first`: `Payments.Count == 2`, erstes Element ist die jüngere Zahlung, `PayedMoney == 50` und `PayedTip == 5` an der richtigen Zahlung.
  - `List_query_is_translated`: wird durch die beiden Tests oben implizit abgedeckt, weil sie gegen SQLite laufen.
  - `Update_returns_hours_and_payments`: `UpdatePersonRequestHandler` mit neuem Namen → `TotalHours == 5 h`, `PayedHours == 5 h`, `Payments.Count == 2`.
- [ ] **Step 3: Tests ausführen.** Run: `dotnet test src/Services/Work/Andaha.Services.Work.Tests`. Expected: FAIL.
- [ ] **Step 4: Umsetzen:**
  - DTO und Mapping erweitern.
  - Im Update-Handler die Person per `Include(p => p.Payments).Include(p => p.WorkingEntries).FirstOrDefaultAsync(p => p.Id == request.Id, ct)` statt `FindByIdAsync` laden.
  - Den Create-Handler unverändert lassen, eine neue Person hat ohnehin keine Zahlungen.
- [ ] **Step 5: Tests erneut ausführen.** Expected: PASS.
- [ ] **Step 6: Build prüfen.** Run: `dotnet build Andaha.sln`. Expected: `Build succeeded`.

### Task 5: Snackbar mit Aktion und Update-Hinweis (AC12) · UI

**Files:**
- Modify: `MC/src/app/shared/snackbar/snackbar-functions.ts`
- Modify: `MC/src/app/shared/snackbar/information-snackbar/information-snackbar.component.{ts,html,scss}`
- Create: `MC/src/app/core/app-update.service.ts`
- Create: `MC/src/app/core/app-update.service.spec.ts`
- Modify: `MC/src/app/app.component.ts` (Update-Logik entfernen, `AppUpdateService.init()` aufrufen)

**Interfaces:**
- Produces:
  - `export interface InformationSnackbarData { message: string; action?: string; }`
  - `openInformationSnackbar(message: string, snackbar: MatSnackBar, options?: { action?: string; duration?: number | null }): MatSnackBarRef<InformationSnackbarComponent>`. Ohne `options` bleibt das Verhalten wie heute (3000 ms). `duration: null` heißt: bleibt stehen.
  - `InformationSnackbarComponent`: zeigt bei `action` rechts einen Text-Button (Akzentfarbe, Token wie bestehende Links/Buttons), Klick → `snackbarRef.dismissWithAction()`.
  - `AppUpdateService` (`providedIn: 'root'`) mit `init(): void` und `protected reload(): void` (ruft `document.location.reload()` auf).
- Copy:
  - Bei `VERSION_READY`: „Neue Version verfügbar“, Aktion „Neu laden“, ohne Zeitlimit. Bei Aktion: `activateUpdate()`, danach `reload()`.
  - Bei `unrecoverable`: „Die App muss neu geladen werden.“, Aktion „Neu laden“, bei Aktion `reload()`.

- [ ] **Step 1: Failing Tests schreiben** in `app-update.service.spec.ts`. `SwUpdate`-Stub mit `versionUpdates: Subject`, `unrecoverable: Subject`, `activateUpdate: jasmine.createSpy().and.resolveTo(true)`, `isEnabled: true`. `reload` wird per Spy ersetzt.
  - `does not reload when version is ready`: `VERSION_READY` emittieren → `reload` nicht aufgerufen, `activateUpdate` nicht aufgerufen, Snackbar mit „Neue Version verfügbar“ geöffnet.
  - `reloads after action`: `onAction()` des zurückgegebenen Refs emittiert → `activateUpdate` und danach `reload` aufgerufen.
  - `prompts on unrecoverable state`: Snackbar mit „Die App muss neu geladen werden.“.
  - `ignores other version events`: `VERSION_DETECTED` → keine Snackbar.
- [ ] **Step 2: Tests ausführen.** Run: `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/core/app-update.service.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Snackbar-Erweiterung und Service umsetzen.** Bestehende Aufrufer von `openInformationSnackbar` kompilieren unverändert weiter. Alle Stellen, die `MAT_SNACK_BAR_DATA` als `string` lesen, auf `InformationSnackbarData` umstellen.
- [ ] **Step 4: Tests erneut ausführen.** Expected: PASS. Danach die komplette Suite: `npx ng test --watch=false --browsers=ChromeHeadless`. Expected: alle PASS.
- [ ] **Step 5: Build prüfen.** Run: `npx ng build`. Expected: Erfolg.

### Task 6: Personen: Notizen, Zahlungsliste, kein doppeltes Zählen (AC5–AC7) · UI

**Files:**
- Create: `MC/src/app/api/work/dtos/PaymentDto.ts`
- Modify: `MC/src/app/api/work/dtos/PersonDto.ts`
- Modify: `MC/src/app/features/work/services/person-context.service.ts` (`addPayment`)
- Modify: `MC/src/app/features/work/modules/person/person-details/person-details.component.{ts,html,scss}`
- Test: `MC/src/app/features/work/services/person-context.service.spec.ts` (bestehende Datei erweitern)
- Test: `MC/src/app/api/work/dtos/PersonDto.spec.ts`

**Interfaces:**
- Consumes: `PersonDto.payments` vom Backend (Task 4).
- Produces:
  - `PaymentDto { id: string; payedAt: Date; payedHours: Time; payedMoney: number; payedTip: number; notes?: string }`, dazu `PaymentDtoRaw` mit `payedAt: string` und `payedHours: string`.
  - `PersonDto.payments: PaymentDto[]`. `mapPersonDtoRaw` mappt sie mit `getHoursFromTimeString` und `getMinutesFromTimeString`. Fehlt das Feld (älteres Backend), wird `[]` gesetzt.
  - `PersonContextService.addPayment(personId, dto): Observable<void>` emittiert erst, nachdem die Personenliste neu geladen ist. Keine lokale Addition mehr.
- UI (`person-details.component.html`, Lesemodus, unter Stundensatz und Notizen):
  - Abschnitt mit Überschrift „Zahlungen“, Stil wie die anderen Abschnittsüberschriften der Seite.
  - Je Zahlung eine `kv`-Zeile:
    - `k`: `{{ payedAt | date:'dd.MM.yyyy':undefined:'de' }} · {{ h }}:{{ mm }} h`
    - `v`: `{{ payedMoney | number:'1.2-2':'de' }} €`, darunter klein (`--mut`) „davon {{ payedTip | number:'1.2-2':'de' }} € Trinkgeld“, nur bei `payedTip > 0`
  - Leer: „Noch keine Zahlungen.“ (Klasse `empty`).
  - „Notizen“ zeigt `notes` wie bisher aus dem Formular.

- [ ] **Step 1: Failing Tests schreiben**
  - `PersonDto.spec.ts`:
    - `maps payments`: Raw mit `payments: [{ id:'1', payedAt:'2026-10-01T10:00:00Z', payedHours:'02:30:00', payedMoney:50, payedTip:5 }]` → `payedAt instanceof Date`, `payedHours` gleich `{hours:2, minutes:30}`.
    - `defaults payments to empty array`.
  - `person-context.service.spec.ts`:
    - `addPayment refetches persons and does not add hours locally`: API-Stub `payPerson` → `of(void 0)`, `listPersons` liefert beim zweiten Aufruf `payedHours 05:00`. Nach Abschluss ist `getById(id).payedHours` gleich `{hours:5, minutes:0}` (nicht 5 h + bezahlte Stunden), und `listPersons` wurde ein zweites Mal aufgerufen.
- [ ] **Step 2: Tests ausführen.** Run: `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/api/work/dtos/PersonDto.spec.ts --include src/app/features/work/services/person-context.service.spec.ts`. Expected: FAIL.
- [ ] **Step 3: DTO, Mapping und `addPayment` umsetzen.**
- [ ] **Step 4: `person-details` umbauen:**
  - Die Komponente abonniert `contextService.persons()` (mit `takeUntil(destroy$)`) und aktualisiert `this.person` per ID aus der Liste. Im Bearbeiten-Modus wird das Formular dabei nicht überschrieben.
  - Die lokale Addition in `onAddPaymentClick` (heute Zeile ~106) entfällt.
  - Zahlungsabschnitt wie oben.
- [ ] **Step 5: Tests erneut ausführen und Build prüfen.** Erst die Tests aus Step 2, dann die komplette Suite. Run: `npx ng build`. Expected: alle PASS, Build ok.

### Task 7: Bildverkleinerung und IndexedDB-Speicher für Offline-Rechnungen (AC8, AC11)

**Files:**
- Create: `MC/src/app/shared/utils/image-utils.ts`
- Create: `MC/src/app/shared/utils/image-utils.spec.ts`
- Create: `MC/src/app/features/bill/services/pending-bill-store.service.ts`
- Modify: `MC/src/app/features/bill/services/bill-cache.service.ts`
- Create: `MC/src/app/features/bill/services/bill-cache.service.spec.ts`

**Interfaces:**
- Produces:
  - `compressImage(file: Blob, maxEdge = 2000, quality = 0.85): Promise<File>`:
    - Skaliert per Canvas, sodass die lange Kante ≤ `maxEdge` ist, und liefert `image/jpeg` mit Dateiname `image.jpg`.
    - Bei jedem Fehler (Bild nicht dekodierbar, kein Canvas, `toBlob` liefert `null`) wird die Eingabe unverändert als `File` zurückgegeben.
  - `PendingBillStore` (`providedIn: 'root'`), DB `andaha`, Version 1, Store `pendingBills`, `keyPath: 'id'`:
    - `getAll(): Promise<BillCreateDto[]>`
    - `put(bill: BillCreateDto): Promise<void>`
    - `delete(id: string): Promise<void>`
    - Das Bild wird als `File`/`Blob` im Datensatz gespeichert (Structured Clone).
    - Ist `indexedDB` nicht verfügbar, wird jede Methode rejected.
  - `BillCacheService`:
    - `saveNewBillLocal(bill: BillCreateDto): Promise<void>`: komprimiert `bill.image` per `compressImage` und schreibt per `put`. Rejected, wenn `put` fehlschlägt. Emittiert `billAdded()` nur bei Erfolg.
    - `removeBillLocal(id: string): Promise<void>`
    - `getBillsToSync(): Promise<BillCreateDto[]>`: alle gespeicherten Rechnungen. Die Sperre gegen parallele Läufe übernimmt Task 8, `currentlySyncing` entfällt.
    - `migrateLegacyBills(): Promise<void>`: wird vom Konstruktor angestoßen. `getBillsToSync()` wartet auf den Abschluss.
  - Legacy-Format: localStorage-Schlüssel `Bills|New`, JSON-Array von `BillCreateCacheItem` (Bild als Data-URL). Umwandlung über die bestehenden `dataUrlToBase64`, `fileDataUriToBlob` und `imageBlobToFile`.

- [ ] **Step 1: Failing Tests schreiben**
  - `image-utils.spec.ts`:
    - `returns jpeg not larger than maxEdge`: ein 3000×1000-Canvas als PNG-Blob erzeugen, `compressImage(blob, 2000)` → `type === 'image/jpeg'`, per `createImageBitmap` gemessen ist die Breite 2000.
    - `returns input when image cannot be decoded`: `new Blob(['x'])` → das Ergebnis hat gleiche Größe und gleichen Typ wie die Eingabe.
  - `bill-cache.service.spec.ts` (`PendingBillStore` per Jasmine-Spy-Objekt mit In-Memory-Map, `compressImage` wird nicht gemockt, Bilder sind kleine Test-Blobs):
    - `saveNewBillLocal stores bill and emits billAdded`
    - `saveNewBillLocal rejects when store put fails`: `put` rejected → Promise rejected, `billAdded` nicht emittiert
    - `migrates legacy localStorage bills with image`: `localStorage['Bills|New']` mit einem Eintrag inkl. Data-URL eines 1×1-PNG → nach `getBillsToSync()` ein Eintrag mit `image instanceof Blob`, der Schlüssel ist entfernt
    - `keeps legacy key when json is corrupt`: `'{kaputt'` → kein Fehler, `getBillsToSync()` liefert `[]`, der Schlüssel ist noch da
    - `keeps legacy key when store write fails`
    - `removeBillLocal deletes entry`
- [ ] **Step 2: Tests ausführen.** Run: `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/shared/utils/image-utils.spec.ts --include src/app/features/bill/services/bill-cache.service.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Umsetzen.** `PendingBillStore` öffnet die Datenbank einmal lazy (`indexedDB.open('andaha', 1)`, `onupgradeneeded` legt den Store an). Jede Operation läuft in einer eigenen Transaktion und wird als Promise auf `oncomplete`/`onerror` abgebildet.
- [ ] **Step 4: Tests erneut ausführen.** Expected: PASS. Run: `npx ng build`. Expected: Erfolg. Die Aufrufer in `BillContextService` werden erst in Task 8 angepasst. Kompiliert der Build vorher nicht, die minimalen Anpassungen dort schon hier vornehmen (Promise statt sync) und Task 8 darauf aufbauen lassen.

### Task 8: Rechnung lokal speichern und robust synchronisieren (AC9, AC10) · UI

**Files:**
- Modify: `MC/src/app/features/bill/services/bill-context.service.ts`
- Modify: `MC/src/app/features/bill/modules/add-bill/add-bill.component.ts`
- Modify: `MC/src/app/features/bill/services/bill-context.service.spec.ts` (bestehend)

**Interfaces:**
- Consumes: `BillCacheService` aus Task 7.
- Produces:
  - `BillContextService.addBill(dto, category, subCategory?): Promise<void>`:
    - Fügt die Rechnung sofort in die Liste ein.
    - Schlägt `saveNewBillLocal` fehl, wird sie wieder entfernt (inkl. `totalResults - 1`) und das Promise rejected.
  - Synchronisierung:
    - Ein privates Flag `syncRunning` verhindert parallele Läufe.
    - Pro Rechnung gilt: Erfolg (2xx) → `removeBillLocal`. Fehler → Eintrag bleibt.
    - Nach Abschluss aller Versuche: `syncing$` = `false`. Gab es mindestens einen Erfolg, wird die Liste neu geladen.
    - Auslöser:
      - `backendReady` (wie bisher)
      - `billAdded()` (wie bisher)
      - `window` `online`
      - `document` `visibilitychange` mit `document.visibilityState === 'visible'`
      - Die Listener registriert der Service im Konstruktor.
  - `AddBillComponent.onSubmit`:
    - Wartet auf `addBill`.
    - Bei Erfolg Formular leeren wie bisher.
    - Bei Fehler `openErrorSnackbar('Rechnung konnte nicht gespeichert werden.', snackbar)`, Formular bleibt ausgefüllt.
    - Der Speichern-Button ist währenddessen gesperrt (`isSaving`).

- [ ] **Step 1: Failing Tests schreiben** in `bill-context.service.spec.ts` (API und Cache per Spy):
  - `addBill removes bill from list and rejects when local save fails`
  - `sync failure resets syncing`: `addBill` (API) liefert `throwError(500)` → `syncing` emittiert zuletzt `false`, `removeBillLocal` nicht aufgerufen
  - `successful sync removes local entry`
  - `concurrent sync triggers post each bill once`: zwei Auslöser direkt nacheinander (`window.dispatchEvent(new Event('online'))` zweimal) bei verzögerter API-Antwort (`Subject`) → `billApi.addBill` genau einmal pro Rechnung
  - `retries on online event`: nach Fehlschlag löst ein `online`-Event einen zweiten POST aus
- [ ] **Step 2: Tests ausführen.** Run: `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/features/bill/services/bill-context.service.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Service und Komponente umsetzen.**
- [ ] **Step 4: Tests erneut ausführen.** Erst die Tests aus Step 2, dann die komplette Suite. Run: `npx ng build`. Expected: PASS, Build ok.

### Task 9: Analyse im Frontend (AC1–AC4) · UI

**Files:**
- Modify: `MC/src/app/api/shopping/bill-api.service.ts` (`uploadForAnalysis`, neu `downloadAnalyzedBillImage`)
- Modify: `MC/src/app/api/shopping/dtos/BillAnalyzedDto.ts`
- Create: `MC/src/app/features/bill-analysis/functions/analyzed-bill-functions.ts`
- Create: `MC/src/app/features/bill-analysis/functions/analyzed-bill-functions.spec.ts`
- Modify: `MC/src/app/features/bill-analysis/modules/add-bill-for-analysis/add-bill-for-analysis.component.ts`
- Modify: `MC/src/app/features/bill-analysis/modules/analyzed-bill/analyzed-bill-list-item/*`
- Modify: `MC/src/app/features/bill-analysis/modules/analyzed-bill-details/*`
- Modify: `MC/src/app/features/bill-analysis/modules/analyzed-bill-image/**` (Dialog lädt über den neuen Endpoint)

**Interfaces:**
- Consumes:
  - Backend aus Task 3
  - `compressImage` aus Task 7
  - `openInformationSnackbar` aus Task 5
- Produces:
  - `BillApiService.uploadForAnalysis(file: File): Observable<void>`: `POST …/bill/upload-for-analysis`, FormData-Feld `file`.
  - `BillApiService.downloadAnalyzedBillImage(id: string)`: wie `downloadImage`, Pfad `bill/analyzed/{id}/image`.
  - `BillAnalyzedDtoBase { id; categoryId?: string; subCategoryId?: string; shopName?: string; price?: number; confidence?: number | null; totalAmountConfidence?: number | null; imageAvailable: boolean; lineItems: AnalyzedBillLineItemDto[] }`
  - `AnalyzedBillLineItemDto { description?: string; totalPrice?: number; quantity?: number; unitPrice?: number }`
  - `BillAnalyzedResponseDto*` und `mapBillAnalyzedResponseDtoRaw` werden entfernt.
  - `resolveAnalyzedCategory(categories: CategoryDto[], categoryId?: string, subCategoryId?: string): { category?: CategoryDto; subCategory?: SubCategoryDto }`
  - `confidencePercent(confidence?: number | null): number | null` → `Math.round(confidence * 100)`, bei `null`/`undefined`/`NaN` → `null`.
- UI und Texte:
  - Unbekannte oder fehlende Kategorie: Name „Keine Kategorie“, Punktfarbe `grey`.
  - Konfidenz-Zeile in den Details: `k` „Analyse-Konfidenz“, `v` „{{ n }} %“. Die Zeile wird ausgeblendet, wenn `confidencePercent` `null` ist.
  - Upload-Ablauf:
    - Vor dem Upload `compressImage(selectedFile)`.
    - Erfolg: `openInformationSnackbar('Foto wird analysiert. Das Ergebnis erscheint in wenigen Minuten unter Rechnungen oder Analyse.', snackbar, { duration: 6000 })`. Danach Auswahl und Vorschau zurücksetzen.
    - Fehler: `openErrorSnackbar('Foto konnte nicht hochgeladen werden.', snackbar)`.

- [ ] **Step 1: Failing Tests schreiben** in `analyzed-bill-functions.spec.ts`:
  - `resolves category and subcategory by id`
  - `returns undefined category for unknown id`
  - `confidencePercent rounds 0.874 to 87`
  - `confidencePercent returns null for null, undefined and NaN`
- [ ] **Step 2: Tests ausführen.** Run: `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/features/bill-analysis/functions/analyzed-bill-functions.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Umsetzen.**
  - API-Methoden, DTO und Funktionen.
  - Listen-Item und Details lösen die Kategorie über `BillCategoryContextService.categories()` und `resolveAnalyzedCategory` auf.
  - Upload-Komponente nutzt die Snackbar-Funktionen statt `snack.open`.
  - Alle Template-Stellen, die `category.color`, `notes` oder `analysisConfidence` lesen, umstellen.
- [ ] **Step 4: Tests erneut ausführen und Build prüfen.** Erst die Tests aus Step 2, dann die komplette Suite. Run: `npx ng build`. Expected: PASS, Build ok, keine Template-Fehler.

### Task 10: `byId`-Observables in den Kontext-Services (AC13, AC14 Daten)

**Files:**
- Modify: `MC/src/app/features/budgetplan/services/fixed-cost-context.service.ts`
- Modify: `MC/src/app/features/budgetplan/services/income-context.service.ts`
- Modify: `MC/src/app/features/work/services/person-context.service.ts`
- Modify: `MC/src/app/services/bill-category-context.service.ts`
- Modify: `MC/src/app/features/bill-analysis/services/analyzed-bill-context.service.ts`
- Modify: `MC/src/app/features/bill/services/bill-context.service.ts`
- Modify: `MC/src/app/api/shopping/bill-api.service.ts` (`getBill`)
- Create: `MC/src/app/features/budgetplan/services/fixed-cost-context.service.spec.ts`
- Modify: `MC/src/app/features/bill/services/bill-context.service.spec.ts`

**Interfaces:**
- Produces: Jede dieser Methoden emittiert genau einmal und completed dann. Bei nicht gefunden oder fehlgeschlagenem Laden emittiert sie `undefined`.
  - `FixedCostContextService.byId(id: string): Observable<FixedCostDto | undefined>`
  - `IncomeContextService.byId(id: string): Observable<IncomeDto | undefined>`
  - `PersonContextService.byId(id: string): Observable<PersonDto | undefined>`
  - `BillCategoryContextService.categoryById(id: string): Observable<CategoryDto | undefined>`
  - `AnalyzedBillContextService.byId(id: string): Observable<BillAnalyzedDto | undefined>`
  - `BillContextService.loadBillById(id: string): Observable<BillDto | undefined>`: erst in der geladenen Liste suchen, sonst `BillApiService.getBill(id)`. 404 oder Fehler → `undefined`.
  - `BillApiService.getBill(id: string): Observable<BillDto>`: `GET …/bill/{id}`, gemappt mit `mapBillDtoRaw` (bzw. dem bestehenden Mapper).
- Umsetzung:
  - Jeder Listen-Service bekommt ein privates `loadState$ = new ReplaySubject<'loaded' | 'failed'>(1)`, das in seinem `fetch…` bei Erfolg `'loaded'` und bei Fehler `'failed'` emittiert.
  - `byId = loadState$.pipe(take(1), map(() => this.getById(id)))`.
  - Die bestehenden `getById`-Methoden bleiben.

- [ ] **Step 1: Failing Tests schreiben**
  - `fixed-cost-context.service.spec.ts`:
    - `byId waits for initial load`: API-Antwort per `Subject` verzögert → vor der Antwort keine Emission, danach das richtige Objekt.
    - `byId emits undefined when initial load fails`
    - `byId emits undefined for unknown id`
  - `bill-context.service.spec.ts`:
    - `loadBillById falls back to api`: Liste leer → `getBill` aufgerufen, Ergebnis geliefert.
    - `loadBillById emits undefined on 404`
- [ ] **Step 2: Tests ausführen.** Run: `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/features/budgetplan/services/fixed-cost-context.service.spec.ts --include src/app/features/bill/services/bill-context.service.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Umsetzen in allen sechs Services.** Das Muster ist für alle gleich, Tests gibt es exemplarisch für Fixkosten und Rechnungen.
- [ ] **Step 4: Tests erneut ausführen.** Expected: PASS. Run: `npx ng build`. Expected: Erfolg.

### Task 11: Detailseiten warten auf Daten (AC13, AC14) · UI

**Files:**
- Modify: `MC/src/app/shared/utils/routing-helper.ts`
- Modify: `MC/src/app/features/bill/modules/bill-details/bill-details.component.{ts,html}`
- Modify: `MC/src/app/features/budgetplan/modules/fixed-cost/fixed-cost-details/fixed-cost-details.component.{ts,html}`
- Modify: `MC/src/app/features/budgetplan/modules/income/income-details/income-details.component.{ts,html}`
- Modify: `MC/src/app/features/work/modules/person/person-details/person-details.component.{ts,html}`
- Modify: `MC/src/app/features/settings/modules/categories/category-item-details/category-item-details.component.{ts,html}`
- Modify: `MC/src/app/features/bill-analysis/modules/analyzed-bill-details/analyzed-bill-details.component.{ts,html}`
- Create: `MC/src/app/features/budgetplan/modules/fixed-cost/fixed-cost-details/fixed-cost-details.component.spec.ts`

**Interfaces:**
- Consumes: `byId`, `categoryById`, `loadBillById` aus Task 10.
- Produces: `leaveDetailNotFound(router: Router, snackbar: MatSnackBar, listUrl: string): void`. Die Funktion zeigt `openInformationSnackbar('Eintrag wurde nicht gefunden.', snackbar)` und navigiert per `navigateByUrl(listUrl)`.
- Ziel-URLs:
  - Rechnung `/bill/list`
  - Fixkosten `/budgetplan/fixedcost`
  - Einkommen `/budgetplan/income`
  - Person `/work/person`
  - Kategorie `/settings/categories`
  - analysierte Rechnung `/analyzed/list`
- Komponentenmuster:
  - Kein `throw` im Konstruktor. Die ID wird wie bisher gelesen, fehlt sie, gilt das als „nicht gefunden“.
  - In `ngOnInit` wird das `byId`-Observable abonniert (`takeUntil(destroy$)`):
    - Mit Treffer: Objekt, Formular (`form.disable()`), Seitentitel und Header-Aktion setzen und die übrigen Subscriptions starten.
    - Ohne Treffer: `leaveDetailNotFound`.
  - Felder wie `bill`, `fixedCost`, `person` werden optional (`?`) oder per `*ngIf="… as x"` abgesichert.
  - Bis zum Treffer zeigt `progress-slot` eine `mat-progress-bar mode="indeterminate"`, der Inhalt steht unter `*ngIf`.
  - Bei `person-details` setzt die Persons-Subscription aus Task 6 auf denselben Mechanismus auf.

- [ ] **Step 1: Failing Tests schreiben** in `fixed-cost-details.component.spec.ts` (Kontext-Service als Spy mit `byId` als `Subject`, Router- und Snackbar-Spy, `ActivatedRoute` mit `id`):
  - `shows progress until data arrives`: `.progress-slot mat-progress-bar` vorhanden, kein Formular.
  - `renders entry after load`: `byId` emittiert → Name im Template, kein Fortschrittsbalken.
  - `navigates to list when entry not found`: `byId` emittiert `undefined` → `router.navigateByUrl('/budgetplan/fixedcost')`, Snackbar geöffnet.
  - `does not throw without loaded data`: Komponente erzeugen, bevor `byId` emittiert → kein Fehler.
- [ ] **Step 2: Tests ausführen.** Run: `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/features/budgetplan/modules/fixed-cost/fixed-cost-details/fixed-cost-details.component.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Muster in allen sechs Komponenten umsetzen.**
- [ ] **Step 4: Tests erneut ausführen und Build prüfen.** Erst die Tests aus Step 2, dann die komplette Suite. Run: `npx ng build`. Expected: PASS, Build ok.

### Task 12: Speicherfehler lassen Formulare bearbeitbar (AC15) · UI

**Files:**
- Modify: `MC/src/app/features/settings/modules/categories/create-category/create-category.component.{ts,html}`
- Modify: `MC/src/app/features/settings/modules/categories/category-item-details/category-item-details.component.ts`
- Modify: `MC/src/app/features/budgetplan/modules/fixed-cost/fixed-cost-details/fixed-cost-details.component.ts`
- Modify: `MC/src/app/features/budgetplan/modules/income/income-details/income-details.component.ts`
- Modify: `MC/src/app/features/work/modules/person/person-details/person-details.component.ts`
- Modify: `MC/src/app/features/work/modules/person/work-entry-details/work-entry-details-dialog.component.ts`
- Prüfen und ggf. Modify: `create-fixed-cost.component.ts`, `create-income.component.ts`, `add-person.component.ts`, `add-working-entry.component.ts`, `bill-details.component.ts`
- Modify: `MC/src/app/features/bill/services/bill-context.service.ts` (`updateBill` Rückfall)
- Test: `fixed-cost-details.component.spec.ts` (aus Task 11 erweitern), `bill-context.service.spec.ts`

**Interfaces:**
- Fehlerzweig jeder Speichern-Methode:
  - `isSaving = false`, `isEditing = true`, `form.enable()`. Die Eingaben bleiben stehen.
  - Fehler-Snackbar wie bisher.
- Erfolgszweig:
  - Das Referenzobjekt (`this.fixedCost`, `this.income`, `this.person`, `this.category`, Eintrag im Dialog) übernimmt die gespeicherten Werte.
  - „Abbrechen“ setzt das Formular auf dieses Objekt zurück.
- `BillContextService.updateBill`: Werte der Rechnung vor dem optimistischen Update merken und bei Fehler wiederherstellen.
- `create-category`: kein doppeltes `[disabled]`-Binding. Gesperrt wird nur über den Formularstatus bzw. `isSaving`, bei Fehler `form.enable()`.
- Texte:
  - `work-entry-details-dialog.component.ts`: „Person konnte nicht gespeichert werden.“ → „Arbeitszeit konnte nicht gespeichert werden.“
  - `income-details.component.ts`: „Fixkostenpunkt konnte nicht gelöscht werden.“ → „Einkommen konnte nicht gelöscht werden.“

- [ ] **Step 1: Failing Tests schreiben**
  - `fixed-cost-details.component.spec.ts`:
    - `keeps form editable with entered values after save error`: `updateFixedCost` → `throwError`, Name auf „Neu“ geändert und gespeichert → `form.enabled`, `isEditing === true`, Name-Wert ist „Neu“.
    - `cancel after successful save restores saved values`: Speichern mit „Neu“ erfolgreich, dann bearbeiten, „Anders“ eintippen, Abbrechen → Wert ist „Neu“.
  - `bill-context.service.spec.ts`:
    - `updateBill restores previous values on error`
- [ ] **Step 2: Tests ausführen.** Run: `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/features/budgetplan/modules/fixed-cost/fixed-cost-details/fixed-cost-details.component.spec.ts --include src/app/features/bill/services/bill-context.service.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Muster in allen genannten Komponenten umsetzen.**
- [ ] **Step 4: Tests erneut ausführen und Build prüfen.** Erst die Tests aus Step 2, dann die komplette Suite. Run: `npx ng build`. Expected: PASS, Build ok.

### Task 13: Gesamtprüfung

**Files:** keine neuen. Ggf. Korrekturen aus den Prüfungen.

- [ ] **Step 1: Backend.** Run: `dotnet build Andaha.sln`, `dotnet test src/Services/Shopping/Andaha.Services.Shopping.Tests`, `dotnet test src/Services/Work/Andaha.Services.Work.Tests`. Expected: Build ok, alle Tests PASS.
- [ ] **Step 2: Frontend.** In `MC`: `npx ng test --watch=false --browsers=ChromeHeadless` und `npx ng build --configuration production`. Expected: alle PASS, Build ok, keine neuen Budget-Warnungen.
- [ ] **Step 3: Restsuche.** Sie muss jeweils leer sein, außer dem Endpoint selbst:
  - `snack.open(` bzw. `snackbar.open(` in `MC/src`
  - `throw new Error(".*is not available` in den Detailkomponenten
  - `'Bills|New'` außerhalb der Migration
  - `bill/analyze'` (ohne `-`) im Frontend
