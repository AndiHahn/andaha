# US-0013: Strengere Scan-Regeln, Konfidenzen sichtbar, direkt zu Scans

| Field | Value |
|-------|-------|
| ID | US-0013 |
| Status | In Progress <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-08 |
| Design Doc | [design.md](./design.md) |
| Plan | [plan.md](./plan.md) |

## Description

Drei Erweiterungen rund um das Scannen von Rechnungen:

1. Wer auf der Rechnungsliste ein Foto aufnimmt, landet danach direkt im Tab „Scans“ und sieht dort den Status der Analyse.
2. Nach der Analyse sind die Konfidenzwerte der einzelnen Felder sichtbar (z. B. Shop, Datum, Betrag).
3. Die Regeln für das automatische Anlegen werden strenger. Anlass: Eine Rechnung über 7,25 € mit abgedeckten Cent-Stellen wurde automatisch mit 7,00 € angelegt. Die Summe der Positionen wird gegen den Endbetrag geprüft, aber nur dann, wenn der Endbetrag eine zu schlechte Konfidenz hat.

## Acceptance Criteria

- [ ] AC1: Automatisch angelegt wird nur, wenn alle Regeln aus design.md §2 erfüllt sind:
  - Shop-Konfidenz ≥ 0,75 und Datums-Konfidenz ≥ 0,80, Datum nicht in der Zukunft.
  - Der Rohtext des Betrags zeigt zwei Nachkommastellen.
  - Betrags-Konfidenz ≥ 0,90, oder 0,60 bis < 0,90 und die Summe der Positionen passt auf 0,10 € genau.
  - Dokument-Konfidenz > 0,75, Kategorie gültig.

  Fehlende Werte gelten als unsicher.
- [ ] AC2: Ein Beleg über 7,25 € mit abgedeckten Cent-Stellen (Rohtext „7,“ bzw. ohne Cent) wird nicht automatisch angelegt, sondern landet unter „Zu prüfen“ mit dem Grund „Betrag unvollständig“.
- [ ] AC3: Positionen mit Minus-Beträgen (Rabatte), auch mit nachgestelltem Minus `1,00-`, gehen vorzeichenrichtig in die Summe ein und werden vorzeichenrichtig gespeichert.
- [ ] AC4: Neue Gründe mit Kurztext und Satz: Shop unsicher, Datum unsicher, Datum in der Zukunft, Betrag unvollständig. Der Satz zu „Betrag unsicher“ nennt die Toleranz von 0,10 €.
- [ ] AC5: Shop-Konfidenz, Datums-Konfidenz und Rohtext des Betrags werden bei Scans immer und bei automatisch angelegten Rechnungen gespeichert und über die API geliefert. Bestehende Daten bleiben unverändert.
- [ ] AC6: Das Scan-Detail zeigt einen Block „Erkennung“ mit Shop, Datum, Betrag und Dokument in Prozent als Balken, fehlende Werte als „–“. Bei „Betrag unvollständig“ steht der erkannte Rohtext dabei.
- [ ] AC7: Die Detailansicht einer automatisch angelegten Rechnung zeigt einen eingeklappten Block „Automatisch erkannt“ mit denselben Werten. Bei anderen Rechnungen erscheint er nicht.
- [ ] AC8: Ein Foto auf der Rechnungsliste (Kamera, Galerie, Teilen) wechselt nach dem Start des Uploads direkt zum Tab „Scans“. Offline erscheint weiter nur die Fehlermeldung.
- [ ] AC9: Backend- und Frontend-Tests decken Regeln, Grenzwerte, Rohtext, Rabatte, Speicherung, Anzeige und Navigation ab. Build und Tests sind grün.
- [ ] AC10: Die UI-Prüfung mit Playwright bei 390 px und 1440 px ist grün.

## Technical Notes

- Regeln: `AutoCreationRules` (US-0011), heute Konfidenz > 0,75 und (Summe der Positionen innerhalb 5,00 € Toleranz **oder** Betrags-Konfidenz > 0,6).
- Analyse: `InvoiceAnalysisService` (Azure Document Intelligence, prebuilt invoice).

## Out of Scope

- Schwellen konfigurierbar machen
- Nachträgliche Konfidenzen für bestehende Rechnungen
- Erneute Analyse eines Scans

## AI Usage

See [ai-usage.md](./ai-usage.md).
