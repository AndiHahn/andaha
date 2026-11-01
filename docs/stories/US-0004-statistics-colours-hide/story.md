# US-0004: Rechnungsstatistik – Kategoriefarben korrigieren und Kategorien ausblenden

| Field | Value |
|-------|-------|
| ID | US-0004 |
| Status | In Review <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-01 |
| Design Doc | [design.md](./design.md) |
| Plan | [plan.md](./plan.md) |

## Description

Als Nutzer:in des MiniClients möchte ich, dass die Rechnungsstatistik jede Kategorie in ihrer konfigurierten Farbe zeigt. Außerdem möchte ich einzelne Kategorien vorübergehend ausblenden können: Eine sehr große Kategorie soll die anderen im Ringdiagramm nicht unsichtbar machen.

**Fehlerbild (nur PROD):** In der Legende hat nur die erste Zeile eine Farbe, und zwar Rot statt der konfigurierten Farbe. Die anderen Zeilen haben gar keine Farbe.

**Ursache (nachgestellt):** `GET expenses` zählt auch Rechnungen **verbundener Benutzer** (Collaboration) mit und gruppiert nach Kategoriename. Die Kategorienliste im Client enthält nur die **eigenen** Kategorien. Taucht eine Kategorie auf, die nur der verbundene Benutzer hat, liefert `ChartComponent.refreshChart()` bei `categories.find(...)!.color` eine `TypeError`. Dann bleibt der Platzhalter-Datensatz `backgroundColor: ['red']` stehen. Auf DEV gibt es keinen verbundenen Benutzer, deshalb tritt der Fehler dort nicht auf.

## Acceptance Criteria

**Farben**

- [x] AC1: Jede Kategorie in Ring und Legende hat ihre Farbe. Für eigene Kategorien ist das die in den Einstellungen konfigurierte Farbe.
- [x] AC2: Für Kategorien, die nur ein verbundener Benutzer hat, wird dessen konfigurierte Farbe verwendet. Gibt es eine eigene Kategorie mit gleichem Namen, gewinnt die eigene Farbe.
- [x] AC3: Eine unbekannte Kategorie oder eine fehlende Farbe führt nie zu einem Fehler. Diese Kategorie bekommt eine neutrale Ersatzfarbe, alle anderen bleiben korrekt.

**Ausblenden**

- [x] AC4: Jede Legendenzeile hat ein eigenes Augen-Symbol zum Aus- und Einblenden. Ein Tipp auf den Rest der Zeile öffnet weiterhin die Kategorie-Details.
- [x] AC5: Eine ausgeblendete Kategorie verschwindet aus dem Ring. In der Legende bleibt sie ausgegraut stehen und lässt sich dort wieder einblenden.
- [x] AC6: Summe in der Ringmitte und Prozente beziehen sich nur auf die sichtbaren Kategorien.
- [x] AC7: Das Ausblenden ist vorübergehend. Beim Wechsel des Zeitraums bleibt es erhalten, nach Verlassen der Statistikseite ist wieder alles sichtbar. Es wird nichts gespeichert.
- [x] AC8: Ein Klick in ein Ringsegment öffnet die Details der richtigen Kategorie, auch wenn davor Kategorien ausgeblendet sind.

**Allgemein**

- [x] AC9: Unit-Tests decken Farbauflösung, Ausblenden sowie Summe/Prozente ab. Frontend-Build und -Tests sowie der Backend-Build laufen grün.

## Technical Notes

- Backend: `src/Services/Shopping/Andaha.Services.Shopping/Requests/Expense/` (`GetExpensesQueryHandler`, `ExpenseDto`). Neues Feld `Color`.
- Frontend: `src/WebApps/MiniClient/Andaha.WebApps.MiniClient/src/app/features/bill/modules/expenses/` (`expenses.component`, `chart/chart.component`), `api/shopping/dtos/ExpenseDto.ts`.
- Die bestehende Kategorie-Einstellung „Aufnehmen in Statistik“ bleibt unverändert. Sie schließt Kategorien dauerhaft serverseitig aus.

## Out of Scope

- Ausgeblendete Kategorien dauerhaft speichern (Local Storage oder Backend)
- Änderungen an der Gruppierung nach Kategoriename oder an der Collaboration-Logik
- Andere Statistiken (Stunden-Statistik)

## UI Verification

**2026-11-01 – PASSED** (Playwright MCP, `ng serve` lokal, API per Playwright-Route gemockt, Login per Fake-Token im Local Storage). Testdaten: eigene Kategorien, dazu „Garten“ nur beim verbundenen Benutzer (Farbe `purple` vom Backend) und „Alt“ ohne Farbe (älteres Backend). Jeder Check lief bei 390 × 844 und bei 1440 × 900.

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Legende und Ring in den konfigurierten Farben, fremde Kategorie in Partner-Farbe, Kategorie ohne Farbe in `grey`, kein Fehler | PASS | `ui-testing/colours-390.png`, `ui-testing/colours-1440.png` |
| 2 | Augen-Button „Wohnen ausblenden“ → Wohnen raus aus dem Ring, Zeile ausgegraut mit „–“, Label „Wohnen einblenden“, Summe 5.040,00 → 840,00 €, Prozente neu (62/21/12/5 %) | PASS | `ui-testing/hidden-wohnen-390.png`, `ui-testing/hidden-wohnen-1440.png` |
| 3 | Echter Klick auf Ringsegment 0 bei ausgeblendetem Wohnen → Details „Lebensmittel“ | PASS | |
| 4 | Tipp auf ausgeblendete Zeile → Details „Wohnen“ | PASS | |
| 5 | Zeitraumwechsel (2. Request) → Wohnen bleibt ausgeblendet, Summe 400,00 € | PASS | |
| 6 | Wieder einblenden → 71 %, Summe 1.400,00 € | PASS | |
| 7 | Seite verlassen und zurück → nichts mehr ausgeblendet | PASS | |
| 8 | Keine Dokument-Scrollbar | PASS | |

Konsole: Es gibt nur den Dev-Mode-Hinweis `NG0100` am Ausdruck `!isLoading && expenses.length == 0` beim Laden des Zeitraums. Den gab es schon vorher, er kommt nicht von dieser Änderung (Lade-Logik unverändert). Dazu kommen die erwarteten Fehler durch das fehlende Backend und B2C. Nicht im Browser geprüft: die echte EF-Abfrage. Ihre SQL-Übersetzung hat der Final Review offline per `ToQueryString()` geprüft (`COALESCE((SELECT MIN(Color) …), 'grey')`).

## AI Usage

See [ai-usage.md](./ai-usage.md).
