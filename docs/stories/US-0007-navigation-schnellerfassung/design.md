# US-0007 Design: Neue Navigation, Schnellerfassung mit Vorlagen und Rechnung scannen

Stand: 2026-11-04. Grundlage: [`story.md`](./story.md) (AC1–AC41, verbindlich), UI-Design v2 ([`docs/design/v2/README.md`](../../design/v2/README.md), Mockups und Screenshots, verbindlich), [`docs/review.md`](../../review.md) Abschnitte 1, 2, 4, 8. Setzt US-0006 (Angular 22, Standalone, Material 22 mit M2-Theme) voraus.

Markierungen: **[Nutzer]** = mit dem Nutzer abgestimmt, **[Entscheidung]** = Festlegung in diesem Design (vom Nutzer beim Lesen zu prüfen), ohne Markierung = steht so in Story oder v2-Design.

## 1. Absicht

In 97 % der Fälle öffnet man die App, um eine Rechnung einzutragen. Das soll mit wenigen Tipps gehen: Eingabezeile → Betrag → Kachel → Speichern. Dazu kommt eine Navigation, bei der jeder Bereich mit einem Tipp erreichbar ist, und ein Scan-Ablauf, der aus einem Foto ein vorbefülltes Formular macht.

**Ziele:** die vier Mockups aus v2 bei 390 px und 1440 px umsetzen, Schnellerfassung inkl. Vorlagen/Vorschlägen mit Backend, synchroner Scan, Analyse-Tab aufräumen, Worker-Fehler aus der Review beheben.

**Nicht-Ziele:** siehe Out of Scope der Story; zusätzlich **[Nutzer]** keine Seite „Foto für später hochladen“ mehr (asynchroner Upload bleibt nur im Backend bestehen und kann später wieder angebunden werden, falls die synchrone Analyse zu langsam ist).

**Anti-Ziele (wäre trotz erfüllter ACs ein Fehlschlag):** Schnellerfassung braucht mehr Tipps als v2 zeigt; Wischgeste löst beim Scrollen oder in Formularen aus; Zurück-Taste verlässt die App, obwohl ein Sheet offen ist; eine bestehende Funktion (Offline-Erfassung, Filter, Statistik) ist nach dem Umbau nicht mehr erreichbar.

**Auslieferung [Nutzer]:** ein Branch `feature/us-0007-navigation-schnellerfassung`, ein Merge am Ende.

## 2. Navigation (AC1–AC7, AC41)

### Shell
- `AppComponent` bleibt die Shell. Mobil (< 1024 px): Kopfzeile 56 px ohne Menü-Icon (Titel links, rechts Sync-Icon und Konto-Button; Detailseiten mit Zurück-Pfeil), darunter Tabs, Inhalt, ggf. Dock, unten die **Hauptleiste** (64 px) mit Rechnungen · Haushalt · Stunden · Mehr. Der `mat-sidenav` bleibt nur für Desktop (`mode="side"`); der mobile Drawer entfällt.
- Desktop (≥ 1024 px): Sidebar nach `04-shortcut-desktop` (Rechnungen, Haushalt, Stunden, Gruppe „Mehr“ mit Kategorien, Vorlagen, Verbindungen, Export, Rechtliches unten). Tabs unter dem Titel.
- Die bisherigen `bottom-nav`-Leisten in den Feature-Host-Komponenten (`bill`, `bill-analysis`, `budgetplan`, `work`, `settings`) entfallen.
- Hauptleiste ist auf Haupt-, Detail- und Formularseiten sichtbar (v2), im offenen Sheet unter dem Scrim.

### Bereiche, Tabs und URLs **[Entscheidung]**
Ein zentrales Register `NAV_AREAS` (TypeScript-Konstante) beschreibt Bereiche und Tabs; Hauptleiste, Sidebar, Tabs und Wischgeste lesen nur daraus. Bestehende URLs bleiben, wo möglich; verschobene bekommen Redirects (Lesezeichen, installierte PWA).

| Bereich | Tabs (URL) | Weitere Seiten |
|---|---|---|
| Rechnungen | Liste `/bill/list` · Analyse `/bill/analysis` · Statistik `/bill/expenses` | `/bill/create`, `/bill/:id`, `/bill/analysis/:id` |
| Haushalt | Übersicht `/budgetplan/overview` · Fixkosten `/budgetplan/fixedcost` · Einkommen `/budgetplan/income` | bestehende Anlege-/Detailseiten |
| Stunden | Personen `/work/person` · Statistik `/work/statistics` | bestehende Detail-/Anlegeseiten |
| Mehr | Seite `/more` | `/settings/categories`, `/settings/templates` (neu), `/settings/connections`, `/export/overview`, `/agb`, `/data-protection`, `/user-data` |

- Redirects: `/analyzed/list` → `/bill/analysis`, `/analyzed/:id` → `/bill/analysis/:id`. `/analyzed/create` entfällt **[Nutzer]** (Redirect auf `/bill/list`).
- Die Analyse-Feature-Routen ziehen unter den Bill-Bereich (lazy bleibt).
- Analyse-Badge: Anzahl der Einträge in der Analyse-Liste (= offene Analysen, siehe 5.3) **[Entscheidung]**. Quelle: `AnalyzedBillContextService`, geladen beim Start und nach Übernehmen/Verwerfen.
- Hauptleiste „aktiv“ nach URL-Präfix aus `NAV_AREAS` (`/bill*` → Rechnungen usw.; `/settings*`, `/export*`, Rechtliches, `/more` → Mehr).
- FAB (AC5): Fixkosten, Einkommen und Personen bekommen einen FAB rechts unten über der Hauptleiste. Fixkosten und Einkommen: FAB öffnet die bestehende Anlege-Seite und ersetzt die heutige Aktionsleiste. Personen **[Nutzer]**: FAB öffnet „Arbeitszeiten hinzufügen“ (`create-working-entry`, der häufige Fall); „Person hinzufügen“ wird ein Icon-Button `person_add` in der Kopfzeile über den vorhandenen `action$`-Mechanismus der Shell **[Entscheidung]**. Die Aktionsleiste der Personen-Seite entfällt. Der Rechnungen-Tab „Hinzufügen“ entfällt (Ersatz: Eingabezeile und „Alle Felder“).
- `docs/design/DESIGN.md` Abschnitt „Layout → Mobile“ und Komponenten werden auf Leiste, Tabs, Dock, Sheet umgeschrieben (AC41).

### Wischgeste (AC4) **[Entscheidung zur Technik]**
- Direktive `appTabSwipe` am Inhaltscontainer des Bereichs, Pointer Events (`pointerdown/move/up`, `touch-action: pan-y` auf dem Container). Auslösen nur, wenn |dx| > 60 px, Winkel < 30° zur Waagrechten, Start nicht in den äußeren 24 px und kein Vorfahre des Startelements trägt `data-no-swipe` oder ist ein ausgeschlossenes Element (`input`, `textarea`, `select`, `mat-form-field`, `mat-chip-listbox`/Chip-Streifen, `pinch-zoom`, `mat-datepicker`-Overlay, `form`). Overlays (Sheet, Dialog) liegen außerhalb des Containers und lösen daher nie aus.
- Animation: Router `withViewTransitions` mit `onViewTransitionCreated`; die Richtung (links/rechts) wird über `NavigationBehaviorOptions.info` mitgegeben und als Klasse an `document.documentElement` gesetzt, CSS `::view-transition-old/new` schiebt 200 ms ease-out. Navigationen ohne Tab-Wechsel und `prefers-reduced-motion` → `transition.skipTransition()`. (Quelle: angular.dev „Route transition animations“, `ViewTransitionsFeatureOptions`.) Tab-Tipp nutzt dieselbe Richtungslogik.
- Die reine Gesten-Logik (Schwelle, Winkel, Rand, Ausschluss) liegt in einer testbaren Funktion `evaluateSwipe(start, end, viewportWidth)` mit Unit-Tests (AC39).

### Zurück-Taste schließt zuerst Overlays (AC6) **[Entscheidung zur Technik]**
- `OverlayBackService` (root): Beim Öffnen eines Sheets, Dialogs oder Menüs wird ein History-Eintrag mit gleicher URL und Marker im `history.state` gepusht; `popstate` mit diesem Marker schließt das oberste Overlay statt zu navigieren. Wird das Overlay anders geschlossen, wird der Marker-Eintrag mit `history.back()` wieder entfernt (ohne Navigation auszulösen).
- Angebunden über `MatDialog.afterOpened`, `MatBottomSheet` (eigener Wrapper `SheetService.open`) und `MatMenuTrigger.menuOpened` (Direktive an Menü-Triggern bzw. zentral über einen `MAT_MENU_DEFAULT_OPTIONS`-freien Hook; Wahl beim Bauen).
- Sheets lassen sich am Griff nach unten wegwischen: Drag-Handler auf dem Griff (Pointer Events), ab 80 px bzw. schneller Geste `dismiss()`, sonst zurückfedern. `MatBottomSheet` hat das nicht eingebaut (Context7, `MatBottomSheetConfig`/`MatBottomSheetRef`).

## 3. Schnellerfassung (AC8–AC19, AC23)

### Ablauf (Mobil)
- **Dock** (nur auf `/bill/list`): Feld „Neue Rechnung: Betrag“ (nur Auslöser, `readonly`, öffnet Sheet), daneben Kamera-Knopf (Scan, Abschnitt 5).
- **Schnell-Sheet** über `MatBottomSheet` mit eigener Komponente `QuickEntrySheetComponent`, Aufbau exakt nach v2 `02-schnellerfassung` (a–g). Eigene Zifferntastatur `AmountKeypadComponent`; der Betrag ist kein `input`, daher keine Systemtastatur (AC9).
- Betragslogik als reine Funktionen (`amount-input.ts`): Komma als Trenner, max. 2 Nachkommastellen, führende Nullen, Löschen, `parseAmount() > 0` (AC9, Unit-Tests).
- **Kacheln** (AC10): `buildTiles(templates, suggestions, hidden)` → max. 6 + „Andere …“: angeheftete Vorlagen in ihrer Reihenfolge, danach Vorschläge nach Häufigkeit; Vorschläge, die eine Vorlage abdeckt (gleiche Kategorie/Unterkategorie und fester gleicher Shop, oder Vorlage mit „Shop wählen“ in derselben Kategorie/Unterkategorie), und ausgeblendete fallen weg. Reine Funktion mit Unit-Tests.
- **Auswahlzustand** (AC11): `QuickEntryState` (Signal-basierter Store der Sheet-Komponente oder Klasse mit reiner Logik): Betrag, gewählte Kachel, Shop, Datum. Tastatur klappt ein, sobald Betrag gültig und Kachel (inkl. Shop) gesetzt; Tipp auf Betrag öffnet sie. Speichern gesperrt mit Hinweistext, was fehlt („Betrag eingeben“, „Vorlage wählen“, „Shop wählen“).
- **Shop-Auswahl** (AC12): bei Vorlage ohne festen Shop Chips der häufigsten Shops dieser Kategorie (aus `shop-stats`, s. 3.3), häufigster vorausgewählt, max. 5 Chips + „Anderer …“ (öffnet Textfeld mit Autocomplete) **[Entscheidung: 5]**.
- **„Andere …“** (AC13): Shopname (Autocomplete aus `shop-stats`), Kategorie, Unterkategorie, Schalter „Als Vorlage merken“. Beim Speichern mit Schalter: erst Rechnung, dann Vorlage (fester Shop) anlegen; schlägt die Vorlage fehl, bleibt die Rechnung und eine Snackbar meldet nur den Vorlagenfehler.
- **Datum** (AC14): Standard heute; Tipp → Menü Heute · Gestern · Datum wählen (Material-Datepicker).
- **Alle Felder** (AC15): navigiert zu `/bill/create` mit den Werten als Router-State (`history.state`, kein Query-String); das Formular übernimmt sie. Sheet schließt, Entwurf wird verworfen, sobald das Formular gespeichert ist.
- **Speichern** (AC16): über den bestehenden `BillContextService.addBill` (offline-first via `BillCacheService` bleibt damit für die Schnellerfassung erhalten, ohne Mehraufwand). Danach Sheet zu, neue Zeile 2 s hervorgehoben (Klasse an der optimistisch eingefügten Zeile, ID ist bekannt), Snackbar „Gespeichert · {Shop} {Betrag}“ 4 s ohne Aktion, `navigator.vibrate?.(30)` **[Entscheidung: 30 ms]**.
- **Duplikat** (AC17) **[Entscheidung]**: keine neue Backend-Abfrage. `Bill.Date` enthält die Uhrzeit (Erfassen speichert `new Date()`), der Suchfilter sendet nur das Datum und filtert `Date <= untilDate`. Deshalb lädt das Sheet `searchBills({fromDate: Tag, untilDate: Tag + 1, pageSize: 100})` (eigener Aufruf, unabhängig vom Listenfilter) und filtert clientseitig auf den Kalendertag; der bestehende Listenfilter bleibt unverändert (Korrektur ggf. in US-0008). `findDuplicate(candidate, dayBills, categories)` vergleicht Shop (trim, case-insensitive), Betrag (auf Cent), Kalendertag und Kategorie/Unterkategorie **per Name** (case-insensitive), weil Kategorien je Benutzer eigene IDs haben und Rechnungen verbundener Konten mitgezählt werden (ein vom Partner schon eingetragener Einkauf ist genau der Fall, den der Hinweis abfangen soll). Die „Uhrzeit“ im Hinweis kommt aus dem Zeitanteil von `Date`; ist er 00:00 (Datum gewählt), entfällt sie. Bei Datum ≠ heute wird für diesen Tag nachgeladen. Reine Vergleichsfunktion mit Unit-Tests.
- **Entwurf** (AC18): `QuickEntryDraftStore` in `localStorage` (Schlüssel pro Benutzer-ID), geschrieben bei jeder Änderung, gelöscht nach Speichern oder „Verwerfen“. Beim Öffnen mit Entwurf: Zeile „Entwurf wiederhergestellt · Verwerfen“. Entwurf älter als 24 h wird verworfen **[Entscheidung]**. Datum im Entwurf bleibt das gewählte.
- **Desktop** (AC19): dieselbe Komponente in einem `MatDialog` (480 px, Radius 16), Betrag als normales `input` (`inputmode="decimal"`), keine Zifferntastatur, Aktionen „Abbrechen | Speichern“.

### Vorlagen-UI (AC20–AC22)
- Kachel-Titel: Name, sonst Shopname; bei „Shop wählen“ ohne Namen: Kategoriename **[Entscheidung]** (Story AC20 setzt Name oder Shop voraus; ohne beides braucht die Kachel einen Titel).
- Langer Druck (≥ 500 ms, ohne Bewegung > 10 px) auf einen Vorschlag → Kontextmenü „Als Vorlage anheften“ / „Nicht mehr vorschlagen“ (AC21). Auch per Rechtsklick/Kontextmenü-Taste auf Desktop.
- `/settings/templates` nach `03-vorlagen`: Abschnitt „Angeheftet“ mit CDK Drag & Drop am Griff (wie Kategorien), Tipp → Bearbeiten; Abschnitt „Vorschläge“ mit Häufigkeit und „Anheften“; Aktionsleiste „Vorlage hinzufügen“. Bearbeiten: Name, Segment „Fester Shop | Beim Erfassen wählen“, Shopname (bei fest), Kategorie, Unterkategorie; Löschen mit Rückfrage.

### Backend: Vorlagen, Vorschläge, Shop-Statistik (Shopping-Service)
Stil wie vorhanden: Minimal APIs + MediatR, `Requests/<Bereich>/<Name>/V1/`, FluentValidation, `IIdentityService.GetUserId()`, EF-Core-Migration im Shopping-`DbContext`, Tests als Handler-/Validator-Unit-Tests auf SQLite in-memory (`TestDb.CreateShopping()`).

**Entitäten [Entscheidung]**
- `BillTemplate`: `Id`, `UserId`, `Name?` (max 100), `ShopName?` (max 200; `null` = beim Erfassen wählen), `CategoryId`, `SubCategoryId?`, `SortOrder` (int).
- `HiddenBillSuggestion`: `Id`, `UserId`, `ShopName` (normalisiert gespeichert: getrimmt, Vergleich case-insensitive), `CategoryId`, `SubCategoryId?`.
- Kategorie gelöscht → zugehörige Vorlagen und ausgeblendete Vorschläge gelöscht; Unterkategorie gelöscht → bei Vorlagen `SubCategoryId = null`, ausgeblendete Vorschläge dazu gelöscht. Umsetzung per FK-Regel oder im Lösch-Handler, falls SQL Server mehrere Cascade-Pfade ablehnt.

**Endpoints (Gruppe `/api/bill-template`, versioniert wie `/api/bill`) [Entscheidung]**

| Methode | Pfad | Zweck |
|---|---|---|
| GET | `/api/bill-template` | eigene Vorlagen, sortiert nach `SortOrder` → `BillTemplateDto[]` {id, name?, shopName?, categoryId, subCategoryId?, sortOrder} |
| POST | `/api/bill-template` | anlegen (wird hinten angehängt) → `BillTemplateDto` |
| PUT | `/api/bill-template/{id}` | ändern |
| DELETE | `/api/bill-template/{id}` | löschen |
| PUT | `/api/bill-template/order` | Body `{ ids: Guid[] }`, setzt `SortOrder` in dieser Reihenfolge; muss genau alle eigenen IDs enthalten, sonst 400 |
| GET | `/api/bill-template/suggestions` | Vorschläge → `BillSuggestionDto[]` {shopName, categoryId, subCategoryId?, count} |
| POST | `/api/bill-template/hidden-suggestions` | Vorschlag ausblenden, Body wie Vorschlag ohne count; idempotent |
| GET | `/api/bill/shop-stats` | Shop-Statistik → `ShopStatDto[]` {shopName, categoryId, subCategoryId?, count, lastUsed} |

- Validierung: Kategorie/Unterkategorie gehören dem Benutzer (wie `CreateBillCommandValidator`), Unterkategorie gehört zur Kategorie, Name/Shop-Längen. Fremde IDs → 404.
- **Vorschläge** (AC10): eigene Rechnungen (`UserId` = aktueller Benutzer, keine verbundenen Konten [v2 offener Punkt, Story AC10]) der letzten 90 Tage, gruppiert nach Shop (trim, case-insensitive; angezeigt wird die häufigste Schreibweise) + Kategorie + Unterkategorie, Anzahl ≥ 2 **[Entscheidung]**, ohne ausgeblendete, absteigend nach Anzahl, dann nach letzter Nutzung, max. 20. Das Ausfiltern „von Vorlage abgedeckt“ macht das Frontend (`buildTiles`), weil die Vorlagen dort ohnehin vorliegen und die Verwaltungsseite die Vorschläge ungefiltert-abzüglich-ausgeblendeter braucht. **[Entscheidung]**
- **Shop-Statistik**: eigene Rechnungen der letzten 365 Tage **[Entscheidung]**, gruppiert nach Shop + Kategorie + Unterkategorie mit Anzahl und letzter Nutzung. Das Frontend leitet daraus ab: Autocomplete (AC13, AC25), häufigste Shops je Kategorie (AC12), zuletzt verwendete Kategorie/Unterkategorie je Shop (AC25). Ein Endpoint statt drei, eine Abfrage pro Sitzung (Cache im `ShopStatsContextService`, nach eigenem Speichern lokal fortgeschrieben).

## 4. Großes Formular und Foto (AC24–AC29)

- `/bill/create`: Preis oben mit Autofokus, `inputmode="decimal"`, Komma erlaubt (Parser wie Schnellerfassung). Shopname mit `mat-autocomplete` aus Shop-Statistik; nach Auswahl Kategorie/Unterkategorie der letzten Nutzung vorbelegen, sofern noch nicht von Hand gesetzt. Datum mit Schnellwahl Heute · Gestern · Datum wählen. Übernimmt Router-State aus „Alle Felder“ (3) und aus dem Scan (5).
- Nach Speichern: Snackbar wie AC16, Vibrieren, Navigation zu `/bill/list` mit hervorgehobener Zeile.
- Foto (AC28): `<input type="file" accept="image/*" capture="environment">` bzw. ohne `capture` für Galerie; der Dialog mit Radio-Umschalter entfällt (zwei Knöpfe „Kamera“ und „Galerie“ im Formular). `ngx-webcam` ist seit US-0006 schon entfernt. Während der Verkleinerung Ladezustand, Knöpfe gesperrt (offener Punkt aus US-0006).
- Bildverkleinerung (AC29): `compressImage(file, 1600, 0.8)` zentral für Rechnung, Analyse-Übernahme, Scan, Offline-Cache. Die Abkürzung aus US-0006 (JPEG innerhalb der Grenze bleibt unverändert) bleibt, wird aber nur genommen, wenn das Bild keine EXIF-Drehung ≠ 1 hat **[Entscheidung]**; sonst wird neu kodiert (Drehung in die Pixel).

## 5. Rechnung scannen und Analyse (AC30–AC36)

### 5.1 Scan-Ablauf [Nutzer: synchron]
- Einstiege: Kamera-Knopf im Dock (Mobil), „Scannen“ neben der Eingabezeile (Desktop), Share Target (5.4), App-Shortcut nicht (der öffnet das Sheet).
- Ablauf: Foto (`input capture`) → `compressImage` → Vollbild-Ladezustand mit Foto-Vorschau und „Rechnung wird gelesen …“ sowie „Abbrechen“ **[Entscheidung]** → `POST /api/bill/analyze` → `/bill/create` mit Router-State {Foto, Shop, Datum, Betrag, Kategorie, Unterkategorie} → prüfen → Speichern (Foto wird mitgespeichert, bestehender Multipart-Weg).
- Zeitlimit 30 s im Frontend (`timeout`), Abbrechen bricht den Request ab **[Entscheidung]**. Bei Fehler/Zeitüberschreitung/Abbruch: Formular mit Foto und leeren Feldern, Hinweis „Die Rechnung konnte nicht gelesen werden. Bitte die Felder ausfüllen.“ (AC31; bei Abbruch ohne Hinweis).
- Backend: Die Antwort von `/api/bill/analyze` ist heute ein anonymes Objekt. Sie bekommt ein festes DTO `AnalyzeBillResultDto` {shopName?, date?, totalAmount?, categoryId?, subCategoryId?, confidence?, lineItems[]}, ohne Verhaltensänderung, plus Handler-Test. Ein serverseitiges Zeitlimit kommt nicht dazu (der Abbruch des Clients bricht über den `CancellationToken` ab).
- Frontend-API: neue Methode `BillApiService.analyzeBill(file): Observable<AnalyzeBillResultDto>`.

### 5.2 Analyse-Tab (AC32–AC34, AC36)
- Detailansicht zeigt die Positionen (LineItems) als Liste unter den Feldern (AC32) und öffnet das Foto im bestehenden Pinch-Zoom-Dialog der Rechnungen (AC34, gleiche Komponente wiederverwenden).
- **„Als Rechnung übernehmen“** (AC33): `/bill/create` mit Router-State aus der Analyse (inkl. Foto, das per `GET analyzed/{id}/image` geladen wird) und der Analyse-ID. **[Entscheidung]** In diesem Modus speichert das Formular direkt beim Server (`BillApiService.addBill`, nicht über den Offline-Cache): erst nach erfolgreicher Antwort ruft das Frontend `DELETE /api/bill/analyzed/{id}` auf, der Eintrag verschwindet, Badge zählt herunter. Ohne Netz: Fehlersnackbar „Zum Übernehmen wird eine Verbindung gebraucht“, nichts wird gelöscht. (Grund: würde nach dem lokalen Speichern gelöscht und scheitert der spätere Sync dauerhaft, wäre die Analyse weg.)
- **„Verwerfen“** (AC33): Rückfrage, dann `DELETE /api/bill/analyzed/{id}` (neu): löscht Eintrag, Positionen und Foto (Bild-Repository). Nur eigene Einträge, sonst 404.
- **Paginierung (AC36) [Entscheidung]:** kein Paginator. Weil übernommene und verworfene Einträge verschwinden, enthält die Liste nur offene Analysen; Virtual Scroll bleibt. Der Endpoint bleibt ohne Seitenparameter, das Frontend schickt keine mehr.

### 5.3 Worker (AC35) [Entscheidung zur Technik]
Heute veröffentlicht der Worker eine Nachricht und markiert sofort; der Handler legt bei plausiblem Ergebnis direkt eine Rechnung an, sonst einen Analyse-Eintrag, und löscht danach das Quellbild. `FileSystemAnalysisImageRepository.MarkAsProcessedAsync` tut nichts, daher geht jedes Bild jede Minute erneut raus.

Neu:
- Ein Bild gilt erst als erledigt, wenn der Handler erfolgreich war (er löscht es; das bleibt so). `MarkAsProcessedAsync` wird ersetzt durch Metadaten pro Bild: `Attempts` (int) und `ClaimedUntilUtc`.
- Worker: listet Bilder, überspringt solche mit `ClaimedUntilUtc` in der Zukunft; vor dem Veröffentlichen `Attempts + 1` und `ClaimedUntilUtc = jetzt + 10 min`. Schlägt der Handler fehl, bleibt das Bild und wird nach Ablauf erneut versucht.
- Ab dem 3. fehlgeschlagenen Versuch (`Attempts ≥ 3` beim nächsten Durchlauf) legt der Worker statt einer Nachricht einen leeren Analyse-Eintrag mit dem Foto an (alle Felder leer) und löscht das Quellbild. So landet es im Analyse-Tab zum Übernehmen oder Verwerfen, statt verloren zu gehen oder endlos zu laufen.
- Azure-Repository: Metadaten in Blob-Metadata (wie heute `processedAt`); Dateisystem-Repository: die vorhandene Sidecar-Datei `<name>.metadata.json` wird um `Attempts` und `ClaimedUntilUtc` erweitert (keine zweite Datei; `ListImagesAsync` überspringt `*metadata.json` schon). Beide implementieren `GetStateAsync`/`ClaimAsync` (Namen beim Bauen).
- Altbestand **[Entscheidung]**: Blobs mit gesetztem `processedAt` sind bisher verlorene Fehlschläge (erfolgreiche werden gelöscht). Der neue Worker behandelt sie wie „Obergrenze erreicht“ und legt sofort leere Analyse-Einträge mit Foto an; danach wird `processedAt` nicht mehr geschrieben. Keine separate Migration.
- Tests: Worker-Logik mit Fake-Repository und Fake-Broker (Claim, Überspringen, Obergrenze, leerer Eintrag), Dateisystem-Repository mit Temp-Verzeichnis.

### 5.4 PWA: App-Shortcut und Share Target (AC37, AC38)
- Manifest `shortcuts`: „Rechnung eintragen“ → `/bill/list?quick=1`; `BillListComponent` öffnet bei `quick=1` das Sheet und entfernt den Parameter (`replaceUrl`).
- Manifest `share_target`: `action: "/share-target?ngsw-bypass=true"`, `method: POST`, `enctype: multipart/form-data`, `params.files: [{name: "image", accept: ["image/*"]}]`.
- Eigenes Service-Worker-Skript `src/custom-sw.js` nach angular.dev „Custom service worker scripts“: `importScripts('./ngsw-worker.js')`, dazu ein `fetch`-Handler nur für `POST /share-target`: Datei aus `formData()` in Cache Storage `share-target` ablegen, `Response.redirect('/bill/list?shared=1', 303)`. Der Parameter `ngsw-bypass` sorgt dafür, dass der Angular-Worker die Anfrage nicht selbst beantwortet. Registrierung `provideServiceWorker('custom-sw.js', …)`, Datei als Asset in `angular.json`, `ngsw-config` unverändert.
- `BillListComponent` liest bei `shared=1` das Bild aus dem Cache, löscht es dort und startet den Scan-Ablauf ab der Analyse.
- Grenzen: Share Target gibt es nur bei installierter PWA unter Android/Chromium, nicht unter iOS; im Dev-Server ohne Service Worker nicht testbar, Prüfung mit Produktions-Build (wie in US-0006 auf Port 4300). Ohne Login (B2C-Weiterleitung) bleibt das Bild im Cache, bis die App nach dem Login `shared=1` verarbeitet; der Parameter bleibt über den Login erhalten oder das Bild wird beim nächsten Start der Liste gefunden **[Entscheidung: beim Start der Liste prüfen, ob ein geteiltes Bild im Cache liegt]**.

## 6. Tests und Prüfung (AC39, AC40)

- Backend (xUnit, SQLite in-memory, NSubstitute): Vorlagen CRUD + Reihenfolge + Validierung + fremde IDs, Vorschläge (90 Tage, Gruppierung, Schreibweise, ausgeblendet, Mindestanzahl, nur eigene), Shop-Statistik, Analyse verwerfen (inkl. fremde ID → 404, Liste enthält den Eintrag danach nicht mehr), Analyze-DTO, Worker-Logik inkl. Altbestand `processedAt`, Dateisystem-Metadaten. Der in AC39 genannte Paginierungs-Test entfällt, weil AC36 mit „kein Paginator“ umgesetzt wird; an seine Stelle tritt der Verwerfen/Übernehmen-Test.
- Frontend (Vitest): Betragseingabe, `buildTiles`, Auswahlzustand/Speicher-Sperre, `findDuplicate`, Entwurf (Speichern, Wiederherstellen, Ablauf 24 h), `evaluateSwipe`, `OverlayBackService` (Marker-Logik), Shop-Statistik-Ableitungen.
- UI (Phase 4): Playwright bei 390 px und 1440 px gegen `docs/design/v2/screenshots/` (AC40) plus Regression aller Bereiche; Share Target und Shortcut am Produktions-Build, soweit ohne Gerät möglich (Manifest-Inhalt, SW-Handler per `fetch`-POST simuliert).

## 7. Dem Umsetzenden überlassen

Komponenten- und Dateinamen im Rahmen der Projektkonventionen; ob `QuickEntryState` Signals oder eine Klasse nutzt; die genaue Anbindung des `OverlayBackService` an `MatMenu`; Spaltennamen und Migrationsname; Feinheiten der Animationen innerhalb von v2.

## 8. Entscheidungen zur Prüfung durch den Nutzer

1. URLs: Analyse unter `/bill/analysis`, Vorlagen unter `/settings/templates`, Mehr unter `/more`; alte Analyse-URLs per Redirect.
2. Analyse-Badge = Anzahl Einträge im Analyse-Tab; kein Paginator (Liste enthält nur Offenes).
3. Scan: Vollbild-Ladezustand mit Abbrechen, Zeitlimit 30 s.
4. Worker: 3 Versuche, danach leerer Analyse-Eintrag mit Foto im Analyse-Tab.
5. Vorschläge: nur Kombinationen mit mindestens 2 Rechnungen in 90 Tagen, max. 20; Shop-Statistik über 365 Tage.
6. Duplikat-Hinweis berücksichtigt auch Rechnungen verbundener Konten.
7. Personen: „Person hinzufügen“ als Icon in der Kopfzeile (FAB = Arbeitszeiten hinzufügen).
8. Duplikat-Hinweis vergleicht Kategorien per Name; Übernehmen einer Analyse speichert direkt beim Server; Altbestand des Workers wird zu leeren Analyse-Einträgen.
9. Shop-Auswahl zeigt max. 5 Shops + „Anderer …“; Kachel ohne Name und festen Shop heißt wie die Kategorie.
10. Entwurf verfällt nach 24 h; Vibrieren 30 ms.
11. Schnellerfassung speichert über den bestehenden Offline-Weg (funktioniert damit auch ohne Netz).
12. EXIF-gedrehte kleine JPEGs werden neu kodiert.

## 9. Abweichungen

### Task 12: App-Shortcut und Share Target (AC37, AC38)

- Umsetzung wie in 5.4. Zusätzlich: Ohne Bilddatei (leeres Formular oder Nicht-Bild) leitet der Service Worker auf `/bill/list?shared=0` um, das Bild wird nicht gecacht, die Liste meldet „Das geteilte Bild konnte nicht übernommen werden.“ (Abschluss-Review I4; vorher still auf `/bill/list`). Der Dateiname wird im Cache-Eintrag als Header `X-File-Name` URI-kodiert mitgegeben (Header nur Latin-1, Emoji/CJK-Namen warfen) und von `takeSharedImage` dekodiert. Dateien ohne MIME-Typ oder mit `application/octet-stream` werden angenommen (manche Android-Apps teilen so); ob es ein Bild ist, prüft der Scan (nicht dekodierbar → „Das Foto konnte nicht gelesen werden.“). Ohne Typ nimmt `takeSharedImage` kein JPEG mehr an, damit `compressImage` neu kodiert.
- `BillListComponent` prüft beim Start immer, ob ein geteiltes Bild im Cache liegt (auch ohne `shared=1`); `quick`/`shared` werden per `replaceUrl` entfernt, bevor Sheet bzw. Scan starten.
- Prüfung am Produktions-Build (Port 4300, http-server, Playwright, ohne Login): Build enthält `custom-sw.js`, `ngsw-worker.js`, `ngsw.json` (hasht `custom-sw.js`), keine neuen Warnungen; Deploy-Tokens (`#{authClientId}#` u. a.) unverändert. `manifest.webmanifest` enthält Shortcut und Share Target mit den Soll-Werten. `custom-sw.js` per `navigator.serviceWorker.register` in einer Seite ohne App registriert (Login auf 4300 nicht möglich): `POST /share-target?ngsw-bypass=true` mit Bild → Weiterleitung auf `/bill/list?shared=1`, Bild (Typ `image/png`) im Cache `share-target` unter `/shared-image`; mit Textdatei → `/bill/list`, nichts gecacht.
- Grenzen: Der echte Ablauf `?quick=1`/`?shared=1` in der App (Sheet öffnet, Scan startet) sowie die Installation als PWA mit System-Share-Sheet sind am Produktions-Build nicht prüfbar (B2C nur auf 4200, Service Worker nur in Produktion); `?quick=1` und `?shared=1` werden am Dev-Server auf 4200 mit manuell in den Cache gelegtem Bild geprüft.

### Abschluss-Review: Zurück-Regeln (AC6, AC27, AC33; Review I1–I3)

- **Seite verlassen statt neue Seite pushen.** `HistoryTrailService` führt zu jedem Router-Eintrag in `history.state.appTrail` die URLs der Einträge darunter. Neuladen übersteht die Spur seit US-0008: `AuthService` ruft `oauthService.tryLogin()` (angular-oauth2-oidc) mit `preventClearHashAfterLogin: true` auf, solange die URL keine Antwort des Login-Servers (`code` bzw. `error`) enthält; nur dann entfernt die Bibliothek die Antwort per `history.replaceState(null, …)` und löscht damit den Zustand des Eintrags (`tryLoginOptions`). Vorher setzte jeder App-Start den Zustand zurück, nach Neuladen griff der `replaceUrl`-Rückfall, und Zurück zeigte die ältere Liste einmal. `leaveTo(liste)`: Liegt die Liste direkt darunter, geht es per Zurück dorthin (`OverlayBackService.back`, wartet gerade geschlossene Dialoge ab, überspringt liegen gebliebene Overlay-Einträge); sonst ersetzt die Liste den aktuellen Eintrag (`replaceUrl`, z. B. Deep Link). So gibt es nach Speichern/Löschen genau einen Listen-Eintrag und keinen Eintrag einer gelöschten Seite unter der Liste.
- Angewendet auf: „Eintrag wurde nicht gefunden.“ (`leaveDetailNotFound`, alle Detailseiten inkl. Vorlagen), Löschen von Rechnung, Fixkosten, Einkommen, Person, Kategorie, Vorlage, Speichern einer Vorlage, Verwerfen einer Analyse.
- **Großes Formular speichern (I2):** zurück zur Liste, von der es geöffnet wurde („Alle Felder“, Scan, Share Target → `/bill/list`); geöffnet ohne Liste darunter (Deep Link) → `/bill/list` ersetzt das Formular. Hervorhebung über `lastAddedId` bleibt.
- **„Als Rechnung übernehmen“ speichern [Entscheidung]:** zurück zur **Analyse-Liste** (zwei Einträge: über den nun gelöschten Analyse-Eintrag hinweg), nicht mehr zur Rechnungsliste wie in §4. Grund: dort arbeitet der Nutzer die Analysen ab, der Eintrag ist weg und das Badge zählt herunter; die Rechnungsliste zeigt die neue Rechnung hervorgehoben, sobald man hinwechselt. Ohne Analyse-Liste darunter ersetzt `/bill/analysis` das Formular.
- **Auswahl-Panels (I3):** Datepicker (auch `touchUi`-Vollbild), `mat-select` und `mat-autocomplete` sind CDK-Overlays, keine Dialoge. Die Direktive `PanelBackDirective` (Selektor `mat-datepicker, mat-select, [matAutocomplete]`, ohne Attribut) meldet sie beim `OverlayBackService` an; Zurück schließt nur das oberste Panel (im Sheet nicht das Sheet, im Formular bleibt die Eingabe samt Foto). Importiert in allen Komponenten mit Datepicker/Select/Autocomplete, auch den älteren Seiten. Das Autocomplete öffnet und schließt auch beim Tippen (Treffer da/weg); jedes Öffnen bekommt einen History-Eintrag, das ist gewollt. Keine „Eingaben verwerfen?“-Rückfrage beim Verlassen des Formulars.
- **Foto der Vorbelegung im Speicher, nicht im History-State [Entscheidung, Phase 4 F1/F2]:** Scan, Share Target und Übernahme legen das Foto im `PrefillImageStore` ab (nur das zuletzt übergebene), in `prefill` steht nur `imageKey`; Chromium liest den Zustand eines Eintrags mit Blob nach einer Traversierung als `null` (samt `navigationId` und `appTrail`). Nach **Neuladen** von `/bill/create` ist das Foto weg: das Formular öffnet mit den übrigen Werten und Hinweisen, aber ohne Foto, und speichert normal; bei einer Übernahme bleibt die Analyse samt Foto dann bestehen (normale Rechnung statt Übernahme). `OverlayBackService.push` und `HistoryTrailService` schreiben nicht über einen unlesbaren (`null`) Zustand.
- **Dialoge und Sheets mit `closeOnNavigation: false` [Entscheidung, Task 6]:** Standard für alle `MatDialog`s (`provideOverlayBack`) und Sheets (`SheetService`), weil der `OverlayBackService` Zurück übernimmt (sonst schlösse die CDK bei jedem popstate alle Overlays auf einmal). Bedingung: Wer bei offenem Dialog navigiert, schließt ihn vorher (Sheet „Alle Felder“, Scan-Overlay, Rückfragen tun das).

### Abschluss-Review: weitere Abweichungen

- **Tastatur klappt ein (AC11), Auslegung:** Die Tastatur klappt nur ein, wenn eine Kachel- oder Shop-Auswahl einen gültigen Betrag vervollständigt, nie beim Tippen (sonst klappte sie nach „2“ von „23,40“ ein). Wird zuerst eine Kachel gewählt und dann der Betrag getippt, bleibt sie offen; der Hinweis und die Speichersperre gelten unverändert.
- **`Bill.Update` ersetzt vollständig:** `PUT /api/bill` setzt alle Felder; weggelassene `notes`/`subCategoryId` werden geleert. Einziger Aufrufer ist das Bearbeiten-Formular, das immer den ganzen Stand schickt.
- **Betrag:** `parseAmount('1.234')` ist ungültig (mehr als zwei Nachkommastellen), Tausenderpunkte nur mit Komma (`1.234,50`).
- **Kategorie löschen (Task 1b):** `DELETE` einer Kategorie ist jetzt auf den Nutzer beschränkt und liefert für fremde/fehlende 404; Vorlagen und ausgeblendete Vorschläge der Kategorie werden im Handler mitgelöscht.
- **Rechnungs-ID pro Formular (Review M2):** Das große Formular erzeugt die ID einmal; ein zweiter Versuch nach verlorener Antwort legt keine zweite Rechnung an (`CreateBill` liefert bei bekannter ID die vorhandene zurück).
- **Übernahme ohne Netz (Review M1):** schon beim Tipp auf „Als Rechnung übernehmen“ bzw. bei Verbindungsabbruch beim Laden des Fotos „Zum Übernehmen wird eine Verbindung gebraucht“ (§5.2), nicht „Foto konnte nicht geladen werden.“

### Betriebshinweis: Altbestand der Analyse beim ersten Deploy (AC35, Review I5)

- Beim ersten Durchlauf des neuen Workers in Produktion wird **jeder** Blob im Container `analysis` mit Metadatum `processedAt` (alte, verlorene Fehlschläge) sofort zu einem leeren Analyse-Eintrag mit Foto; das Quellbild wird danach gelöscht. Das Badge springt einmalig um diese Anzahl; die Umwandlung ist nicht umkehrbar. Vor dem Deploy die Anzahl zählen (Blobs mit `processedAt` im Container `analysis`) und dem Nutzer nennen.
- Das Azure-Repository ist gegen Azurite geprüft (`AzureStorageAnalysisImageRepositoryTests`, laufen nur mit Azurite auf Port 10000, sonst übersprungen): Liste mit Versuchen/Claim/Altbestand, Claim zählt hoch und behält `userId`, Worker-Ablauf Claim → 3 Versuche → Aufgeben → Löschen, Altbestand sofort aufgegeben.
