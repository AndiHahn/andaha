# US-0009: Rechnungen asynchron scannen, Positionen behalten, anzeigen und durchsuchen

| Field | Value |
|-------|-------|
| ID | US-0009 |
| Status | In Review <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-05 |
| Design Doc | [design.md](./design.md) |

## Description

Als Nutzer:in der MiniClient-PWA möchte ich mehrere Rechnungen (meist 2–5) hintereinander fotografieren, ohne auf die Analyse zu warten. Gleich danach will ich im Tab „Analyse“ sehen, was gerade analysiert wird, was automatisch als Rechnung angelegt wurde und was ich noch prüfen muss. Dann kann ich die Rechnungen kontrollieren, solange ich sie noch in der Hand habe.

Die erkannten Positionen sollen dabei erhalten bleiben. Ich will sie in der Rechnung sehen und korrigieren und sie wiederfinden: in einer langen Rechnung ebenso wie rechnungsübergreifend über die Suche.

Heute geht das so:
- Der Kamera-Knopf scannt synchron und lässt einen warten (US-0007).
- Der asynchrone Weg (Upload und Worker) ist nur noch im Backend angebunden. Der Tab „Analyse“ bleibt deshalb leer.
- Bei „Als Rechnung übernehmen“ gehen die Positionen verloren, und die Rechnungsdetails zeigen keine an.

Entstanden aus der Rückmeldung zu US-0008 auf DEV (2026-11-05).

## Acceptance Criteria

**Asynchron scannen**

- [x] AC1: Der Kamera-Knopf neben der Eingabezeile öffnet die Auswahl Kamera oder Galerie. Mehrere Bilder auf einmal sind möglich, aus der Kamera eins nach dem anderen. Jedes Bild wird verkleinert (wie US-0007 AC29) und zur Analyse hochgeladen. Es gibt kein Warten und kein Formular dazwischen. Eine Rückmeldung nennt die Anzahl, z. B. „3 Rechnungen werden analysiert“.
- [x] AC2: Der synchrone Scan-Ablauf aus US-0007 entfällt (Overlay „Rechnung wird gelesen …“ und direkte Formular-Vorbelegung).
- [x] AC3: Teilen aus der Galerie (Share Target, US-0007 AC38) nutzt denselben asynchronen Weg, auch mit mehreren Bildern.
- [x] AC4: Die Analyse startet im Backend gleich nach dem Upload und nicht erst beim nächsten Durchlauf des Workers. Eine typische Rechnung ist nach etwa 10–20 Sekunden fertig. Der Worker bleibt als Netz für Wiederholungen.
- [x] AC5: Plausible Ergebnisse werden wie bisher automatisch als Rechnung angelegt, inklusive Positionen. Unsichere werden ein Analyse-Eintrag zum Prüfen.
- [x] AC6: Ohne Verbindung wird nicht hochgeladen, und es erscheint eine verständliche Meldung. Eine Offline-Warteschlange für Scans gibt es nicht.

**Tab „Analyse“**

- [x] AC7: Der Tab zeigt drei Abschnitte:
  - „In Arbeit“: eine Zeile pro Bild mit Status „Wird hochgeladen“ (echter Fortschritt in %) bzw. „Wird analysiert …“ (laufender Balken), mit Vorschaubild, wo verfügbar.
  - „Zu prüfen“: unsichere Ergebnisse wie bisher, mit Übernehmen und Verwerfen.
  - „Angelegt“: heute automatisch angelegte Rechnungen mit Shop, Betrag und Datum. Ein Tipp öffnet die Rechnung, „Erledigt“ blendet sie aus. Sie verschwinden nach Mitternacht.
- [x] AC8: Während etwas in Arbeit ist, aktualisiert sich der Tab von selbst. Fertige Bilder wechseln von „In Arbeit“ nach „Zu prüfen“ oder „Angelegt“.
- [x] AC9: Das Badge am Tab zählt „In Arbeit“ und „Zu prüfen“. Eine endgültig fehlgeschlagene Analyse erscheint unter „Zu prüfen“ (wie US-0007 AC35).

**Positionen**

- [x] AC10: Automatisch angelegte Rechnungen und „Als Rechnung übernehmen“ speichern die erkannten Positionen mit, in der Reihenfolge der Rechnung. Positionen ohne Beschreibung werden weggelassen. Negative Beträge (Rabatt, Pfand) sind erlaubt.
- [x] AC11: Die Rechnungsdetailseite zeigt einen Abschnitt „Positionen“ mit Beschreibung, Menge × Einzelpreis und Gesamtpreis sowie die Summe der Positionen. Ohne Positionen entfällt der Abschnitt.
- [x] AC12: Weichen Positionssumme und Rechnungsbetrag ab, erscheint ein dezenter Hinweis.
- [x] AC13: Im Bearbeiten-Modus lassen sich Positionen ändern (Beschreibung, Menge, Gesamtpreis), entfernen und hinzufügen. Das wirkt beim Speichern der Rechnung.
- [x] AC14: Ab 8 Positionen gibt es in der Rechnung ein Filterfeld, das Treffer hervorhebt.
- [x] AC15: Die Suche der Rechnungsliste findet auch Rechnungen über ihre Positionen. Bei einem Positions-Treffer zeigt die Zeile die gefundene Position. Ein Tipp öffnet die Rechnung mit vorbelegtem Filter.
- [x] AC16: Löschen einer Rechnung und „Benutzerdaten löschen“ entfernen auch die Positionen. Partner-Rechnungen zeigen ihre Positionen nur lesend.

**Allgemein**

- [x] AC17: Backend-Tests decken ab: Upload mit sofortiger Verarbeitung, die Liste der Analysen in Arbeit, Positionen (Anlegen, Ersetzen, Lesen, Suche, Rechte, Löschen) und Validierung über die echte Pipeline. Frontend-Tests decken ab: Mehrfach-Upload mit Fortschritt, den Tab mit drei Abschnitten und Aktualisierung, die Positionsanzeige, Bearbeiten, Filter und den Suchtreffer. Builds und Tests sind grün.
- [x] AC18: Die UI-Prüfung mit Playwright bei 390 px und 1440 px ist grün. Lokal fehlt der KI-Dienst, deshalb werden Analyse-Ergebnisse im Browser gestubbt oder als Testdaten angelegt.

## Technical Notes

- **Shopping-Backend:**
  - `UploadBillForAnalysis` legt das Bild in den Analyse-Speicher (Metadaten `userId`) und liefert heute nur 202.
  - Der `AnalyzeBillWorker` pollt minütlich, „claimt“ (US-0007) und veröffentlicht eine Nachricht.
  - Der `AnalyzeBillMessageHandler` legt bei plausiblem Ergebnis die Rechnung samt Positionen an (`Bill.AddLineItem`), sonst ein `AnalyzedBill`.
  - `BillLineItem` und `AnalyzedBillLineItem` gibt es (`Description` max. 200, bisher nicht Unicode). `BillDto` liefert `LineItems` schon, auch in der Liste.
- **Frontend:**
  - `scan.service`, Scan-Overlay, `shared-image.ts`, `custom-sw.js` (Share Target, heute ein Bild).
  - Analyse-Tab (`bill-analysis`), `analyzed-bill-details` (Übernahme).
  - `add-bill`, `bill-details`, Rechnungsliste.
- **Validatoren:** Seit US-0008 Task 6b laufen sie wirklich. Neue Felder brauchen passende Regeln.
- **Lokal:** Ohne Dapr-Sidecar und KI-Dienst kann der asynchrone Weg lokal nur mit Stubs bzw. Testdaten geprüft werden.

## Out of Scope

- Statistik nach Positionen (z. B. „Was habe ich für Milch ausgegeben?“)
- Kategorien pro Position
- Mengen mit Nachkommastellen (Gewichtsware)
- Offline-Warteschlange für Scans
- Verbesserungen an der KI-Erkennung und an den Plausibilitätsregeln
- Push-Benachrichtigungen, wenn eine Analyse fertig ist

## UI Verification

2026-11-06: **PASSED** (Playwright MCP, 390 × 844 and 1440 × 900, local Monolith with LocalDB and the Angular dev server).

- **Async scan:** 3 real uploads went through the dock button. A retry reused the same upload id. Offline showed a message and sent no request.
- **Analyse tab, sections:**
  - "In Arbeit" showed upload and analysis states, with polling about every 3 s that stops when idle.
  - "Angelegt" opened the bill on tap, and „Erledigt“ persisted.
  - "Zu prüfen" stayed smooth with more than 30 entries (virtual scroll) and showed the failed entry.
- **Analyse tab, updates:**
  - The badge sum was correct.
  - Opening the tab without running work loaded the data once.
  - The local uploads became failed entries, because there is no AI service locally.
- **Line items:**
  - Take-over carried the sanitized items.
  - The details showed the sum and the deviation hint, and the filter appears from 8 items.
  - Edit, Abbrechen and save worked, and a shop-only edit kept the items.
  - Search matched on line items (including a trailing space), with a match row on mobile and desktop and `?q=` preselecting the filter.
  - Deleting a bill worked, and the share target accepted 2 images.
- **Not checkable locally:** the read-only view of partner bills. Partner reads need the Collaboration service via Dapr. The backend test `Partner_can_read_but_not_change_items` and the frontend specs cover it.
- **Backend tests:** 202 passed. The 7 Azurite repository tests were skipped because Docker was not running.

Screenshots: [ui-testing/phase4/](./ui-testing/phase4/), with per-task checks in `ui-testing/task-6`, `task-8` and `task-9`.

## Change Request 2026-11-06 (after testing on DEV)

**Request from the user:**

- „Wenn ich auf Rechnung hinzufügen mit Foto klicke, komme ich zur Galerie … In den meisten Fällen möchte ich direkt ein Foto machen. Galerie nur im Ausnahmefall.“
- The tab should be renamed. The user's decisions: camera in the input bar and in the tab, gallery in the tab, tab name „Scans“.
- Bug: after an auto-create, opening the bill from the Rechnungen tab did not show the line items until the list was reloaded.

**Changes:**

- **Camera:** the camera button in the input bar opens the camera directly (`capture="environment"`), one photo per tap.
- **Tab „Scans“:** the tab „Analyse“ is renamed to „Scans“; the route `/bill/analysis` stays. The tab now has „Foto aufnehmen“ and „Aus Galerie“ buttons, the gallery allowing several images. Both buttons are also visible in the empty state.
- **Bug fix:**
  - The bill list now learns about automatically created bills: their page 0 is merged in, without a scroll jump.
  - Deleted bills no longer come back from older or cached list responses.
  - A 404 on the detail page leaves the page with „nicht gefunden“. Bills that are not yet synced (US-0005) are excluded from this.
  - The service worker no longer caches the Scans endpoints (`/api/bill/analyzed…`).

**Verification:** review plus 2 fix rounds, `npm test` with 903 tests green, and browser checks at 390 and 1440 px. Screenshots: [ui-testing/cr-kamera-scans/](./ui-testing/cr-kamera-scans/).

## AI Usage

See [ai-usage.md](./ai-usage.md). The session also covered US-0007/US-0008, so its first row "Before Planning" is not part of US-0009. US-0009 starts with Planning (2026-11-05 21:18 UTC, story creation and brainstorming). The "Change Request 2026-11-06" row covers the change request after the DEV test. Durations are wall-clock time, including waiting time.
