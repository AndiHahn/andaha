# Design US-0005: Bugfixes aus dem Review

Story: [story.md](./story.md). Quelle der Befunde: [`docs/review.md`](../../review.md) und das Review-Gespräch vom 2026-11-02.

Pfadkürzel: `MC` = `src/WebApps/MiniClient/Andaha.WebApps.MiniClient/src/app`, `SH` = `src/Services/Shopping/Andaha.Services.Shopping`, `WK` = `src/Services/Work/Andaha.Services.Work`.

## Ziel und Warum

Die App wird fast nur als PWA am Handy benutzt, oft unterwegs und mit schlechtem Netz. Die sieben Fehler führen dazu, dass Eingaben verloren gehen (Offline-Rechnungen, App-Update, Personen-Notizen), Zahlen falsch sind (bezahlte Stunden) oder eine Funktion gar nicht arbeitet (Analyse). Ziel ist, dass man sich auf die App verlassen kann. Neue Funktionen kommen nicht dazu.

**Ziele:** die sieben Fehler beheben, wie in den Akzeptanzkriterien beschrieben.

**Nicht-Ziele:** Analysierte Rechnung übernehmen/verwerfen, Positionen anzeigen, Zahlungen bearbeiten/löschen, alle Verbesserungen aus `docs/review.md`. Kein Redesign: Neue UI-Elemente folgen `docs/design/DESIGN.md` und den bestehenden Mustern (Klassen `kv`, `field`, `btn`, Snackbar-Funktionen aus `MC/shared/snackbar/snackbar-functions.ts`).

**Anti-Ziele:**
- Eine Rechnung wird doppelt angelegt, weil ein Analyse-Bild zweimal verarbeitet oder eine Offline-Rechnung zweimal synchronisiert wird.
- Bereits offline gespeicherte Rechnungen gehen durch die Umstellung des Speichers verloren.

## 1. Analyse

### Ist-Zustand

- Das Frontend ruft `POST bill/analyze` auf (`MC/api/shopping/bill-api.service.ts:94`). Dieser Endpoint analysiert synchron und gibt das Ergebnis zurück (`SH/Requests/Bill/AnalyzeBill/V1/AnalyzeBillCommandHandler.cs`). Es wird nichts gespeichert, das Frontend verwirft die Antwort.
- Der vorgesehene Ablauf ist asynchron:
  - `AnalyzeBillWorker` (`SH/BackgroundJobs/AnalyzeBillWorker.cs`) fragt jede Minute den Analyse-Speicher (`IAnalysisImageRepository`, Container `analysis`) nach unverarbeiteten Bildern ab.
  - Für jedes Bild veröffentlicht er eine `AnalyzeBillMessageV1` über Dapr-Pub/Sub und markiert das Bild als verarbeitet. Das gilt nur für Azure. Das Dateisystem-Repository (Development) markiert nichts, dort wird ein Bild jede Minute erneut verschickt, bis der Handler es löscht.
  - `AnalyzeBillMessageHandler` lädt das Bild samt `userId` aus dem Analyse-Speicher.
  - Bei plausiblem Ergebnis legt er eine `Bill` an (`fromAutoAnalysis: true`), sonst eine `AnalyzedBill`. Danach löscht er das Bild aus dem Analyse-Speicher.
- `upload-for-analysis` (`SH/Requests/Bill/UploadForAnalysis/V1/UploadBillForAnalysisCommandHandler.cs`) hat zwei Fehler:
  - Er lädt das Bild in `IImageRepository` hoch (normale Rechnungsbilder) statt in `IAnalysisImageRepository`, und ohne `userId`. Der Message-Handler findet das Bild deshalb nicht.
  - Er veröffentlicht die Nachricht zusätzlich selbst. Würde nur der Speicherort korrigiert, verschickte der Worker eine zweite Nachricht, und das Bild würde doppelt verarbeitet.
- Die DTOs passen nicht zusammen. Das Backend liefert `AnalyzedBillDto(Id, CategoryId, SubCategoryId, ShopName, Price, Date, LineItems)` (`SH/Requests/Bill/Dtos/V1/AnalyzedBillDto.cs`). Das Frontend erwartet `category`/`subCategory` als Objekte, `analysisConfidence` und `imageAvailable` (`MC/api/shopping/dtos/BillAnalyzedDto.ts`).
- Das Foto einer analysierten Rechnung wird über `GET bill/{id}/image` geladen. `GetBillImageQueryHandler` sucht aber nur in `dbContext.Bill` und liefert daher 404.

### Entscheidungen

- **Backend `upload-for-analysis`:**
  - Das Bild wird mit `IAnalysisImageRepository.UploadImageAsync(name, stream, userId)` gespeichert, `userId` kommt aus `IIdentityService`.
  - **Keine eigene Nachricht mehr.** Der Worker übernimmt das Verschicken, die Verzögerung beträgt höchstens etwa eine Minute. *(Meine Entscheidung: Das ist der einfachste Weg ohne Doppelverarbeitung. Die Analyse läuft ohnehin asynchron, man wartet nicht darauf.)*
  - Antwort bleibt `202 Accepted`.
- **Bildgröße:** Das Frontend verkleinert das Foto vor dem Upload (siehe Abschnitt 4, gemeinsame Hilfsfunktion). Lange Kante höchstens 2000 px, JPEG-Qualität 0,85. Das spart Datenvolumen und bleibt unter typischen Größenlimits der Dokumentenanalyse. *(Meine Entscheidung. 2000 px statt 1600 px, damit Kassenbons lesbar bleiben.)*
- **Frontend Upload** (`MC/features/bill-analysis/modules/add-bill-for-analysis/`):
  - Aufruf von `POST bill/upload-for-analysis` mit Feldname `file`.
  - Nach Erfolg erscheint die Info-Snackbar „Foto wird analysiert. Das Ergebnis erscheint in wenigen Minuten unter Rechnungen oder Analyse.“ Das Formular wird zurückgesetzt.
  - Bei Fehler erscheint eine Fehler-Snackbar. Alle Snackbars laufen über `openInformationSnackbar` bzw. `openErrorSnackbar` statt `snack.open`.
  - Der Rückgabetyp ist `Observable<void>`. `BillAnalyzedResponseDto` und `mapBillAnalyzedResponseDtoRaw` entfallen, wenn sie sonst nicht genutzt werden.
- **Synchroner Endpoint `bill/analyze`** bleibt im Backend unverändert, das Frontend nutzt ihn nicht mehr. *(Meine Entscheidung: Entfernen ist kein Bugfix und könnte andere Aufrufer treffen.)*
- **Backend `AnalyzedBillDto`** bekommt zusätzlich:
  - `Confidence` (`double?`)
  - `TotalAmountConfidence` (`double?`)
  - `ImageAvailable` (`bool`, aus `Images.Any()`)

  Die Mapping-Expression (`AnalyzedBillDtoMapping`) wird erweitert, der Query-Handler lädt die Bilder dafür mit.
- **Frontend `BillAnalyzedDto`** passt sich dem Backend an:
  - Felder `categoryId`, `subCategoryId`, `confidence`, `totalAmountConfidence`, `imageAvailable`, `lineItems` (Typ anlegen, wird noch nicht angezeigt).
  - `notes` entfällt.
  - Kategorie und Unterkategorie (Name, Farbe) löst `AnalyzedBillContextService` bzw. die Komponenten über `BillCategoryContextService` auf.
  - Unbekannte Kategorie-ID: Anzeige „Keine Kategorie“, neutraler Punkt, kein Fehler.
- **Konfidenz-Anzeige:** `confidence` als Prozent ohne Nachkommastellen. Bei `null` wird die Zeile ausgeblendet. Nie „NaN“.
- **Bild der analysierten Rechnung:** neuer Endpoint `GET bill/analyzed/{id}/image`.
  - Er sucht in `dbContext.AnalyzedBill` inkl. `Images`. Nur der Ersteller darf zugreifen, analysierte Rechnungen werden nicht geteilt.
  - Er liefert das Bild aus `IImageRepository`, so wie `GetBillImageQueryHandler`.
  - Das Frontend (`analyzed-bill-image-dialog.component.ts`) ruft diesen Endpoint auf.
  - Kein DTO liefert ein Thumbnail (auch `BillDto` nicht). Die Liste zeigt bei `imageAvailable` nur das Foto-Symbol, wie bei normalen Rechnungen.
- **Paginierung der Analyse-Liste** bleibt unverändert (siehe `docs/review.md`).
- **Die Pipeline selbst bleibt unverändert** (Entscheidung Nutzer). Ihre Schwachstellen stehen in `docs/review.md`:
  - Azure: Ein Bild wird als verarbeitet markiert, bevor die Analyse erfolgreich war.
  - Dateisystem: Ein Bild wird jede Minute erneut verschickt.
- **Prüfung von AC1/AC2:** Lokal läuft kein Dapr-Sidecar. AC1/AC2 werden per Unit-Test des Upload-Handlers geprüft und vom Nutzer auf DEV getestet.

## 2. Personen-Notizen und Zahlungen

### Ist-Zustand

- `PersonDtoMapping` (`WK/Requests/Person/Dtos/V1/PersonDtoMapping.cs:12`) füllt `PersonDto.Notes` mit einem Text aus allen Zahlungen.
- Das Frontend zeigt diesen Text als „Notizen“ an. Beim Speichern schreibt `UpdatePerson` ihn als `Person.Notes` zurück.

### Entscheidungen

- **Backend `PersonDto`:**
  - `Notes` = `person.Notes`.
  - Neues Feld `Payments`: Liste aus `PaymentDto(Id, PayedAt, PayedHours: TimeSpan, PayedMoney, PayedTip, Notes)`, sortiert nach `PayedAt` absteigend.
  - `PersonDtoMapping` wird von List, Create und Update genutzt. Eine Einzelabfrage gibt es nicht.
  - **List:** Die Expression muss EF-übersetzbar bleiben (Unterabfrage mit `Select`). Das sichert ein Test mit SQLite ab. Ist sie nicht übersetzbar, wird eine Include-basierte Abfrage verwendet.
  - **Create und Update:** Beide wenden das Mapping heute im Speicher auf eine per `FindByIdAsync` geladene Person an, ohne Zahlungen und Arbeitszeiten.
    - Create: Eine neue Person hat ohnehin keine Zahlungen und Arbeitszeiten, das ist korrekt.
    - Update: Der Handler lädt die Person mit `Payments` und `WorkingEntries`, damit die Antwort stimmt. Das Frontend nutzt die Update-Antwort heute nicht, sie soll aber nicht falsch sein.
- **Betrag:** Laut Nutzer enthält `PayedMoney` das Trinkgeld bereits. Es ist der gesamt bezahlte Betrag.
- **Frontend `PersonDto`:** `payments: PaymentDto[]` mit Mapping (`payedAt` als `Date`, `payedHours` als `Time`).
- **Anzeige in der Personen-Detailseite** (`MC/features/work/modules/person/person-details/`):
  - Ein eigener Abschnitt „Zahlungen“ unter den Personendaten, je Zeile im `kv`-Stil:
    - links das Datum (`dd.MM.yyyy`) und die bezahlten Stunden (`H:mm h`)
    - rechts der Betrag (`1.2-2`, `de`, „€“) und darunter klein „davon x,xx € Trinkgeld“, nur wenn Trinkgeld > 0
  - Ohne Zahlungen erscheint „Noch keine Zahlungen.“
  - Das Feld „Notizen“ zeigt nur `notes`.
- **Neue Zahlung:** Nach erfolgreichem `payPerson` lädt `PersonContextService` die Personen neu (bzw. die betroffene Person). So stimmen bezahlte Stunden und Zahlungsliste sofort. Die lokale Addition in `person-details.component.ts:106` entfällt, ebenso die in `person-context.service.ts:122`. *(Meine Entscheidung: Neu laden statt lokal rechnen, dann ist immer nur eine Stelle für die Zahlen zuständig.)*
- **Altdaten:** Personen, die schon einmal gespeichert wurden, haben eventuell den Zahlungstext als echte Notiz in der Datenbank. Diese Daten werden nicht automatisch bereinigt (Out of Scope). Der Nutzer kann die Notiz von Hand leeren.
  - Achtung: `Person.Update` nutzt `notes ?? this.Notes`. Das Leeren muss als leerer String ankommen, nicht als `null`. *Builder prüfen*, ob das Frontend beim leeren Feld `''` sendet.

## 3. Bezahlte Stunden doppelt

Erledigt durch Abschnitt 2 (Neuladen statt doppelter lokaler Addition). Ein Unit-Test sichert ab, dass nach `addPayment` die bezahlten Stunden genau einmal erhöht sind bzw. aus der Server-Antwort stammen.

## 4. Offline-Rechnungen

### Ist-Zustand

- `BillCacheService` (`MC/features/bill/services/bill-cache.service.ts`) speichert neue Rechnungen samt Foto als Data-URL im localStorage unter `Bills|New`. Fotos aus der Kamera sind PNG (`MC/shared/utils/file-utils.ts`).
- `setItem` kann mit `QuotaExceededError` scheitern. Der Fehler geht in einem Promise unter, die Rechnung steht aber schon in der Liste.
- `BillContextService.syncNewBills()` hat keinen Fehlerzweig. `syncing$` bleibt `true`, und ein neuer Versuch kommt erst bei `backendReady` oder der nächsten neuen Rechnung.

### Entscheidungen

- **Speicher: IndexedDB statt localStorage.**
  - Eine eigene kleine Datenbank `andaha`, Object Store `pendingBills`, Key `id`, Fotos als `Blob`.
  - Umsetzung mit der nativen IndexedDB-API in einem kleinen Service, ohne neue Abhängigkeit. *(Meine Entscheidung: Für einen Store reicht ein schlanker Promise-Wrapper. Eine Bibliothek wie `idb` wäre auch möglich, ist aber eine neue Abhängigkeit.)*
- **Migration:** Beim Start des `BillCacheService` werden Einträge unter `Bills|New` aus dem localStorage nach IndexedDB übernommen, Data-URL wird zu Blob. Erst nach erfolgreichem Schreiben wird der localStorage-Schlüssel gelöscht.
- **Fotos verkleinern:**
  - Neue Hilfsfunktion `compressImage(file: Blob, maxEdge = 2000, quality = 0.85): Promise<File>` in `MC/shared/utils/`.
  - Sie skaliert per Canvas und erzeugt JPEG. Kleinere Bilder werden nur in JPEG umgewandelt.
  - Schlägt die Verkleinerung fehl, wird das Original verwendet.
  - Verwendet wird sie beim Hinzufügen einer Rechnung mit Foto, vor dem Cachen, und beim Analyse-Upload.
  - Das Backend skaliert für Thumbnails selbst und liefert Bilder als `image/png` aus. Das ändert sich nicht. *Builder prüfen*, dass der Browser ein JPEG mit diesem Content-Type trotzdem anzeigt (in der Regel ja).
- **Speicherfehler:** Schlägt das Schreiben in IndexedDB fehl, erscheint die Fehler-Snackbar „Rechnung konnte nicht gespeichert werden.“ Die Rechnung wird aus der Liste wieder entfernt und das Formular nicht geleert.
  - Dafür liefert `BillContextService.addBill` ein Promise bzw. Observable zurück. `AddBillComponent` leert das Formular erst nach Erfolg.
  - Das ist eine Ablaufänderung: Heute wird sofort geleert. Der Nutzer merkt bei Erfolg keinen Unterschied, weil das lokale Speichern schnell geht.
- **Synchronisierung:**
  - `syncNewBills()` behandelt Fehler je Rechnung. Wenn alle Versuche abgeschlossen sind, egal ob erfolgreich oder nicht, wird `syncing$` wieder `false` und die Liste neu geladen.
  - Fehlgeschlagene Rechnungen bleiben im Speicher.
  - Ein Flag verhindert parallele Sync-Läufe. Läuft schon einer, wird kein zweiter gestartet. Der bestehende `currentlySyncing`-Mechanismus wird dabei ersetzt oder beibehalten, wie es besser passt.
- **Neuer Versuch:** bei `window` `online`, bei `document` `visibilitychange` → `visible` sowie wie bisher bei `backendReady` und neuer Rechnung.
- **Doppelte Rechnungen vermeiden:** Die Rechnungs-ID wird im Client erzeugt (`generateGuid`). Kam ein früherer Upload beim Server an, die Antwort aber nicht beim Client, schickt ein erneuter Versuch dieselbe ID. Heute prüft `CreateBillCommandHandler` das nicht, es käme zu einer Primärschlüssel-Verletzung (500).
  - **Backend: `CreateBill` wird idempotent.** Existiert die ID bereits und gehört die Rechnung dem Benutzer, wird keine neue angelegt, sondern `200` mit der bestehenden Rechnung geliefert. Gehört sie einem anderen Benutzer, kommt `409`.
  - **Fehlendes Foto nachladen:** Der Handler speichert die Rechnung heute vor dem Bild-Upload. Schlägt nur der Upload fehl, existiert die Rechnung ohne Foto. Beim idempotenten Treffer gilt deshalb: Hat die bestehende Rechnung kein Bild und enthält der Request eines, wird das Bild nachgeladen. *(Meine Entscheidung.)*
  - **Frontend:**
    - `2xx` entfernt den lokalen Eintrag.
    - Andere Fehler (4xx, 5xx, Netzwerk) lassen den Eintrag gespeichert. Er wird nicht in einer Schleife wiederholt, sondern nur bei den oben genannten Auslösern.

## 5. App-Update

- **Ist:** `AppComponent.ngOnInit` ruft bei `VERSION_READY` sofort `activateUpdate()` und `document.location.reload()` auf.
- **Neu:** Bei `VERSION_READY` erscheint eine Info-Snackbar „Neue Version verfügbar“ mit der Aktion „Neu laden“, ohne Zeitlimit.
  - Ein Tipp auf die Aktion ruft `activateUpdate()` auf und lädt danach neu.
  - Wird der Hinweis nicht angetippt, aktiviert der Service Worker die neue Version beim nächsten Kaltstart ohnehin.
  - Laut Angular-Doku (SwUpdate, Context7 `/angular/angular` 15.2; die App läuft auf 14.2, die API ist dort gleich) bedeutet `VERSION_READY`, dass die neue Version zur Aktivierung durch Clients bereitsteht. `activateUpdate()` aktiviert sie.
- **Snackbar-Funktion:** Die bestehenden Snackbar-Funktionen kennen noch keine Aktion. `openInformationSnackbar` bekommt einen optionalen Parameter für Aktionstext und Dauer, oder es entsteht eine eigene Funktion. Gestaltung wie die bestehende Info-Snackbar, Aktion als Text-Button in Akzentfarbe.
- **`SwUpdate.unrecoverable`:** Hier wird ebenfalls ein Hinweis mit „Neu laden“ angezeigt (Empfehlung der Angular-Doku). *(Meine Entscheidung, kleiner Zusatz.)*

## 6. Detailseiten bei Reload oder Direktaufruf

### Ist-Zustand

Die Detailkomponenten suchen den Eintrag im Konstruktor synchron im Kontext-Service und werfen einen Fehler, wenn er fehlt. Betroffen:
- `bill-details.component.ts`
- `fixed-cost-details.component.ts`
- `income-details.component.ts`
- `person-details.component.ts`
- `category-item-details.component.ts`
- `analyzed-bill-details.component.ts`

### Entscheidungen

- **Laden abwarten:** Jede Detailseite wartet, bis ihr Kontext geladen ist, und sucht den Eintrag dann.
  - Kontext-Services ohne „geladen“-Signal bekommen eines, z. B. ein Observable, das einmal nach dem ersten erfolgreichen Laden emittiert, oder ein `loaded$`.
  - Der Builder wählt pro Service die kleinste passende Lösung.
- **Rechnungen:** Die Liste lädt nur eine Seite. Wird die Rechnung nicht in der geladenen Liste gefunden, wird sie per `GET bill/{id}` geladen (Endpoint existiert, `SH/Requests/Bill/BillEndpointExtensions.cs:54`). Dafür entsteht `BillApiService.getBill(id)`.
- **Nicht gefunden:** Navigation zur zugehörigen Liste mit der Info-Snackbar „Eintrag wurde nicht gefunden.“ Dasselbe gilt, wenn das Laden fehlschlägt.
  - Ziele: `/bill/list`, `/budgetplan/fixed-cost`, `/budgetplan/income`, `/work/person`, `/settings/categories`, `/analyzed`. Die genauen Routen prüft der Builder.
- **Bis dahin:** Ladeanzeige (`mat-progress-bar` im `progress-slot` oder Spinner wie in den Listen), kein leeres Formular, kein Fehler.
  - Formular und Seitentitel (`pageTitleService.set`) werden erst gesetzt, wenn der Eintrag da ist.
  - Template-Zugriffe auf das noch nicht geladene Objekt werden mit `*ngIf` abgesichert.
- **Technik:** keine Resolver. *(Meine Entscheidung: Resolver würden das Routing aller Bereiche anfassen. Das Warten in der Komponente ist lokaler und reicht.)*

## 7. Speicherfehler in Formularen

Betroffen:
- `create-category.component.ts`
- `category-item-details.component.ts`
- `fixed-cost-details.component.ts`
- `income-details.component.ts`
- `person-details.component.ts`
- `work-entry-details-dialog.component.ts`
- Die Create-Komponenten für Fixkosten, Einkommen und Person prüft der Builder auf dasselbe Muster.

**Einheitliches Verhalten bei Fehler:**
- `isSaving = false`.
- Das Formular wird wieder aktiviert (`form.enable()`), es bleibt bzw. kommt in den Bearbeiten-Modus (`isEditing = true`), die eingegebenen Werte bleiben stehen.
- Fehler-Snackbar wie bisher.
- „Abbrechen“ setzt auf den zuletzt **gespeicherten** Stand zurück.

**Bei Erfolg:** Das Objekt, auf das „Abbrechen“ zurücksetzt, wird auf den gespeicherten Stand aktualisiert. Das betrifft z. B. `this.category` in `category-item-details.component.ts`. So zeigt „Abbrechen“ nach einem späteren Bearbeiten nicht alte Werte.

**Optimistische Updates:** Wo ein Kontext-Service vor dem Request schon lokal ändert (z. B. `BillContextService.updateBill`), wird bei Fehler der alte Stand wiederhergestellt oder neu geladen.

**Fehltexte:**
- Bei gleicher Gelegenheit wird im Eintragsdialog „Person konnte nicht gespeichert werden.“ zu „Arbeitszeit konnte nicht gespeichert werden.“ korrigiert.
- In `income-details` wird „Fixkostenpunkt konnte nicht gelöscht werden.“ zu „Einkommen konnte nicht gelöscht werden.“ korrigiert.

Weitere Texte bleiben, wie sie sind.

## 8. Unterkategorie-Prüfung im Backend

- **Ist:** `CreateBillCommandValidator.cs:39` und `UpdateBillCommandValidator.cs:42` vergleichen `subCategory.Id == command.CategoryId` statt `command.SubCategoryId`. Damit scheitert jede Rechnung mit Unterkategorie an der Prüfung (400). Offline-Rechnungen mit Unterkategorie würden nie synchronisiert.
- **Neu:** Vergleich mit `command.SubCategoryId` in beiden Validatoren (Entscheidung Nutzer: mitbeheben).

## Tests

- **Backend Shopping:**
  - `UploadBillForAnalysisCommandHandler` speichert im Analyse-Speicher mit `userId` und veröffentlicht keine Nachricht.
  - `AnalyzedBillDto` enthält `Confidence` und `ImageAvailable`.
  - Neuer Bild-Endpoint: 404 ohne Bild, Forbid bei fremdem Benutzer.
  - `CreateBill`:
    - gleiche ID zweimal → eine Rechnung, zweite Antwort 200
    - ID gehört einem anderen Benutzer → 409
    - fehlendes Bild wird nachgeladen
  - Validatoren: Rechnung mit gültiger Unterkategorie ist gültig, mit fremder Unterkategorie ungültig.
- **Backend Work:**
  - `PersonDto.Notes` ist die echte Notiz.
  - `Payments` enthält Betrag und Trinkgeld.
  - Die List-Abfrage läuft gegen SQLite (EF-Übersetzung).
  - Update liefert korrekte Stunden.
- **Neue Testprojekte** (Entscheidung Nutzer, im Repo gibt es noch keine Backend-Tests):
  - Je ein xUnit-Projekt `Andaha.Services.Shopping.Tests` und `Andaha.Services.Work.Tests` neben dem jeweiligen Service-Projekt, aufgenommen in `Andaha.sln`.
  - `InternalsVisibleTo` im Service-Projekt, weil die Handler `internal` sind.
  - EF-Abfragen laufen gegen SQLite in-memory, damit die Übersetzbarkeit geprüft wird.
  - Abhängigkeiten wie Repositories und `IIdentityService` werden mit einem Mock-Framework ersetzt. Der Builder wählt es, z. B. NSubstitute.
  - Ob `pipeline/` die Tests ausführen soll, prüft der Builder. Eine Anpassung der Pipeline ist optional und wird im Plan benannt.
- **Frontend (Karma/Jasmine):**
  - `BillCacheService` mit IndexedDB: Speichern, Laden, Entfernen, Migration aus localStorage, Fehler beim Speichern.
  - `BillContextService.syncNewBills`: Fehler setzt `syncing` zurück, kein paralleler Lauf.
  - `compressImage`: Ergebnis JPEG, Größe begrenzt. Falls Canvas in Headless-Chrome nicht verfügbar ist, nur die Rückfalllogik testen.
  - `PersonContextService.addPayment`: kein doppeltes Zählen.
  - `AppComponent`: kein automatischer Reload bei `VERSION_READY`.
  - Eine Detailkomponente exemplarisch, ideal `bill-details` mit Fallback `getBill`: wartet auf Laden, navigiert bei „nicht gefunden“.
  - Speicherfehler: Formular wieder aktiv (exemplarisch eine Komponente).
- **Builds:** `ng build` und `ng test` im MiniClient, `dotnet build` (und `dotnet test`, falls vorhanden) für Shopping und Work.

## UI-Verifikation (Phase 4)

Mit Playwright, API per Route gemockt wie in US-0004, bei 390 × 844:
- Analyse-Upload mit Snackbar
- Analyse-Liste und -Detail mit Kategorie und Konfidenz
- Personen-Detail mit Zahlungsliste und echter Notiz
- Zahlung erfassen → Zahlen stimmen
- Offline: Rechnung anlegen bei blockierter API → bleibt erhalten → API frei → Sync
- Reload auf einer Detailseite
- Speicherfehler (API 500) → Formular bleibt bearbeitbar
- Update-Hinweis: Event simulieren, falls machbar, sonst per Unit-Test abgedeckt

## Dem Builder überlassen

- Konkrete Namen, Signaturen und Aufteilung in Dateien
- Ob das „geladen“-Signal je Kontext als `loaded$`, `ready()` oder Promise umgesetzt wird
- Genaue Snackbar-Erweiterung für Aktionen
- Reihenfolge der Umsetzung (Empfehlung: kleine, unabhängige Fixes zuerst: 3+2, 5, 7, dann 6, 4, 1)
