# US-0013 Design: Strengere Scan-Regeln, Konfidenzen sichtbar, direkt zu Scans

Stand: 2026-11-08. Entscheidungen des Nutzers sind markiert, meine eigenen mit *(meine Entscheidung)*.

## 1. Ziel und Warum

**Auslöser:** Eine Rechnung über 7,25 €, deren Cent-Stellen abgedeckt waren, wurde automatisch mit 7,00 € angelegt.

**Ursache:** Die heutige Regel (US-0011, `AutoCreationRules`) lässt den Betrag durch, wenn die Summe der Positionen **bis auf 5,00 €** passt oder die Betrags-Konfidenz über 60 % liegt. Shop und Datum werden nur auf „vorhanden“ geprüft, nicht auf Sicherheit.

**Ziele:**
- Strengere Regeln, damit falsch erkannte Beträge nicht mehr automatisch angelegt werden.
- Die Konfidenzen je Feld werden sichtbar.
- Nach einem Foto auf der Rechnungsliste geht es direkt zum Tab „Scans“.

**Anti-Ziel:** Ein falscher Betrag wird stillschweigend als Rechnung angelegt. Lieber landen mehr Scans unter „Zu prüfen“.

## 2. Neue Regeln für das automatische Anlegen

Angelegt wird nur, wenn **alle** Regeln erfüllt sind. Jede verletzte Regel ergibt einen Grund (US-0011-Mechanik).

| # | Regel | Grund (Code) | Herkunft |
|---|---|---|---|
| 1 | Shop vorhanden | `ShopMissing` | bisher |
| 2 | Shop-Konfidenz **≥ 0,75** | `ShopUncertain` *(neu)* | Nutzer: „75 % reicht“ |
| 3 | Datum vorhanden | `DateMissing` | bisher |
| 4 | Datums-Konfidenz **≥ 0,80** | `DateUncertain` *(neu)* | mein Vorschlag, vom Nutzer nicht beanstandet |
| 5 | Datum nicht in der Zukunft (höchstens 1 Tag nach heute, wegen Zeitzonen) | `DateInFuture` *(neu)* | mein Vorschlag |
| 6 | Betrag vorhanden und > 0 | `AmountMissing` | bisher |
| 7 | Der **Rohtext** des Betrags zeigt zwei Nachkommastellen (`\d[.,]\d{2}` am Ende des Zahlteils) | `AmountIncomplete` *(neu)* | mein Vorschlag (trifft den 7,00-€-Fall) |
| 8 | Betrags-Konfidenz **≥ 0,90** reicht allein. Bei **0,60 bis < 0,90** muss die Summe der Positionen **bis auf 0,10 €** (inklusive) zum Betrag passen, und es muss mindestens eine Position geben. Unter **0,60** oder ohne Wert ist der Betrag immer unsicher. | `AmountUncertain` | Nutzer: „auf 10 Cent genau“ und Positionsprüfung nur bei schlechter Betrags-Konfidenz |
| 9 | Gesamt-Konfidenz des Dokuments > 0,75 | `LowConfidence` | bisher |
| 10 | Kategorie gültig | `CategoryUnclear` | bisher |

- Regeln 7 und 8 werden nur geprüft, wenn ein Betrag > 0 vorhanden ist (wie bisher bei `AmountUncertain`).
- Ist der Rohtext unvollständig, wird zusätzlich trotzdem Regel 8 geprüft. Beide Gründe dürfen gemeinsam erscheinen.
- `AnalysisFailed` bleibt unverändert allein.
- **Reihenfolge der Gründe:** die Tabellenreihenfolge oben *(meine Entscheidung)*. Die Codes werden als Namen gespeichert (US-0011). Neue Werte einzufügen und umzusortieren ist deshalb unschädlich. Umbenennen oder Entfernen bleibt verboten.
- **Alle Schwellen** sind benannte Konstanten in `AutoCreationRules`, an einer Stelle (US-0011-Regel).

### 2a. Negative Positionen (Rabatte)

Nutzer-Vorgabe: Rabatt-Zeilen mit Minus-Beträgen müssen richtig in die Summe eingehen.

- Die Positionssumme ist die **vorzeichenrichtige** Summe der Positions-Beträge.
- Ein Betrag zählt als negativ, wenn der Zahlwert negativ ist **oder** der Rohtext des Betrags ein Minus enthält. Das erfasst `-1,00`, `1,00-`, `−1,00` (Unicode-Minus) und `- 1,00`. *(meine Entscheidung)*
  - Grund: Kassenbons schreiben das Minus oft nachgestellt, und die Analyse liefert den Wert dann teils positiv.
- Die Korrektur passiert beim Übernehmen des Analyseergebnisses (`InvoiceAnalysisService`). Damit sind auch die gespeicherten Positionen vorzeichenrichtig, und die Summe in der App stimmt.

### 2b. Alte Scans (abgeleitete Gründe, US-0011)

Für Scans ohne gespeicherte Gründe bleibt die Ableitung wie gehabt. Neu ist nur die Betragsregel 8 mit den gespeicherten Werten, also 0,10 € Toleranz. Die neuen Feld-Konfidenzen sind dort unbekannt. Deshalb entfallen die Regeln 2, 4, 5 und 7 *(meine Entscheidung)*.

## 3. Konfidenzen speichern und anzeigen

**Speichern** *(Nutzer: Vorschlag angenommen)*: `AnalyzedBill` und `Bill` bekommen je drei neue nullable Spalten, die bei Rechnungen nur gefüllt sind, wenn `FromAutoAnalysis` gilt. Eine Migration fügt sie hinzu, ohne vorhandene Daten zu ändern.
- `ShopNameConfidence` (double)
- `DateConfidence` (double)
- `TotalAmountText` (varchar(50), Rohtext des Betrags)

`Confidence` und `TotalAmountConfidence` gibt es schon.

**API:**
- `AnalyzedBillDto` bekommt `ShopNameConfidence`, `DateConfidence` und `TotalAmountText`.
- `BillDto` bekommt `Confidence`, `TotalAmountConfidence`, `ShopNameConfidence`, `DateConfidence` und `TotalAmountText` (alle nullable).
- Die Änderung ist rein additiv.

**Anzeige (Frontend):**
- **Scan-Detail** (`analyzed-bill-details`): Der heutige Balken „Analyse-Konfidenz“ wird ein Block **„Erkennung“** mit je einer Zeile und einem Balken für Shop, Datum, Betrag und Dokument (Prozent, gerundet). Fehlende Werte erscheinen als „–“. Unter dem Betrag steht klein der Rohtext („erkannt: 7,“), wenn er vom formatierten Betrag abweicht *(meine Entscheidung)*.
- **Rechnungs-Detail** (Bill-Detail): Nur bei automatisch angelegten Rechnungen erscheint ein einklappbarer Block **„Automatisch erkannt“** mit denselben Zeilen *(meine Entscheidung: eingeklappt, damit die Detailansicht ruhig bleibt)*.
- **Farben:** Die Balken folgen `DESIGN.md` mit einer ruhigen Ampel: unter der jeweiligen Schwelle warnend, darüber neutral bzw. positiv. Die Schwellen kommen nicht aus dem Backend. Das Frontend kennt sie als Konstanten *(meine Entscheidung, YAGNI)*.
- **Neue Grundtexte** für die Kurz-Zeile und die Detail-Sätze (US-0011-Mechanik `notCreatedReasonTexts`):

| Code | Kurztext | Satz |
|---|---|---|
| `ShopUncertain` | Shop unsicher | Der Shop wurde nicht sicher erkannt. |
| `DateUncertain` | Datum unsicher | Das Datum wurde nicht sicher erkannt. |
| `DateInFuture` | Datum in der Zukunft | Das erkannte Datum liegt in der Zukunft. |
| `AmountIncomplete` | Betrag unvollständig | Beim Betrag fehlen die Cent-Stellen oder sind nicht lesbar. |

Der bestehende Satz zu `AmountUncertain` wird angepasst: „Der Betrag ist unsicher erkannt, und die Positionen ergeben nicht diesen Betrag (Toleranz 0,10 €).“

## 4. Nach dem Foto direkt zu „Scans“

Nutzer-Vorgabe: Wer auf der Rechnungsliste ein Foto aufnimmt, soll direkt den Status im Tab „Scans“ sehen.

- `bill-list` ruft heute `analysisUpload.uploadAll(photos)` auf. Danach erscheint ein Snackbar-Hinweis „Analyse gestartet … [Anzeigen]“. Neu navigiert die App nach dem Start des Uploads sofort zu `/bill/analysis`, dort steht der Upload unter „In Arbeit“. Der Snackbar-Hinweis entfällt in diesem Fall, die Navigation zeigt den Status ja direkt.
- Das gilt für Kamera und Galerie aus der Eingabezeile der Rechnungsliste. Für das **Teilen** („Share Target“) gilt dasselbe *(meine Entscheidung: gleiches Verhalten für jedes Foto, das auf der Liste ankommt)*.
- Ist das Gerät offline, startet kein Upload. Es bleibt bei der Fehlermeldung, und die App navigiert nicht.

## 4a. Präzisierungen nach dem Builder-Check *(alle meine Entscheidung)*

- **Felder:**
  - Shop: `VendorName` (Wert und `Confidence`).
  - Datum: `InvoiceDate`.
  - Betrag: `InvoiceTotal` (`ValueCurrency.Amount`, `Confidence`, `Content`). Der Rohtext ist `DocumentField.Content`, also der Text, wie er auf dem Beleg erkannt wurde.
- **Fehlende Werte bei einer neuen Analyse gelten als unsicher (fail closed).**
  - Ist die Konfidenz von Shop oder Datum `null`, liefert die Regel `ShopUncertain` bzw. `DateUncertain`.
  - Ist der Rohtext des Betrags `null` oder leer, liefert sie `AmountIncomplete`.
  - Nur bei der Ableitung für alte Scans (§2b) entfallen diese Regeln. Dort sind die Werte gar nicht gespeichert, nicht „unsicher“.
- **Positionssumme:** Sie ist die Summe der vorzeichenkorrigierten `TotalPrice` (Feld `Amount`), `null` zählt als 0.
  - „Mindestens eine Position“ heißt: mindestens eine Position mit einem `TotalPrice` ungleich `null`.
  - Die Vorzeichenkorrektur gilt für `TotalPrice`. Ist der korrigierte `TotalPrice` negativ, wird ein positiver `UnitPrice` derselben Position ebenfalls negativ, damit die Anzeige zusammenpasst.
- **„Nicht in der Zukunft“:** Verglichen wird mit dem UTC-Datum über ein injiziertes `TimeProvider`. Erlaubt ist höchstens das UTC-Datum von heute plus 1 Tag, weil Zeitzonen sich bis zu ±14 h verschieben. `Evaluate` bekommt das Bezugsdatum als Parameter, damit es testbar und rein bleibt.
- **Signatur:** `AutoCreationRules.Evaluate` bekommt einen Eingabe-Record mit allen Werten statt einer langen Parameterliste. Alle Aufrufer und Tests werden umgestellt.
- **Speichern:**
  - Scans unter „Zu prüfen“ speichern die drei neuen Werte immer.
  - Rechnungen speichern sie nur, wenn sie automatisch angelegt wurden.
  - Beim manuellen „Als Rechnung übernehmen“ werden sie **nicht** übernommen, weil die Daten dann von einem Menschen bestätigt sind. Die Rechnung gilt nicht als automatisch angelegt.
- **Rohtext-Hinweis im Scan-Detail:** Er erscheint nur, wenn der Scan den Grund `AmountIncomplete` hat. Es gibt keinen Zeichenvergleich mit dem formatierten Betrag.
- **Share Target:** Es läuft schon heute über dieselbe `bill-list`-Komponente und `analysisUpload.uploadAll`. Die Navigation sitzt deshalb an einer Stelle.
- **Prüfung am echten Beleg:** Ob `Content` bei abgedeckten Cents wirklich z. B. „7,“ liefert, zeigt sich am echten Dienst. Der Rohtext wird geloggt und gespeichert, und die Regel ist fail closed. Liefert der Dienst wider Erwarten einen normalisierten Text, greift Regel 7 nicht, und Regel 8 bleibt der Schutz. Das sieht man dann am gespeicherten `TotalAmountText` in der App.

## 5. Tests

- **Backend:**
  - **Regeln:** jede Regel einzeln, inklusive aller Grenzwerte:
    - 0,75 bzw. 0,80 inklusive bestanden
    - 0,90 inklusive
    - 0,60 inklusive mit Positionsprüfung
    - Toleranz 0,10 inklusive und 0,11 nicht
  - **Rohtext:** z. B. „7,“, „7“, „7,2“, „7,25“, „7.25“, „EUR 7,25“, „7,25 €“.
  - **Datum:** in der Zukunft.
  - **Rabatte:** Positionen mit negativen Beträgen und nachgestelltem Minus.
  - **Gleichwertigkeit:** Der Test aus US-0011 wird auf die neue Formel umgestellt. Er vergleicht weiter gegen ein unabhängiges Orakel.
  - **Abbildung im Analyse-Service:** Konfidenzen, Rohtext und Vorzeichen.
  - **Speicherung und DTOs:** für Scan und automatisch angelegte Rechnung.
  - **Ableitung bei alten Scans.**
- **Frontend:**
  - Block „Erkennung“ im Scan-Detail, mit und ohne Werte, inklusive Rohtext-Hinweis.
  - Block „Automatisch erkannt“ nur bei automatisch angelegten Rechnungen.
  - Neue Grundtexte.
  - Navigation nach Upload, nicht offline.
- **UI-Prüfung** mit Playwright bei 390 px und 1440 px: Scan-Detail, Rechnungs-Detail und Navigation nach dem Foto.

## 6. Bekannte Grenzen

- Die Schwellen sind Startwerte. Mit den gespeicherten Feld-Konfidenzen lassen sie sich später an echten Daten nachjustieren.
- Die Rohtext-Regel setzt voraus, dass Beträge mit Cent-Stellen gedruckt werden. Bei glatten Beträgen ist das auf Kassenbons in Österreich und Deutschland üblich, z. B. „7,00“.
- Bestehende automatisch angelegte Rechnungen bekommen keine nachträglichen Feld-Konfidenzen. Der Block erscheint nur, wenn Werte vorhanden sind.
