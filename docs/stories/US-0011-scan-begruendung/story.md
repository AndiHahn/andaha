# US-0011: Begründung im Scan-Tab, warum ein Scan nicht automatisch angelegt wurde

| Field | Value |
|-------|-------|
| ID | US-0011 |
| Status | In Progress <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-07 |
| Design Doc | [design.md](./design.md) |
| Plan | [plan.md](./plan.md) |

## Description

Als Nutzer:in, die eine Rechnung fotografiert, möchte ich im Tab „Scans“ bei jedem Scan unter „Zu prüfen“ sehen, warum er nicht automatisch als Rechnung angelegt wurde. Dann verstehe ich, was ich vor dem Übernehmen prüfen oder ergänzen muss.

Seit US-0009 legt die Analyse eindeutige Fotos automatisch als Rechnung an. Alles andere landet unter „Zu prüfen“, bisher ohne Hinweis, woran es lag.

## Acceptance Criteria

- [ ] AC1: Für jeden Scan unter „Zu prüfen“ liefert das Backend die Gründe, warum er nicht automatisch angelegt wurde. Die Gründe stammen aus denselben Regeln, mit denen die Analyse entscheidet, und werden beim Anlegen des Scans gespeichert. Für Scans, die schon vor diesem Update vorhanden waren, leitet das Backend sie aus den gespeicherten Werten ab. Nur „Datum fehlt“ lässt sich dort nicht erkennen.
- [ ] AC2: Möglich sind diese Gründe: Analyse fehlgeschlagen, Shop fehlt, Datum fehlt, Betrag fehlt, Analyse unsicher, Betrag unsicher (Positionen ergeben nicht den Betrag), Kategorie unklar. Ist die Analyse fehlgeschlagen, wird nur dieser eine Grund genannt.
- [ ] AC3: In der Liste „Zu prüfen“ zeigt jede Zeile die Gründe in einer zusätzlichen Kurz-Zeile, z. B. „Datum fehlt · Kategorie unklar“. Ist die Zeile zu lang, wird sie abgeschnitten. Alle Zeilen der Liste sind gleich hoch.
- [ ] AC4: Die Detailansicht eines Scans zeigt oben einen Hinweis „Nicht automatisch angelegt“ mit allen Gründen als ganzen Sätzen.
- [ ] AC5: Gründe, die das Frontend nicht kennt, werden ignoriert. Ein Scan ohne Gründe zeigt weder die Kurz-Zeile noch den Hinweis.
- [ ] AC6: Die Entscheidung über das automatische Anlegen bleibt unverändert. Ein Scan wird genau dann angelegt, wenn keiner der Gründe zutrifft.
- [ ] AC7: Backend-Tests decken jeden Grund, die Kombinationen und das Feld im Endpunkt ab. Frontend-Tests decken die Texte, die Kurz-Zeile und den Hinweis ab. Build und Tests sind grün.
- [ ] AC8: Die UI-Prüfung mit Playwright bei 390 px und 1440 px ist grün (Liste und Detailansicht).

## Technical Notes

- Backend: Shopping-Service. Die Regeln stehen heute in `InvoiceAnalysisResult.IsReasonableResult` und in `BillAnalysisProcessor` (Kategorie). Gescannte Rechnungen sind nicht änderbar, die gespeicherten Werte entsprechen also dem Stand der Analyse.
- Frontend: `features/bill-analysis` (Liste `analyzed-bill-list`, Zeile `analyzed-bill-list-item`, Detail `analyzed-bill-details`) und `api/shopping/dtos/BillAnalyzedDto.ts`.
- Eine Migration fügt die nullable Spalte für die Gründe zu `AnalyzedBill` hinzu. Vorhandene Daten bleiben unverändert.

## Out of Scope

- Die Schwellenwerte der Analyse ändern
- Einen Scan neu analysieren lassen
- Gründe für automatisch angelegte Rechnungen

## AI Usage

See [ai-usage.md](./ai-usage.md).
