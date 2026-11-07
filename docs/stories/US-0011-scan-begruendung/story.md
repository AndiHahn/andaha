# US-0011: Begründung im Scan-Tab, warum ein Scan nicht automatisch angelegt wurde

| Field | Value |
|-------|-------|
| ID | US-0011 |
| Status | In Review <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-07 |
| Design Doc | [design.md](./design.md) |
| Plan | [plan.md](./plan.md) |

## Description

Als Nutzer:in, die eine Rechnung fotografiert, möchte ich im Tab „Scans“ bei jedem Scan unter „Zu prüfen“ sehen, warum er nicht automatisch als Rechnung angelegt wurde. Dann verstehe ich, was ich vor dem Übernehmen prüfen oder ergänzen muss.

Seit US-0009 legt die Analyse eindeutige Fotos automatisch als Rechnung an. Alles andere landet unter „Zu prüfen“, bisher ohne Hinweis, woran es lag.

## Acceptance Criteria

- [x] AC1: Für jeden Scan unter „Zu prüfen“ liefert das Backend die Gründe, warum er nicht automatisch angelegt wurde. Die Gründe stammen aus denselben Regeln, mit denen die Analyse entscheidet, und werden beim Anlegen des Scans gespeichert. Für Scans, die schon vor diesem Update vorhanden waren, leitet das Backend sie aus den gespeicherten Werten ab. Nur „Datum fehlt“ lässt sich dort nicht erkennen.
- [x] AC2: Möglich sind diese Gründe: Analyse fehlgeschlagen, Shop fehlt, Datum fehlt, Betrag fehlt, Analyse unsicher, Betrag unsicher (Positionen ergeben nicht den Betrag), Kategorie unklar. Ist die Analyse fehlgeschlagen, wird nur dieser eine Grund genannt.
- [x] AC3: In der Liste „Zu prüfen“ zeigt jede Zeile die Gründe in einer zusätzlichen Kurz-Zeile, z. B. „Datum fehlt · Kategorie unklar“. Ist die Zeile zu lang, wird sie abgeschnitten. Alle Zeilen der Liste sind gleich hoch.
- [x] AC4: Die Detailansicht eines Scans zeigt oben einen Hinweis „Nicht automatisch angelegt“ mit allen Gründen als ganzen Sätzen.
- [x] AC5: Gründe, die das Frontend nicht kennt, werden ignoriert. Ein Scan ohne Gründe zeigt weder die Kurz-Zeile noch den Hinweis.
- [x] AC6: Die Entscheidung über das automatische Anlegen bleibt unverändert. Ein Scan wird genau dann angelegt, wenn keiner der Gründe zutrifft.
- [x] AC7: Backend-Tests decken jeden Grund, die Kombinationen und das Feld im Endpunkt ab. Frontend-Tests decken die Texte, die Kurz-Zeile und den Hinweis ab. Build und Tests sind grün.
- [x] AC8: Die UI-Prüfung mit Playwright bei 390 px und 1440 px ist grün (Liste und Detailansicht).

## Technical Notes

- Backend: Shopping-Service. Die Regeln stehen heute in `InvoiceAnalysisResult.IsReasonableResult` und in `BillAnalysisProcessor` (Kategorie). Gescannte Rechnungen sind nicht änderbar, die gespeicherten Werte entsprechen also dem Stand der Analyse.
- Frontend: `features/bill-analysis` (Liste `analyzed-bill-list`, Zeile `analyzed-bill-list-item`, Detail `analyzed-bill-details`) und `api/shopping/dtos/BillAnalyzedDto.ts`.
- Eine Migration fügt die nullable Spalte für die Gründe zu `AnalyzedBill` hinzu. Vorhandene Daten bleiben unverändert.

## Bekannte Grenzen

- Bei Scans aus der Zeit vor diesem Update sind die Gründe nur abgeleitet:
  - „Datum fehlt“ ist dort nicht erkennbar, weil ein fehlendes Datum als aktuelles Datum gespeichert wurde.
  - Scans aus der Zeit vor den heutigen Regeln (vor Februar 2026) wurden noch nach älteren Regeln entschieden. Bei ihnen kann der Hinweis fehlen oder einen leicht anderen Grund nennen.
  - Seit US-0009 sind nur die bereinigten Positionen gespeichert, Positionen ohne Beschreibung fehlen. Die abgeleitete Summe kann deshalb von der Summe abweichen, mit der damals entschieden wurde.

## Out of Scope

- Die Schwellenwerte der Analyse ändern
- Einen Scan neu analysieren lassen
- Gründe für automatisch angelegte Rechnungen

## UI Verification

2026-11-07: **PASSED** (Playwright MCP, 390 × 844 and 1440 × 900, local Monolith with LocalDB after the migration `AnalyzedBillNotCreatedReasons`, Angular dev server, Chromium). Screenshots are in [`ui-testing/`](./ui-testing/).

**Test data:** 4 test scans added for the check and removed afterwards:
- 2 with stored reasons: one short, one long with 5 reasons
- 1 old scan without stored reasons and with incomplete values
- 1 old scan with complete values

4 failed analyses already present in the database were tested too.

**List „Zu prüfen“** (`m-1-liste.png`, `d-1-liste.png`):
- Stored reasons appear as a short line, e.g. „Datum fehlt · Kategorie unklar“.
- For the old scan the reasons are derived: „Analyse unsicher · Betrag unsicher · Kategorie unklar“.
- The failed analyses show „Analyse fehlgeschlagen“ only.
- The scan with complete values has no reasons line.
- On mobile, long lines end in „…“.
- All rows are 80 px high. The three lines fit within the padding, measured at 390 px and at 1440 px.

**Detail view** (`m-2-detail-abgeleitet.png`, `m-3-detail-fehlgeschlagen.png`, `d-2-detail.png`):
- The block „Nicht automatisch angelegt“ (`role="heading"`, level 2) sits above „Kategorie“, in a calm blue info tone.
- It lists the full sentences in API order.
- A failed analysis shows only „Das Foto konnte nicht ausgewertet werden. …“.
- The scan without reasons has no block.

**SQL Server:** the JSON column is read correctly on LocalDB, both stored and `NULL`.

**Console:** 0 errors, 0 warnings.

## AI Usage

See [ai-usage.md](./ai-usage.md).
