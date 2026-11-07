# US-0011 Design: Begründung im Scan-Tab

Status: Entwurf, 2026-11-07. Die Nutzerin hat auf Rückfragen verzichtet („leg eine Story an und starte“). Alle Entscheidungen unten sind deshalb meine, markiert mit *(meine Entscheidung)*.

## 1. Ziel und Warum

Seit US-0009 legt die Analyse eindeutige Fotos automatisch als Rechnung an. Alles andere landet im Tab „Scans“ unter „Zu prüfen“, bisher ohne Hinweis, woran es lag. Wer einen Scan prüft, soll sofort sehen, was fehlt oder unsicher ist, und weiß dann, was vor „Als Rechnung übernehmen“ zu kontrollieren ist.

- **Ziel:** pro Scan unter „Zu prüfen“ die Gründe, kurz in der Liste und ausführlich in der Detailansicht.
- **Nicht-Ziel:** die Schwellen ändern, neu analysieren, Begründungen für automatisch angelegte Rechnungen.
- **Anti-Ziel:** Gründe, die nicht zur tatsächlichen Entscheidung passen. Die Begründung darf nie behaupten, etwas fehle, wenn die Analyse aus einem anderen Grund nicht angelegt hat.

## 2. Ist-Zustand (aus dem Code)

Die Entscheidung fällt in `BillAnalysisProcessor.ProcessAsync`. Angelegt wird, wenn `InvoiceAnalysisResult.IsReasonableResult()` zutrifft **und** `GetCategoryClassification` eine gültige Kategorie liefert.

`IsReasonableResult()` verlangt:
- Shop (`VendorName`) nicht leer
- Datum (`InvoiceDate`) vorhanden
- Betrag (`TotalAmount`) vorhanden und > 0
- `Confidence` > 0,75
- Summe der Positionen = Betrag (Toleranz 5,0) **oder** `TotalAmountConfidence` > 0,6

Die Kategorie fehlt, wenn die klassifizierte Kategorie oder Unterkategorie nicht zu den Kategorien der Nutzerin gehört.

Daneben legt `FailedAnalysisImageHandler` bei fehlgeschlagener Analyse einen leeren Scan an (alle Felder `null`).

**Warum die Gründe beim Anlegen gespeichert werden und nicht beim Lesen berechnet:** `AnalyzedBill` setzt ein fehlendes Datum auf `DateTime.UtcNow` (`Date = date ?? DateTime.UtcNow`). „Datum nicht erkannt“ lässt sich aus gespeicherten Daten deshalb nicht mehr ablesen. Auch die Positionssumme der Entscheidung läuft über die rohen Positionen, gespeichert sind die bereinigten.

## 3. Gründe

Ein Enum `NotCreatedReason` im Shopping-Service, in dieser Reihenfolge (sie ist auch die Anzeigereihenfolge):

| Code | Bedingung | Kurztext (Liste) | Satz (Detail) |
|---|---|---|---|
| `AnalysisFailed` | Analyse fehlgeschlagen (`FailedAnalysisImageHandler`) | Analyse fehlgeschlagen | Das Foto konnte nicht ausgewertet werden. Bitte die Daten selbst eintragen. |
| `ShopMissing` | `VendorName` leer | Shop fehlt | Der Shop wurde nicht erkannt. |
| `DateMissing` | `InvoiceDate` fehlt | Datum fehlt | Das Datum wurde nicht erkannt. |
| `AmountMissing` | `TotalAmount` fehlt oder ≤ 0 | Betrag fehlt | Der Betrag wurde nicht erkannt. |
| `LowConfidence` | `Confidence` fehlt oder ≤ 0,75 | Analyse unsicher | Die Analyse ist sich insgesamt zu unsicher. |
| `AmountUncertain` | Summe der Positionen ≠ Betrag **und** `TotalAmountConfidence` fehlt oder ≤ 0,6 | Betrag unsicher | Der Betrag ist unsicher erkannt, und die Positionen ergeben nicht diesen Betrag. |
| `CategoryUnclear` | keine gültige Kategorie | Kategorie unklar | Es wurde keine passende Kategorie gefunden. |

- `AnalysisFailed` steht immer allein.
- `AmountUncertain` wird nur geprüft, wenn ein Betrag > 0 erkannt wurde. Sonst gilt schon `AmountMissing`. *(meine Entscheidung, sonst stünde bei fehlendem Betrag zweimal dasselbe)*
- Das Frontend zeigt Kurztext und Satz. Prozentwerte der Sicherheit kommen nicht in den Text, die Detailansicht zeigt die Konfidenz schon heute als Balken. *(meine Entscheidung)*

## 4. Backend

**Eine Regel-Quelle.** Eine neue statische Klasse `AutoCreationRules` (Ordner `Requests/Bill/AnalyzeBill/`) enthält die Schwellen und liefert für ein Analyse-Ergebnis und die Information „Kategorie gültig“ die Liste der Gründe:

```
IReadOnlyList<NotCreatedReason> AutoCreationRules.Evaluate(InvoiceAnalysisResult result, bool categoryValid)
```

- `BillAnalysisProcessor` entscheidet künftig mit `Evaluate(...).Count == 0`. `IsReasonableResult()` wird dafür auf dieselbe Regel umgestellt bzw. durch sie ersetzt, sodass es nur noch eine Stelle mit Schwellen gibt. Das Verhalten bleibt gleich (AC6). Die bestehenden Tests in `ImmediateAnalysisTests` und `AnalysisTests` müssen unverändert grün bleiben.
- `LineItemSumEqualsTotalAmount` (Toleranz 5,0) bleibt, wie es ist.

**Speichern.** `AnalyzedBill` bekommt `NotCreatedReasons` (`IReadOnlyList<NotCreatedReason>?`). Als Speicherform dient eine EF-Core-„Primitive Collection“ in einer JSON-Spalte, mit den Enum-Werten als Strings (Context7, EF-Core-Doku: Primitive Collections ab EF 8, privates `List<T>`-Feld hinter `IReadOnlyList<T>` ab EF 9, Enums in JSON standardmäßig als int, daher `HasConversion<string>()` auf dem Elementtyp).
- `null` bedeutet „vor diesem Update angelegt“. Die Spalte ist nullable, eine Migration fügt sie hinzu, ohne vorhandene Daten zu ändern.
- `BillAnalysisProcessor.CreateAnalyzedBillAsync` speichert die Gründe aus `Evaluate`. `FailedAnalysisImageHandler` speichert `[AnalysisFailed]`.

**Alte Scans (Spalte `null`).** Hier leitet das Backend die Gründe beim Lesen aus den gespeicherten Feldern ab, mit einer zweiten Methode der Regel-Klasse *(meine Entscheidung, damit auch schon vorhandene Scans eine Begründung haben)*:
- `Confidence == null` und `ShopName`, `Price` leer → `[AnalysisFailed]`.
- Sonst dieselben Regeln auf die gespeicherten Werte, **ohne** `DateMissing`, denn das gespeicherte Datum ist immer gesetzt. Die Positionssumme kommt aus den gespeicherten Positionen. `CategoryUnclear`, wenn `CategoryId` `null` ist.

**API.** `AnalyzedBillDto` bekommt am Ende `IReadOnlyCollection<string> NotCreatedReasons`, die Enum-Namen als Strings. Das Projekt hat keinen globalen `JsonStringEnumConverter`, Strings sind darum explizit.
- Gefüllt wird das Feld in `AnalyzedBillDtoMapping`, das als Expression in der EF-Projektion läuft. Wenn der Aufruf der Regel-Methode dort nicht übersetzbar ist, darf der Handler die Gründe nach `ToListAsync` ergänzen. Entscheidend ist, dass `GET .../analyzed` sie liefert.
- Das Feld kommt nur hinzu, die Änderung ist abwärtskompatibel. Automatisch angelegte Rechnungen und `today`/`pending` bleiben unverändert.

## 5. Frontend

- **DTO:** `BillAnalyzedDtoBase` bekommt `notCreatedReasons?: string[]`.
- **Texte:** eine reine Funktion in `features/bill-analysis/functions/` (neben `analyzed-bill-functions.ts`) bildet Codes auf Kurztext und Satz ab, Texte wie in §3. Sie behält die Reihenfolge der API und ignoriert unbekannte Codes (AC5).
- **Liste „Zu prüfen“ (`analyzed-bill-list-item`):** eine dritte Zeile unter Kategorie/Konfidenz mit einem kleinen Info-Symbol und den Kurztexten, verbunden mit „ · “. Sie ist einzeilig und wird mit Auslassungspunkten abgeschnitten, in gedämpfter Farbe nach `DESIGN.md`.
  - Die Liste ist virtuell gescrollt mit fester Zeilenhöhe (`pixelHeightPerItem = 64`). Diese Höhe steigt für **alle** Zeilen auf den Wert, der eine dritte Zeile aufnimmt. SCSS-Kommentar und Konstante ändern sich gemeinsam. Auch Zeilen ohne Gründe behalten diese Höhe, damit das virtuelle Scrollen stimmt. *(meine Entscheidung, die Alternative wäre variable Höhe mit Autosize, das ist für so wenig Nutzen zu viel)*
- **Detailansicht (`analyzed-bill-details`):** oben im Info-Bereich, vor „Kategorie“, ein Hinweis-Block mit dem Titel „Nicht automatisch angelegt“ und den Sätzen als Liste. Er ist ruhig gestaltet (Info-Ton, kein Fehler-Rot) und erscheint nur, wenn es Gründe gibt.
- **Barrierefreiheit:** Das Info-Symbol hat `aria-hidden`. Die Kurz-Zeile ist normaler Text, damit Screenreader sie mit der Zeile vorlesen.
- Die Abschnitte „In Arbeit“ und „Angelegt“ bleiben unverändert.

## 6. Tests

- **Backend (xUnit, SQLite wie in `TestDb`):**
  - `AutoCreationRules.Evaluate`: jeder Grund einzeln, Kombinationen, die Grenzwerte (0,75 / 0,6 / Toleranz 5,0 / Betrag 0), `AnalysisFailed` allein.
  - Ableitung für alte Scans.
  - Processor speichert die Gründe, und ein angelegter Scan hat keine.
  - `FailedAnalysisImageHandler` speichert `[AnalysisFailed]`.
  - `GET analyzed` liefert `NotCreatedReasons` für neue und alte Scans.
  - Die bestehenden Analyse-Tests bleiben grün.
- **Frontend (Vitest):**
  - Text-Funktion: Reihenfolge, unbekannte Codes.
  - Listenzeile mit und ohne Gründe.
  - Detail-Hinweis mit und ohne Gründe.
  - Mapping des DTO.
- **UI (Playwright, 390 px und 1440 px):** Liste mit Gründen, abgeschnittene lange Zeile, Detail-Hinweis, Scan ohne Gründe.

## 7. Offen für die Umsetzung

- Die genaue neue Zeilenhöhe (Vorgabe: dritte Zeile mit 12–13 px Schrift, so knapp wie lesbar).
- Ob `IsReasonableResult()` entfällt oder auf `AutoCreationRules` delegiert. Beides ist erlaubt, solange die Schwellen nur an einer Stelle stehen.

## 8. Bekannte Grenze

Fehlt das Datum, setzt ein Scan heute weiterhin das aktuelle Datum. Die Liste zeigt dann ein Datum, das gar nicht erkannt wurde. Mit dieser Story steht wenigstens „Datum fehlt“ daneben. Den Default zu ändern ist nicht Teil dieser Story.
