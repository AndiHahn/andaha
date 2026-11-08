# US-0013: Strengere Scan-Regeln, Konfidenzen sichtbar, direkt zu Scans

| Field | Value |
|-------|-------|
| ID | US-0013 |
| Status | In Review <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-08 |
| Design Doc | [design.md](./design.md) |
| Plan | [plan.md](./plan.md) |

## Description

Drei Erweiterungen rund um das Scannen von Rechnungen:

1. Wer auf der Rechnungsliste ein Foto aufnimmt, landet danach direkt im Tab „Scans“ und sieht dort den Status der Analyse.
2. Nach der Analyse sind die Konfidenzwerte der einzelnen Felder sichtbar (z. B. Shop, Datum, Betrag).
3. Die Regeln für das automatische Anlegen werden strenger. Anlass: Eine Rechnung über 7,25 € mit abgedeckten Cent-Stellen wurde automatisch mit 7,00 € angelegt. Die Summe der Positionen wird gegen den Endbetrag geprüft, aber nur dann, wenn der Endbetrag eine zu schlechte Konfidenz hat.

## Acceptance Criteria

- [x] AC1: Automatisch angelegt wird nur, wenn alle Regeln aus design.md §2 erfüllt sind:
  - Shop-Konfidenz ≥ 0,75 und Datums-Konfidenz ≥ 0,80, Datum nicht in der Zukunft.
  - Der Rohtext des Betrags zeigt zwei Nachkommastellen.
  - Betrags-Konfidenz ≥ 0,90, oder 0,60 bis < 0,90 und die Summe der Positionen passt auf 0,10 € genau.
  - Dokument-Konfidenz > 0,75, Kategorie gültig.

  Fehlende Werte gelten als unsicher.
- [x] AC2: Ein Beleg über 7,25 € mit abgedeckten Cent-Stellen (Rohtext „7,“ bzw. ohne Cent) wird nicht automatisch angelegt, sondern landet unter „Zu prüfen“ mit dem Grund „Betrag unvollständig“.
- [x] AC3: Positionen mit Minus-Beträgen (Rabatte), auch mit nachgestelltem Minus `1,00-`, gehen vorzeichenrichtig in die Summe ein und werden vorzeichenrichtig gespeichert.
- [x] AC4: Neue Gründe mit Kurztext und Satz: Shop unsicher, Datum unsicher, Datum in der Zukunft, Betrag unvollständig. Der Satz zu „Betrag unsicher“ nennt die Toleranz von 0,10 €.
- [x] AC5: Shop-Konfidenz, Datums-Konfidenz und Rohtext des Betrags werden bei Scans immer und bei automatisch angelegten Rechnungen gespeichert und über die API geliefert. Bestehende Daten bleiben unverändert.
- [x] AC6: Das Scan-Detail zeigt einen Block „Erkennung“ mit Shop, Datum, Betrag und Dokument in Prozent als Balken, fehlende Werte als „–“. Bei „Betrag unvollständig“ steht der erkannte Rohtext dabei.
- [x] AC7: Die Detailansicht einer automatisch angelegten Rechnung zeigt einen eingeklappten Block „Automatisch erkannt“ mit denselben Werten. Bei anderen Rechnungen erscheint er nicht.
- [x] AC8: Ein Foto auf der Rechnungsliste (Kamera, Galerie, Teilen) wechselt nach dem Start des Uploads direkt zum Tab „Scans“. Offline erscheint weiter nur die Fehlermeldung.
- [x] AC9: Backend- und Frontend-Tests decken Regeln, Grenzwerte, Rohtext, Rabatte, Speicherung, Anzeige und Navigation ab. Build und Tests sind grün.
- [x] AC10: Die UI-Prüfung mit Playwright bei 390 px und 1440 px ist grün.

## Technical Notes

- Regeln: `AutoCreationRules` (US-0011), heute Konfidenz > 0,75 und (Summe der Positionen innerhalb 5,00 € Toleranz **oder** Betrags-Konfidenz > 0,6).
- Analyse: `InvoiceAnalysisService` (Azure Document Intelligence, prebuilt invoice).

## Out of Scope

- Schwellen konfigurierbar machen
- Nachträgliche Konfidenzen für bestehende Rechnungen
- Erneute Analyse eines Scans

## UI Verification

2026-11-08: **PASSED** (Playwright MCP, 390 × 844 and 1440 × 900, local Monolith with LocalDB after the migration `BillFieldConfidences`, Angular dev server, Chromium). Screenshots are in [`ui-testing/`](./ui-testing/). Test data (2 scans, 1 auto-created bill) was added via SQL and removed afterwards.

**Scan detail** (`m-1-scan-erkennung.png`, `d-1-scan-erkennung.png`):
- The block „Erkennung“ shows Shop, Datum, Betrag and Dokument with bars. The old row „Analyse-Konfidenz“ is gone, and a missing date shows „–“.
- Shop 0,746 is displayed as „75 %“ and warned in orange. This matches the backend: below 0,75 counts as unsicher.
- For „Betrag unvollständig“ the row shows „erkannt: 7,“.

**Scan list:** shows the new short texts, e.g. „Betrag unvollständig“ and „Shop unsicher · Betrag unsicher · Analyse unsicher · Kategorie unklar“.

**Bill detail** (`m-2-rechnung-automatisch-erkannt.png`, `d-2-rechnung-automatisch-erkannt.png`):
- An auto-created bill shows „Automatisch erkannt“ collapsed (`aria-expanded=false`). Expanding it shows four rows without warnings.
- A manually created bill has no block.

**Photo on the list** (`m-3-foto-zu-scans.png`):
- After a camera photo the app switches directly to `/bill/analysis` and the upload appears under „In Arbeit“.
- No snackbar is shown.

**Console:** 0 errors, 0 warnings.

**Not covered:** whether Azure Document Intelligence really returns „7,“ as raw text when the cents are covered can only be checked with a real receipt against the live service (see design §4a). The value is stored and shown in the app, so it can be checked after deployment.

## AI Usage

See [ai-usage.md](./ai-usage.md).
