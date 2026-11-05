# US-0009: Rechnungspositionen aus der Analyse in der Rechnung behalten und anzeigen

| Field | Value |
|-------|-------|
| ID | US-0009 |
| Status | Open <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-05 |
| Design Doc | — <!-- link to ./design.md once brainstorming is done --> |

## Description

Als Nutzer:in der MiniClient-PWA möchte ich bei einer eingescannten Rechnung auch nach dem Speichern sehen, welche Positionen darauf standen. Dann kann ich später nachschauen, was ich gekauft habe, und muss das Foto nicht öffnen.

Heute erkennt die Analyse die Positionen. Die Detailansicht einer analysierten Rechnung zeigt sie auch (US-0007, AC32). Bei „Als Rechnung übernehmen“ und beim synchronen Scan gehen sie aber verloren. Das Formular übernimmt sie nicht, `CreateBill` speichert keine, und die Rechnungsdetails zeigen keine an. Das Backend hat dafür schon die Entität `BillLineItem`.

Entstanden aus der Rückmeldung zu US-0008 auf DEV (2026-11-05).

## Acceptance Criteria

- [ ] AC1: Bei „Als Rechnung übernehmen“ werden die erkannten Positionen mit der Rechnung gespeichert: Beschreibung, Menge, Einzelpreis und Gesamtpreis, soweit erkannt.
- [ ] AC2: Beim synchronen Scan (Kamera-Knopf, US-0007 AC30) mit erfolgreicher Analyse werden die Positionen ebenfalls mit der Rechnung gespeichert.
- [ ] AC3: Die Rechnungsdetailseite zeigt einen Abschnitt „Positionen“ mit allen Positionen. Ohne Positionen entfällt der Abschnitt.
- [ ] AC4: Weichen die Summe der Positionen und der Rechnungsbetrag voneinander ab, ist das erkennbar, z. B. als dezenter Hinweis. Die Form legt das Design fest.
- [ ] AC5: Ob und wie Positionen bearbeitet, gelöscht oder hinzugefügt werden können, legt das Design fest. Mindestens lässt sich eine falsch erkannte Position entfernen.
- [ ] AC6: Löschen einer Rechnung löscht ihre Positionen, ebenso „Benutzerdaten löschen“ (US-0008 AC31).
- [ ] AC7: Rechnungen verbundener Benutzer zeigen ihre Positionen ebenfalls an, nur lesend, wie die übrigen Felder.
- [ ] AC8: Backend-Tests decken Anlegen mit Positionen, Lesen, Löschen und die Besitzprüfung ab. Frontend-Tests decken die Übernahme der Positionen und die Anzeige ab. Builds und Tests sind grün.
- [ ] AC9: Die UI-Prüfung mit Playwright bei 390 px und 1440 px ist grün. Weil lokal kein KI-Dienst läuft, werden analysierte Rechnungen mit Positionen dafür als Testdaten angelegt.

## Technical Notes

- **Shopping-Backend:**
  - `Core/BillLineItem.cs` mit `BillId`, `Description`, `Quantity`, `UnitPrice` und `TotalPrice` gibt es schon, samt `BillLineItemModelBuilder`. `Core/AnalyzedBillLineItem.cs` hat dieselbe Form.
  - `AnalyzedBillDto.LineItems` wird schon geliefert.
  - `CreateBillCommand` und `UpdateBillCommand` sowie `BillDto` haben noch keine Positionen. Der Request für die Übernahme ist Multipart (`FormData`, Foto und Felder). Die Übertragung der Positionen (z. B. als JSON-Feld) legt das Design fest.
  - Seit US-0008 Task 6b laufen die Validatoren wirklich. Neue Felder brauchen passende Regeln.
- **Frontend:**
  - `BillCreatePrefill` (Felder für Übernahme und Scan) und `add-bill.component`.
  - `bill-details.component`.
  - Die Anzeige in `analyzed-bill-details.component.html` kann als Vorlage dienen.
- **Offline-Speicher aus US-0005:** Eine offline erfasste Rechnung hat keine Analyse, daher keine Positionen. Prüfen, dass das Cache-Format damit klarkommt.
- **Ohne Positionen:** Ältere Rechnungen haben keine Positionen. Die Anzeige muss mit 0 Positionen umgehen können.

## Out of Scope

- Suche, Filter oder Statistik nach Positionen (z. B. „Was habe ich für Milch ausgegeben?“)
- Kategorien pro Position
- Positionen manuell für Rechnungen ohne Scan erfassen, sofern das Design es nicht ausdrücklich aufnimmt
- Verbesserungen an der KI-Erkennung selbst
