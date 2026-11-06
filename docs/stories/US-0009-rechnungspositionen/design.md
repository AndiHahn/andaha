# US-0009 Design: Asynchron scannen, Positionen behalten, anzeigen und durchsuchen

Stand: 2026-11-05. Grundlage: [`story.md`](./story.md) (AC1–AC18), `docs/design/DESIGN.md`, Muster aus US-0007 (Analyse, Übernahme, Share Target, Worker) und US-0008 (Liste, Lade-/Fehlerzustände, Validatoren, langer Druck).

Markierungen:

- **[Nutzer]** hat der Nutzer entschieden.
- **[Entscheidung]** ist ein Vorschlag aus dem Gespräch, den der Nutzer mit „der Rest passt“ bestätigt hat, oder eine Entscheidung dieses Designs.
- **[Technik]** ist eine technische Entscheidung.

## 1. Absicht

**[Nutzer]** Meist werden 2–5 Rechnungen hintereinander fotografiert, und man will dabei nicht warten. Geprüft und gespeichert wird gleich danach, solange man die Rechnungen noch in der Hand hat, nicht erst beim nächsten Öffnen der App.

**[Nutzer]** Die Positionen sind zum Wiederfinden da. Gesucht wird in einer Rechnung und rechnungsübergreifend.

**Ziele:**

- Asynchroner Mehrfach-Scan.
- Der Tab „Analyse“ wird zum Eingang: in Arbeit, zu prüfen, angelegt.
- Ergebnisse kommen schnell, in etwa 10–20 Sekunden.
- Positionen bleiben erhalten, sind sichtbar, korrigierbar und durchsuchbar.

**Nicht-Ziele:** siehe Out of Scope der Story.

**Anti-Ziele:**

- Der Nutzer muss nach dem Fotografieren warten oder ein Formular ausfüllen.
- Eine einzelne schlecht erkannte Position blockiert eine ganze Rechnung.
- Rechnungen ohne Positionen (Altbestand, Schnellerfassung) sehen anders aus als heute.
- Ein Bild wird doppelt analysiert, sodass eine Rechnung doppelt angelegt wird.

## 2. Scannen (Frontend) — AC1–AC3, AC6

- **Kamera-Knopf [Nutzer]:** `<input type="file" accept="image/*" multiple>` ohne `capture`. Auf Android und iOS bietet das System damit Kamera oder Galerie an, in der Galerie sind mehrere Bilder wählbar. Am Desktop öffnet sich der Dateidialog mit Mehrfachauswahl.
- **Pro Bild:**
  1. `compressImage(file, 1600, 0.8)` wie in US-0007;
  2. Upload über `POST api/bill/upload-for-analysis` mit `reportProgress`;
  3. es entsteht ein lokaler Eintrag im neuen `AnalysisUploadService` (root): Vorschaubild als Object-URL, Status `uploading` mit Prozent, danach `analyzing` mit der vom Server gelieferten Upload-ID, bei Fehler `failed`.
- **Rückmeldung** gleich nach der Auswahl: Snackbar „3 Rechnungen werden analysiert“ (Einzahl: „1 Rechnung wird analysiert“), mit Aktion „Anzeigen“, die zum Tab Analyse führt. Man bleibt auf der Liste und kann weiter fotografieren.
- **Offline (AC6):** Ohne Verbindung wird nichts hochgeladen. Es erscheint die Snackbar „Ohne Verbindung können keine Rechnungen hochgeladen werden.“ Scheitert ein einzelner Upload, steht er in „In Arbeit“ als „Upload fehlgeschlagen“ mit „Erneut versuchen“ und „Entfernen“, solange die App offen ist.
- **Synchroner Scan entfällt (AC2) [Nutzer]:**
  - Im Frontend fallen weg: das Scan-Overlay, der synchrone Teil von `scan.service`, `analyzeBill` im `BillApiService` und der Prefill-Weg „Scan → Formular“ samt Hinweistext „Die Rechnung konnte nicht gelesen werden …“.
  - **[Entscheidung]** Der Backend-Endpoint `POST api/bill/analyze` wird ebenfalls entfernt, mit Handler, DTOs und Tests. Er wäre sonst toter Code.
- **Teilen aus der Galerie (AC3) [Nutzer: behalten]:**
  - `custom-sw.js` nimmt beim Share-POST **alle** Dateien an (`formData.getAll('image')`) und legt sie im Cache ab.
  - `bill-list` startet bei `?shared=1` für alle Bilder denselben Upload-Weg und zeigt dieselbe Snackbar.
  - Das Manifest (`share_target.params.files`) erlaubt mehrere Bilder (`accept: image/*`).
  - Die bisherigen Robustheitsregeln aus US-0007 bleiben: Dateiname mit Nicht-Latin-1-Zeichen, Dateien ohne Typ, Fehlermeldung.

> **Change Request 2026-11-06 [Nutzer]:** „In den meisten Fällen möchte ich direkt ein Foto machen. Galerie nur im Ausnahmefall.“
> Der Kamera-Knopf im Dock bekommt `accept="image/*" capture="environment"` ohne `multiple`: mobil öffnet er direkt die
> Kamera, ein Foto je Tipp (erneut tippen für das nächste). Der Desktop ignoriert `capture` und zeigt den Dateidialog
> (eine Datei). Upload-Weg, Snackbar und Offline-Verhalten bleiben. Die Galerie mit Mehrfachauswahl wandert in den Tab
> „Scans“ (§4). Der Text oben zum Kamera-Knopf beschreibt den Stand vor dem Change Request.

## 3. Sofortige Analyse (Backend, Shopping) — AC4, AC5 [Technik]

- **Upload-Antwort:** `UploadBillForAnalysis` liefert künftig `202` mit `{ id: <imageName> }`. Das Frontend verknüpft damit seinen lokalen Eintrag.
- **Sofort verarbeiten:**
  - Der Upload-Handler stellt die Bild-ID in eine In-Process-Warteschlange (`Channel<string>`).
  - Ein `BackgroundService` (Hosted Service in Shopping, damit auch im Monolith) liest sie und verarbeitet sofort.
  - Verarbeiten heißt: Bild per bestehendem `ClaimAsync` claimen (US-0007), dann denselben Analyse- und Anlege-Code ausführen, den heute `AnalyzeBillMessageHandler` nutzt.
  - Dieser Code wird dafür in einen gemeinsamen Dienst gezogen und **nicht** über Dapr Pub/Sub geschickt. Damit hängt der sofortige Weg nicht vom Sidecar ab.
- **Kein Doppel-Analysieren [Entscheidung, Builder-Check]:** `ClaimAsync` ist nicht atomar (kein ETag, kein Lock), und der Worker listet erst und claimt später. Deshalb wird der Claim **schon beim Upload** gesetzt.
  - Der Upload schreibt die Metadaten `userId`, `uploadedAt` (eigener Eintrag, weil Azure beim Claimen `Last-Modified` ändert), `origin=app`, `ClaimedUntilUtc = jetzt + 2 min` und `Attempts = 1` in einem Aufruf.
  - Erst danach stellt er die Bild-ID in die Warteschlange.
  - Der Worker überspringt geclaimte Bilder wie heute.
- **Fehlschlag des sofortigen Wegs [Entscheidung, Builder-Check]:**
  - Der sofortige Weg gibt den Claim bei einem Fehler sofort frei (`ClaimedUntilUtc = jetzt`). Der Worker versucht es dann beim nächsten Durchlauf erneut, also nach höchstens einer Minute.
  - Die Grenze von 3 Versuchen (US-0007) zählt den sofortigen Versuch mit. Spätestens nach etwa 3 Minuten landet ein dauerhaft fehlschlagendes Bild als leerer Eintrag unter „Zu prüfen“.
- **Worker als Netz:**
  - Der minütliche `AnalyzeBillWorker` bleibt, mit Claim, Versuchszähler (max. 3) und leerem Analyse-Eintrag bei endgültigem Fehlschlag (US-0007).
  - Er sieht ein Bild, das der sofortige Weg gerade bearbeitet, über dessen Claim (`ClaimedUntilUtc`) und lässt es in Ruhe. So wird nichts doppelt analysiert.
  - Ob der Worker weiter über Pub/Sub veröffentlicht oder ebenfalls den gemeinsamen Dienst direkt aufruft, entscheidet der Umsetzende. Bevorzugt ist direkt, mit Begründung im Bericht.
- **Plausibilität (AC5) [Nutzer]:** Die bestehende Regel bleibt unverändert: sichere Ergebnisse werden automatisch Rechnung (`fromAutoAnalysis: true`), sonst entsteht ein `AnalyzedBill`.
- **In Arbeit lesen:** Neuer Endpoint `GET api/bill/analyzed/pending` liefert `[{ id, uploadedAt, state: 'queued' | 'analyzing' }]`.
  - Enthalten sind die eigenen Bilder im Analyse-Speicher (Metadaten `userId`), die noch nicht verarbeitet sind, **nur mit `origin=app`**.
  - **[Entscheidung, Builder-Check]** Bilder vom NAS (`NasBillWorker`) bekommen `origin=nas` und erscheinen nicht unter „In Arbeit“. Ihre Ergebnisse landen trotzdem wie bisher in „Zu prüfen“ bzw. „Angelegt“.
  - `analyzing` bedeutet: Claim aktiv. `uploadedAt` kommt aus dem eigenen Metadaten-Eintrag.
  - **[Technik]** `ListImagesAsync` liest den ganzen Container mit Metadaten, ohne Index pro Benutzer. Bei der Datenmenge dieser App ist das in Ordnung. Ein Index wäre eine spätere Optimierung.
- **Ergebnis einem Upload zuordnen:**
  - Das Frontend muss erkennen, ob aus einem Upload eine Rechnung oder ein Analyse-Eintrag wurde.
  - Dafür bekommen `Bill` und `AnalyzedBill` eine nullable Spalte `SourceUploadId` (die Bild-ID). Migration ohne Datenänderung.
  - `GET api/bill/analyzed/today` liefert für heute (lokaler Tag über `tz` wie in US-0008) automatisch angelegte Rechnungen: `[{ billId, sourceUploadId, shopName, price, date, createdAt }]`, nur `fromAutoAnalysis`.
  - Die bestehende Analyse-Liste liefert `sourceUploadId` mit.

## 4. Tab „Analyse“ (Frontend) — AC7–AC9

Drei Abschnitte, jeder nur sichtbar, wenn er Einträge hat. Sind alle leer, erscheint der Leerzustand: „Keine Analysen – fotografiere Rechnungen mit dem Kamera-Knopf.“

1. **In Arbeit:**
   - Lokale Einträge aus dem `AnalysisUploadService` plus `pending` vom Server. Damit bleibt die Liste auch nach einem Neuladen oder von einem zweiten Gerät aus richtig.
   - Zeile: Vorschaubild (48 px, rund 8, nur bei lokal bekannten Bildern, sonst ein Belegsymbol), Text „Wird hochgeladen · 45 %“ mit determiniertem `mat-progress-bar`, bzw. „Wird analysiert …“ mit indeterminiertem Balken. Bei Fehler „Upload fehlgeschlagen“ mit den Aktionen aus §2.
2. **Zu prüfen:** die bestehende Analyse-Liste (US-0007) mit Übernehmen und Verwerfen. Endgültig fehlgeschlagene Analysen (leerer Eintrag mit Foto) erscheinen hier.
3. **Angelegt:**
   - Inhalt: `analyzed/today`, ohne die lokal als erledigt markierten Einträge.
   - Zeile: Shop, Betrag, Datum und das Symbol „automatisch angelegt“.
   - Ein Tipp öffnet `/bill/<id>`, dort sind Positionen und Bearbeiten sofort verfügbar.
   - „Erledigt“ per Wischen oder Button **[Entscheidung: Button rechts]** blendet den Eintrag aus.
   - **[Entscheidung]** „Erledigt“ wird lokal gespeichert, in `localStorage` pro Gerät und Tag, ohne Backend.
   - Nach Mitternacht ist der Abschnitt automatisch leer, weil der Endpoint nur den heutigen Tag liefert.

**Aktualisierung (AC8):**

- Solange „In Arbeit“ Einträge hat, fragt der Tab alle **3 Sekunden** `pending`, die Analyse-Liste und `today` ab **[Entscheidung]**.
- Nach 2 Minuten ohne Änderung fragt er nur noch alle 15 Sekunden **[Entscheidung, Builder-Check]**.
- Ein Eintrag, der länger als 2 Minuten „Wird analysiert …“ zeigt, bekommt den Zusatz „dauert länger als üblich“.
- Verschwindet ein Upload aus `pending`, wird er über `sourceUploadId` dem neuen Eintrag in „Zu prüfen“ oder „Angelegt“ zugeordnet und dort kurz hervorgehoben.
- Ist nichts mehr in Arbeit, hört das Abfragen auf.
- Läuft die App im Hintergrund (`document.hidden`), pausiert das Abfragen.

**Badge (AC9):** zählt „In Arbeit“ und „Zu prüfen“. Die Zahl stimmt auch, wenn der Tab nicht offen ist: Der `AnalysisUploadService` fragt im selben 3-Sekunden-Takt, solange er lokale Uploads hat.

**Übernehmen:**

- Wie in US-0007: Formular mit Foto und Werten, `analyzedBillId`.
- Neu sind die Positionen (§5).
- Nach dem Speichern geht es zurück zum Tab Analyse (US-0007 §9).

> **Change Request 2026-11-06 [Nutzer]:** Der Tab heißt jetzt „Scans“; die Route `/bill/analysis` bleibt (Share-Target,
> Deep Links, Verlauf). Über den Abschnitten stehen zwei Buttons, außerhalb von `app-load-state` und damit auch leer, beim
> Laden und bei Fehler sichtbar: „Foto aufnehmen“ (`photo_camera`, `capture="environment"`, ohne `multiple`) und „Aus
> Galerie“ (`photo_library`, `multiple`, ohne `capture`). Beide laden über `AnalysisUploadService.uploadAll` hoch, wie
> der Dock-Knopf. Mobil stehen sie nebeneinander, am Desktop linksbündig. Der Leertext lautet jetzt „Keine Scans –
> fotografiere Rechnungen mit dem Kamera-Knopf oder wähle sie aus der Galerie.“ Der Prozess heißt weiter „Analyse“
> („Analyse läuft“, „Analyse-Konfidenz“).

## 5. Positionen — AC10–AC16

### 5.1 Daten und Backend (Shopping) [Technik]

- `BillLineItem` und `AnalyzedBillLineItem` werden ergänzt:
  - `Position` (int) für die Reihenfolge. Die Analyse vergibt sie in der erkannten Reihenfolge.
  - `Description` wird Unicode (`nvarchar(200)`).
  - Eine Migration für beides, ohne Datenänderung. Bestehende Zeilen bekommen `Position` 0.
- **Bereinigung beim Anlegen** (automatisch angelegte Rechnung, Analyse-Eintrag, Übernahme):
  - Positionen ohne Beschreibung (leer nach Trim) werden weggelassen.
  - Beschreibungen über 200 Zeichen werden gekürzt.
  - Negative Preise sind erlaubt (Rabatt, Pfand).
  - Menge 0 oder negativ wird zu `null`.
- **Anlegen und Ändern einer Rechnung (multipart `POST`/`PUT api/bill/`):**
  - Neues optionales Formularfeld `lineItems` mit einem JSON-String `[{ description, quantity, unitPrice, totalPrice }]` in Anzeigereihenfolge.
  - Das Frontend muss `JSON.stringify` explizit aufrufen. Heute setzt `getRecordOfProperties`/`formData.set` jedes Feld einzeln und würde aus einem Array „[object Object]“ machen.
  - Bei `PUT` gilt **Ersetzen**. Fehlt das Feld, bleiben die Positionen unverändert. Ein leeres Array löscht sie.
  - Ungültiges JSON ergibt 400.
  - Ein idempotenter Retry eines `POST` mit gleicher ID (bestehendes Verhalten) ignoriert `lineItems`.
- **Validator** (läuft seit US-0008 Task 6b):
  - höchstens 200 Positionen;
  - `description` 1–200 Zeichen nach Trim;
  - `quantity` ≥ 1, wenn gesetzt;
  - Preise beliebig.
  - Das Frontend schickt bereits bereinigte Positionen, siehe Bereinigung oben.
- **DTO:** Das bestehende `BillLineItemDto` wird zu `BillLineItemDto(Guid Id, string Description, int? Quantity, double? UnitPrice, double? TotalPrice)`, sortiert nach `Position`.
  - **Liste:** `GET api/bill/` liefert **keine** Positionen mehr (eigenes Listen-Mapping), das hält die Liste schlank.
  - **Detail:** `GET api/bill/{id}` liefert sie.
- **Suche:** Der bestehende Filter bekommt zusätzlich `|| bill.LineItems.Any(l => l.Description.Contains(search))`.
  - Summen und Monatssummen (US-0008) nutzen dieselbe Abfrage.
  - Bei aktiver Suche liefert jede Rechnung `MatchedLineItem: { description, totalPrice }?`, die erste passende Position nach `Position`. Passen nur Shop oder Notiz, ist es `null`.
- **Rechte:** wie bei Rechnungen. Positionen werden nur über die Rechnung verändert.
- **Löschen:** Cascade von der Rechnung (besteht) und „Benutzerdaten löschen“ (US-0008). Ein Test prüft beides.

### 5.2 Übernahme (Frontend)

- `BillCreatePrefill.lineItems?: BillLineItemDraft[]` kommt aus `analyzed-bill-details`, bereinigt wie in §5.1.
- **Großes Formular:** Ein einklappbarer Abschnitt „Positionen (12)“, eingeklappt. Aufgeklappt ist er bearbeitbar wie in §5.4. Beim Speichern gehen die Positionen als `lineItems` mit.
- **„Duplizieren“ (US-0008)** übernimmt keine Positionen **[Entscheidung]**.
- Die Schnellerfassung bleibt unverändert.

### 5.3 Anzeige in den Rechnungsdetails — AC11, AC12, AC14, AC16

- **Abschnitt „Positionen“**, nur sichtbar, wenn Positionen vorhanden sind. Zeile:
  - Beschreibung links, mehrzeilig erlaubt;
  - darunter klein „2 × 1,49 €“, wenn Menge und Einzelpreis bekannt sind;
  - Gesamtpreis rechts, fett, negative in `--pos` (Rabatt).
  - Gestaltung wie die Positionsliste der Analyse-Detailseite, mit Tokens.
- Am Ende „Summe der Positionen: 41,27 €“.
- **Abweichung (AC12):** Weicht die Summe um mehr als 0,01 € vom Rechnungsbetrag ab, steht darunter dezent „Weicht vom Rechnungsbetrag ab (42,00 €)“ in `--mut`. Positionen ohne Gesamtpreis zählen nicht.
- **Filter (AC14):**
  - Ab 8 Positionen gibt es das Filterfeld „Positionen durchsuchen“, ohne Groß-/Kleinschreibung, mit Hervorhebung.
  - Mit `?q=` aus der Listensuche ist der Begriff vorbelegt. Unter 8 Positionen werden die Treffer nur hervorgehoben.
- **Partner-Rechnungen:** nur lesend.
- **Laden:** Die Detailseite lädt die Rechnung für die Positionen per `GET api/bill/{id}` nach, auch nach Neuladen. Wie das mit dem Listen-Kontext zusammengeht, entscheidet der Umsetzende.

### 5.4 Bearbeiten — AC13 **[Entscheidung]**

- Im Bearbeiten-Modus einer eigenen Rechnung (und im großen Formular) wird jede Position zur Zeile mit:
  - Beschreibung (Pflicht);
  - Menge (optional, ganze Zahl ≥ 1);
  - Gesamtpreis (optional, Komma erlaubt, auch negativ);
  - Entfernen (×) **ohne Rückfrage**, wirksam beim Speichern. „Abbrechen“ stellt den alten Stand wieder her.
- Darunter steht „Position hinzufügen“.
- **Einzelpreis:** Er wird nicht angezeigt. Ändern sich Menge oder Gesamtpreis, wird er verworfen (`null`).
- Feldfehler: „Pflichtfeld“, „Ungültiger Wert“ (`.field-error`).

### 5.5 Suche in der Rechnungsliste — AC15

- Liefert eine Rechnung `matchedLineItem`, zeigt die Zeile eine dritte, kleine Zeile in `--mut` mit Such-Icon: „Druckerpatronen XL · 34,99 €“, auf eine Zeile gekürzt.
- Ein Tipp öffnet `/bill/<id>?q=<Suchbegriff>`.
- Ohne Suchbegriff bleibt die Liste wie heute. Der lange Druck (US-0008 Change Request) bleibt.

## 6. Tests und Prüfung — AC17, AC18

- **Backend (Shopping.Tests, SQLite):**
  - Upload liefert eine ID und stellt sie in die Warteschlange.
  - Der Hosted Service verarbeitet sofort: Analyse-Dienst per NSubstitute, Rechnung bzw. Analyse-Eintrag mit `SourceUploadId` und Positionen in Reihenfolge, bereinigt.
  - Kein Doppel-Verarbeiten mit dem Worker (Claim).
  - `pending` liefert nur eigene, unverarbeitete Bilder mit `queued`/`analyzing`.
  - `today` nach lokalem Tag (`tz`).
  - Positionen beim Anlegen und Ändern: Ersetzen, fehlendes Feld, leeres Array, ungültiges JSON 400, Validator über die Pipeline.
  - Liste ohne, Detail mit Positionen.
  - Suche über Positionen mit `MatchedLineItem`, Summen inklusive.
  - Partner nur lesend.
  - Löschen und Benutzerdaten löschen.
  - Der entfernte Endpoint `analyze` ist weg.
- **Frontend (Vitest):**
  - Mehrfach-Upload mit Fortschritt, Snackbar-Texte, Offline-Meldung, fehlgeschlagener Upload mit Wiederholen.
  - Share Target mit mehreren Dateien.
  - Analyse-Tab: drei Abschnitte, Abfragen alle 3 Sekunden nur bei „In Arbeit“, Pause im Hintergrund, Zuordnung über `sourceUploadId`, „Erledigt“ lokal, Badge.
  - Übernahme mit Positionen.
  - Detail-Anzeige, Summe, Abweichung.
  - Filter ab 8 und `?q=`.
  - Bearbeiten: entfernen, hinzufügen, Abbrechen, Einzelpreis verwerfen.
  - Listenzeile mit Treffer.
- **UI-Prüfung (390 und 1440 px):**
  - Lokal fehlen KI-Dienst und Dapr. Uploads gehen echt an den lokalen Monolith.
  - `pending`, `today` und die Analyse-Liste werden im Browser per Playwright-Route gestubbt, sodass der Ablauf „In Arbeit → Zu prüfen/Angelegt“ sichtbar wird.
  - Für Positionen werden Rechnungen per SQL in LocalDB angelegt und wieder entfernt.

## 7. Dem Umsetzenden überlassen

- Name und Form des gemeinsamen Analyse-Dienstes und des Hosted Service.
- Ob der Worker Pub/Sub behält (§3).
- Wie die Detailseite die Positionen nachlädt.
- Exakte Gestaltung der Zeilen im Rahmen der Tokens.
- Migrationen.

## 8. Entscheidungen zur Prüfung durch den Nutzer

- Der synchrone Scan wird ganz entfernt, im Frontend und im Backend-Endpoint `analyze`.
- Die Analyse startet sofort im Prozess ohne Dapr. Der Worker bleibt als Netz.
- Der Analyse-Tab hat drei Abschnitte. Der Fortschritt in % gilt nur für den Upload, die Analyse zeigt einen laufenden Balken.
- „Angelegt“ zeigt den heutigen Tag. „Erledigt“ wird nur lokal pro Gerät gespeichert.
- Abfragen alle 3 Sekunden, nur solange etwas in Arbeit ist, und pausiert im Hintergrund.
- Positionen ohne Beschreibung werden weggelassen, negative Preise sind erlaubt.
- Bearbeiten der Positionen mit Entfernen ohne Rückfrage, wirksam beim Speichern.
- Filterfeld ab 8 Positionen, Treffer-Zeile in der Liste, „Duplizieren“ ohne Positionen.
