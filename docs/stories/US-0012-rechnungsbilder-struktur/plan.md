# US-0012 Rechnungsbilder strukturiert ablegen – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rechnungsbilder liegen in Azure unter `bills/{UserId}/{yyyy}/{MM}/…` bzw. `bills/{UserId}/offen/…`, damit Synology Cloud Sync sie strukturiert aufs NAS spiegelt.

**Architecture:**
- Eine reine Klasse `BillImagePath` baut die Pfade, und `ImageFileType` erkennt die Endung.
- `IImageRepository` bekommt einen Content-Type beim Upload und eine Kopierfunktion.
- Alle Schreibwege nutzen die neuen Pfade. `UpdateBill` verschiebt bei geändertem Pfad, und `UploadBillImage` löscht ein ersetztes Bild.
- Ein Hintergrunddienst migriert alte Namen wiederholbar in Stapeln.

**Tech Stack:** .NET 10, EF Core 10 (SQL Server, Tests mit SQLite in-memory), Azure.Storage.Blobs 12.30, xUnit, NSubstitute.

**Spec:** [design.md](./design.md), Story: [story.md](./story.md)

Abkürzungen: `SH` = `src/Services/Shopping/Andaha.Services.Shopping`, `SHT` = `src/Services/Shopping/Andaha.Services.Shopping.Tests`.

**UI:** kein Task berührt das Frontend. Phase 4 (Playwright) entfällt, stattdessen gibt es einen manuellen lokalen Check (Dateisystem-Repository).

## Global Constraints

- **Pfade unter `bills/`, exakt:**
  - Rechnung: `{UserId}/{yyyy}/{MM}/{yyyy-MM-dd}_{Shop}_{BillId}-{n}.{ext}`
  - Scan: `{UserId}/offen/{yyyy-MM-dd_HH-mm-ss}_{AnalyzedBillId}-1.{ext}`
  - GUIDs im Format `D`, kleingeschrieben.
  - Trenner ist immer `/`. Kein `Path.Combine` für Blob-Namen, denn unter Windows entstünde `\`.
- **`BillImage.Name`** speichert den Pfad **ohne** `bills/`. Ein alter Name ist erkennbar daran, dass er kein `/` enthält.
- **Shop-Slug:**
  - `ä→ae ö→oe ü→ue Ä→Ae Ö→Oe Ü→Ue ß→ss`, sonstige Diakritika entfernen (FormD und NonSpacingMark).
  - Erlaubt `[A-Za-z0-9-]`. Leerzeichen und Folgen anderer Zeichen werden zu genau einem `-`, Bindestriche am Rand entfallen.
  - Höchstens 40 Zeichen, nach dem Kürzen kein `-` am Ende. Leer ergibt `Unbekannt`.
- **Endungen nach den ersten Bytes:**
  - JPEG `FF D8 FF` → `.jpg`, `image/jpeg`
  - PNG `89 50 4E 47` → `.png`, `image/png`
  - WebP `RIFF????WEBP` → `.webp`, `image/webp`
  - HEIC/HEIF `????ftyp` mit Marke `heic|heix|hevc|heim|heis|mif1|msf1` → `.heic`, `image/heic`
  - PDF `%PDF` → `.pdf`, `application/pdf`
  - sonst `.bin`, `application/octet-stream`, dazu eine Log-Warnung
- **Datum:** `Bill.Date` als reines Datum ohne Zeitzonen-Umrechnung. Scan-Zeitstempel ist `AnalyzedBill.CreatedAt` (UTC).
- **Benutzerordner:** `Bill.UserId` bzw. `AnalyzedBill.UserId`.
- **Ein Bild pro Rechnung** (bestehende Regel), `{n}` bleibt bei der bisherigen Logik.
- **Bibliotheks-APIs** (Azure.Storage.Blobs: Upload mit `BlobHttpHeaders.ContentType`, Kopie innerhalb des Containers; EF Core `ExecuteUpdateAsync`) per Context7 nachschlagen, nicht aus dem Gedächtnis.
- **Code-Arbeit:** Bestehenden Code mit Serena lesen und ändern (`.claude/rules/serena.md`).
- **Gates je Task:**
  - `dotnet test src/Services/Shopping/Andaha.Services.Shopping.Tests/Andaha.Services.Shopping.Tests.csproj` grün (7 bekannte übersprungene Azure-Tests).
  - `dotnet build src/Services/Monolith/Andaha.Services.Monolith/Andaha.Services.Monolith.csproj` mit 0 Fehlern.
  - Restore-Hinweis: Der private Feed `andaha-feed` liefert hier 401. Restore mit einer Scratch-NuGet-Config (nuget.org und `%USERPROFILE%/.nuget/packages`) per `dotnet restore --configfile …`, danach `--no-restore`. Nie Projekt-Referenzen oder die NuGet.Config des Users ändern.

## Review Focus

1. **Shopname mit Sonderzeichen:** Ein Name wie „Müller & Söhne / Filiale 3“ ergibt einen gültigen Pfad ohne zusätzliche Unterordner. Test in Task 1.
2. **Umzug ohne Pfadänderung:** Ein Shop, der zum selben Slug führt, z. B. „Billa Plus“ und „Billa  Plus!“ (beide `Billa-Plus`), löst keinen Umzug aus. Test in Task 4. Der Slug behält die Groß- und Kleinschreibung: Eine reine Änderung von „Billa plus“ auf „Billa Plus“ verschiebt das Bild. Das ist so gewollt.
3. **Scheiternde Kopie beim Umzug:** Rechnung und Name bleiben unverändert, der Client bekommt einen Fehler. Test in Task 4.
4. **Zweiter Migrationslauf:** Er tut nichts, und eine parallele Instanz verursacht keine Fehler. Gewährleistet wird das über die bedingte Aktualisierung und ein tolerantes Löschen. Test in Task 5.
5. **Nicht seekbarer Upload-Stream:** Die Typerkennung liest nur die ersten Bytes und setzt den Stream zurück. Bei einem nicht seekbaren Stream wird vorher gepuffert. Test in Task 1 oder 3.

---

### Task 1: Pfade und Dateityp

**Files:**
- Create:
  - `SH/Infrastructure/ImageRepositories/Image/BillImagePath.cs`
  - `SH/Infrastructure/ImageRepositories/Image/ImageFileType.cs`
- Modify: `SH/Core/BillImage.cs` (Methode `Rename(string newName)`, setzt `Name`)
- Test:
  - `SHT/Bill/BillImagePathTests.cs`
  - `SHT/Bill/ImageFileTypeTests.cs`

**Interfaces (Produces):**
- `static string BillImagePath.ShopSlug(string? shopName)`
- `static string BillImagePath.ForBill(Guid userId, DateTime date, string? shopName, Guid billId, int number, string extension)`
- `static string BillImagePath.ForScan(Guid userId, DateTime createdAtUtc, Guid analyzedBillId, string extension)`
- `static bool BillImagePath.IsLegacy(string name)`, wahr genau dann, wenn kein `/` enthalten ist.
- `static string BillImagePath.ExtensionOf(string name)`, inklusive Punkt bzw. leer bei alten Namen.
- `record ImageFileType(string Extension, string ContentType)`
- `static ImageFileType ImageFileType.Detect(ReadOnlySpan<byte> header)`
- `static Task<ImageFileType> ImageFileType.DetectAsync(Stream seekableStream, CancellationToken ct)`: liest höchstens 16 Bytes und setzt `Position` zurück.
- `ImageFileType.Unknown` (`.bin`) ist eine statische Instanz.

- [ ] **Step 1: Failing tests:**
  - **Slug:**
    - „Billa Plus“ → `Billa-Plus`
    - „Müller & Söhne / Filiale 3“ → `Mueller-Soehne-Filiale-3`
    - „  “ und `null` → `Unbekannt`
    - „Café Crème“ → `Cafe-Creme`
    - „Straße“ → `Strasse`
    - 60 Zeichen → genau 40 Zeichen, ohne `-` am Ende
    - „--A--“ → `A`
  - **Pfade:**
    - `ForBill(u, 2026-11-06, "Billa Plus", b, 1, ".jpg")` ergibt `"{u}/2026/11/2026-11-06_Billa-Plus_{b}-1.jpg"` (GUIDs klein, Format `D`).
    - `ForScan(u, 2026-11-08T09:14:03Z, a, ".png")` ergibt `"{u}/offen/2026-11-08_09-14-03_{a}-1.png"`.
  - **Hilfsfunktionen:**
    - `IsLegacy("abc-1")` ist wahr, `IsLegacy("u/2026/…")` falsch.
    - `ExtensionOf` liefert für einen neuen Namen die Endung, für einen alten `""`.
  - **Typerkennung:**
    - Je Format aus den Global Constraints ein Header-Beispiel ergibt die richtige Endung und den richtigen Content-Type.
    - Unbekannte Bytes und ein leeres Array ergeben `.bin`.
    - `DetectAsync` lässt die Position eines MemoryStreams auf 0.
- [ ] **Step 2:** `dotnet test` (Shopping) → FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** `dotnet test` → PASS.
- [ ] **Step 5:** Commit `feat(shopping): structured bill image paths and file type detection (US-0012)`.

### Task 2: Repository – Content-Type und Kopie

**Files:**
- Modify:
  - `SH/Infrastructure/ImageRepositories/Image/IImageRepository.cs`
  - `SH/Infrastructure/ImageRepositories/Image/AzureStorageImageRepository.cs`
  - `SH/Infrastructure/ImageRepositories/Image/FileSystemImageRepository.cs`
  - `SH/Infrastructure/AzureBlobStorage/BlobStorageService.cs` bzw. `IBlobStorageService.cs`, falls nötig
- Test: `SHT/Bill/FileSystemImageRepositoryTests.cs` (neu)

**Interfaces (Produces):**
- `Task UploadImageAsync(string name, Stream imageStream, string? contentType = null, CancellationToken ct = default)`. Bestehende Aufrufer bleiben kompilierbar, die Reihenfolge der Parameter ist dafür ggf. anzupassen.
- `Task CopyImageAsync(string sourceName, string targetName, CancellationToken ct = default)`: überschreibt ein vorhandenes Ziel und übernimmt den Content-Type der Quelle. Fehlt die Quelle, wirft sie eine definierte Exception, z. B. `FileNotFoundException`.
- `Task DeleteImageAsync(...)`: bleibt, ein fehlender Blob bzw. eine fehlende Datei ist kein Fehler (falls heute anders, angleichen).
- Blob-Pfad ist `"bills/" + name` per String-Verkettung mit `/`. Bisher war es `Path.Combine`, das unter Windows `\` erzeugt.
- Das Dateisystem-Repository legt Unterordner an (`Directory.CreateDirectory` für den Zielordner) und bildet `name` mit `/` auf den lokalen Pfad ab.

- [ ] **Step 1: Failing tests** für das Dateisystem-Repository, in einem temporären Arbeitsverzeichnis:
  - Upload unter `u/2026/11/x.jpg` legt die Unterordner an, das Lesen liefert dieselben Bytes.
  - `CopyImageAsync` legt die Kopie an, die Quelle bleibt.
  - Ein fehlendes Löschziel wirft nicht.
  - Eine fehlende Kopierquelle wirft die definierte Exception.
- [ ] **Step 2:** `dotnet test` → FAIL.
- [ ] **Step 3:** Implementieren. Die Azure-Seite schlägt per Context7 nach, wie Upload mit Content-Type und Kopie innerhalb desselben Accounts gehen (z. B. Download und Upload oder `SyncCopyFromUri` bzw. `StartCopyFromUri` mit Abwarten). Dabei auf Robustheit achten, nicht auf Geschwindigkeit. Die übersprungenen Azure-Storage-Tests bleiben übersprungen.
- [ ] **Step 4:** `dotnet test` → PASS. `dotnet build` (Monolith) → 0 Fehler.
- [ ] **Step 5:** Commit `feat(shopping): image repository copies and stores content type (US-0012)`.

### Task 3: Schreibwege nutzen die neuen Pfade

**Files:**
- Modify:
  - `SH/Requests/Bill/AnalyzeBill/BillAnalysisProcessor.cs` (Rechnung und Scan)
  - `SH/BackgroundJobs/FailedAnalysisImageHandler.cs` (Scan)
  - `SH/Requests/Bill/UploadBillImage/V1/UploadBillImageCommandHandler.cs` (Rechnung, ersetzt das vorhandene Bild)
- Test:
  - `SHT/BackgroundJobs/ImmediateAnalysisTests.cs`
  - `SHT/BackgroundJobs/FailedAnalysisImageHandlerTests.cs`
  - neu `SHT/Bill/UploadBillImageTests.cs` (oder eine vorhandene passende Datei)

**Interfaces (Consumes):** `BillImagePath`, `ImageFileType` (Task 1), `UploadImageAsync(name, stream, contentType)` und `DeleteImageAsync` (Task 2).

- [ ] **Step 1: Failing tests:**
  - **Automatisch angelegte Rechnung:** Der gespeicherte `BillImage.Name` ist `ForBill(owner, date, shop, billId, 1, ".jpg")` bei JPEG-Testbytes. Das Repository bekam denselben Namen und `image/jpeg`.
  - **Scan aus Prozessor und Failed-Handler:** Der Name ist `ForScan(owner, analyzedBill.CreatedAt, id, ext)`.
  - **Upload an eine Rechnung ohne Bild:** neuer Pfad.
  - **Upload an eine Rechnung mit Bild:**
    - Der alte Blob wird **nach** dem Speichern gelöscht, auch bei einem anderen Namen, z. B. PNG statt JPEG.
    - In der Datenbank steht genau ein Bild mit dem neuen Namen.
    - Scheitert das Löschen, ist das Ergebnis trotzdem Erfolg, und es wird eine Warnung geloggt.
  - **Nicht seekbarer Stream** beim Upload: wird gepuffert, Typ korrekt erkannt.
- [ ] **Step 2:** `dotnet test` → FAIL.
- [ ] **Step 3:** Implementieren. Den Typ vor dem Upload erkennen, mit `.bin` als Fallback und einer Warnung.
- [ ] **Step 4:** `dotnet test` → PASS.
- [ ] **Step 5:** Commit `feat(shopping): new bill and scan images use structured paths (US-0012)`.

### Task 4: Umzug bei geändertem Datum oder Shop

**Files:**
- Modify: `SH/Requests/Bill/UpdateBill/V1/UpdateBillCommandHandler.cs`, ggf. eine kleine Hilfsklasse `SH/Requests/Bill/BillImageMover.cs`
- Test: `SHT/Bill/BillImageMoveTests.cs` (neu, Muster wie `BillUpdateTests.cs`)

**Interfaces (Consumes):** `BillImagePath`, `CopyImageAsync`, `DeleteImageAsync`, `BillImage.Rename`.

**Ablauf:**
1. Die Bilder der Rechnung laden.
2. Ist `request.Image` gesetzt, findet kein Umzug statt. Das neue Bild läuft über `UploadBillImage`, das das alte löscht (Task 3).
3. Sonst wird je Bild der Zielpfad aus den neuen Daten mit der Endung des bisherigen Namens berechnet. Alte Namen ohne Endung überspringen; die migriert Task 5.
4. Weicht der Pfad ab: kopieren, dann `Rename`. Scheitert eine Kopie, wird **nicht** gespeichert und ein Fehler zurückgegeben (z. B. 500 bzw. Problem-Result wie im Projekt üblich).
5. `SaveChangesAsync`.
6. Danach die alten Blobs löschen. Scheitert das, gibt es eine Warnung, und die Antwort bleibt Erfolg.

- [ ] **Step 1: Failing tests:**
  - Datum von 2026-10-30 auf 2026-11-02: Kopie von alt nach `…/2026/11/2026-11-02_…`, der Name in der Datenbank ist neu, der alte Blob ist gelöscht.
  - Nur der Shop ändert sich: Umzug.
  - Nur der Preis ändert sich: kein Kopieren, kein Löschen.
  - Shop „Billa Plus“ → „Billa  Plus!“ (gleicher Slug): kein Umzug.
  - Kopie wirft: Rechnung unverändert in der Datenbank, Name unverändert, kein Löschen, Fehler-Result.
  - Mit `request.Image`: kein Kopieren. Das Upload-Command läuft, der alte Blob wird gelöscht (über Task 3).
  - Alter Name ohne `/`: kein Umzug.
- [ ] **Step 2:** `dotnet test` → FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** `dotnet test` → PASS.
- [ ] **Step 5:** Commit `feat(shopping): move bill images when date or shop changes (US-0012)`.

### Task 5: Migration bestehender Bilder

**Files:**
- Create: `SH/BackgroundJobs/BillImageMigrationService.cs` (`BackgroundService`), ggf. `SH/BackgroundJobs/BillImageMigrator.cs` mit der testbaren Logik
- Modify: `SH/ProgramExtensions.cs` (`AddHostedService<BillImageMigrationService>()` neben den anderen)
- Test: `SHT/BackgroundJobs/BillImageMigrationTests.cs`

**Interfaces (Produces):** `Task<int> BillImageMigrator.MigrateBatchAsync(int batchSize, CancellationToken ct)` liefert die Zahl der migrierten Bilder.

**Ablauf:**
- Der Dienst ruft `MigrateBatchAsync(50, …)` in einer Schleife auf, bis 0 zurückkommt. Jeder Durchlauf läuft in einem eigenen Scope bzw. DbContext.
- Fehler loggt er und versucht es beim nächsten Start erneut. Er wartet beim Start nicht blockierend.
- Ein Stapel nimmt `BillImage` mit `!Name.Contains("/")`, zusammen mit Rechnung (UserId, Date, ShopName) bzw. Scan (UserId, CreatedAt).
- Je Bild:
  1. Blob lesen. Fehlt er, Warnung, überspringen. Damit die Schleife endet, werden übersprungene IDs in diesem Lauf gemerkt und ausgeschlossen.
  2. Typ erkennen und Zielpfad bauen.
  3. `CopyImageAsync`, den Content-Type über einen erneuten Upload mit Typ setzen oder die Kopie den Typ setzen lassen; die Implementierung wählt.
  4. Bedingte Aktualisierung: `ExecuteUpdateAsync … where Id == x && Name == old`.
  5. Alten Blob löschen, ein fehlender Blob ist ok.
- Bilder ohne Rechnung und ohne Scan (verwaist): überspringen mit Warnung.

- [ ] **Step 1: Failing tests** (SQLite, Dateisystem-Repository in einem Temp-Ordner oder Fake):
  - Zwei alte Rechnungsbilder und ein altes Scan-Bild werden migriert. Die Namen sind neu, Blobs liegen am neuen Ort, die alten sind weg, die Rückgabe ist 3.
  - Ein zweiter Lauf liefert 0 und tut nichts.
  - Ein fehlender alter Blob wird übersprungen, der Name bleibt, die Schleife endet.
  - Die bedingte Aktualisierung lässt einen inzwischen geänderten Namen unverändert. Simulation: den Namen vor der Aktualisierung umbenennen.
- [ ] **Step 2:** `dotnet test` → FAIL.
- [ ] **Step 3:** Implementieren und registrieren.
- [ ] **Step 4:** `dotnet test` → PASS. `dotnet build` (Monolith) → 0 Fehler.
- [ ] **Step 5:** Commit `feat(shopping): migrate existing bill images to the structured layout (US-0012)`.

## Danach (Controller)

- Whole-Branch-Review.
- **Manueller lokaler Check statt Playwright:**
  1. Monolith lokal starten (Dateisystem- oder Azurite-Repository, je nach Konfiguration).
  2. Prüfen, dass die Migration vorhandene Bilder verschiebt.
  3. Eine Rechnung mit Foto anlegen, Datum ändern, Ordnerstruktur ansehen.
  4. In der App das Bild weiterhin anzeigen lassen.
- `cost-tracking`, Story auf „In Review“.
