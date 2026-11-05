# US-0009: Rechnungen asynchron scannen, Positionen behalten, anzeigen und durchsuchen

| Field | Value |
|-------|-------|
| ID | US-0009 |
| Status | In Progress <!-- Open / In Progress / In Review / Done --> |
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

- [ ] AC1: Der Kamera-Knopf neben der Eingabezeile öffnet die Auswahl Kamera oder Galerie. Mehrere Bilder auf einmal sind möglich, aus der Kamera eins nach dem anderen. Jedes Bild wird verkleinert (wie US-0007 AC29) und zur Analyse hochgeladen. Es gibt kein Warten und kein Formular dazwischen. Eine Rückmeldung nennt die Anzahl, z. B. „3 Rechnungen werden analysiert“.
- [ ] AC2: Der synchrone Scan-Ablauf aus US-0007 entfällt (Overlay „Rechnung wird gelesen …“ und direkte Formular-Vorbelegung).
- [ ] AC3: Teilen aus der Galerie (Share Target, US-0007 AC38) nutzt denselben asynchronen Weg, auch mit mehreren Bildern.
- [ ] AC4: Die Analyse startet im Backend gleich nach dem Upload und nicht erst beim nächsten Durchlauf des Workers. Eine typische Rechnung ist nach etwa 10–20 Sekunden fertig. Der Worker bleibt als Netz für Wiederholungen.
- [ ] AC5: Plausible Ergebnisse werden wie bisher automatisch als Rechnung angelegt, inklusive Positionen. Unsichere werden ein Analyse-Eintrag zum Prüfen.
- [ ] AC6: Ohne Verbindung wird nicht hochgeladen, und es erscheint eine verständliche Meldung. Eine Offline-Warteschlange für Scans gibt es nicht.

**Tab „Analyse“**

- [ ] AC7: Der Tab zeigt drei Abschnitte:
  - „In Arbeit“: eine Zeile pro Bild mit Status „Wird hochgeladen“ (echter Fortschritt in %) bzw. „Wird analysiert …“ (laufender Balken), mit Vorschaubild, wo verfügbar.
  - „Zu prüfen“: unsichere Ergebnisse wie bisher, mit Übernehmen und Verwerfen.
  - „Angelegt“: heute automatisch angelegte Rechnungen mit Shop, Betrag und Datum. Ein Tipp öffnet die Rechnung, „Erledigt“ blendet sie aus. Sie verschwinden nach Mitternacht.
- [ ] AC8: Während etwas in Arbeit ist, aktualisiert sich der Tab von selbst. Fertige Bilder wechseln von „In Arbeit“ nach „Zu prüfen“ oder „Angelegt“.
- [ ] AC9: Das Badge am Tab zählt „In Arbeit“ und „Zu prüfen“. Eine endgültig fehlgeschlagene Analyse erscheint unter „Zu prüfen“ (wie US-0007 AC35).

**Positionen**

- [ ] AC10: Automatisch angelegte Rechnungen und „Als Rechnung übernehmen“ speichern die erkannten Positionen mit, in der Reihenfolge der Rechnung. Positionen ohne Beschreibung werden weggelassen. Negative Beträge (Rabatt, Pfand) sind erlaubt.
- [ ] AC11: Die Rechnungsdetailseite zeigt einen Abschnitt „Positionen“ mit Beschreibung, Menge × Einzelpreis und Gesamtpreis sowie die Summe der Positionen. Ohne Positionen entfällt der Abschnitt.
- [ ] AC12: Weichen Positionssumme und Rechnungsbetrag ab, erscheint ein dezenter Hinweis.
- [ ] AC13: Im Bearbeiten-Modus lassen sich Positionen ändern (Beschreibung, Menge, Gesamtpreis), entfernen und hinzufügen. Das wirkt beim Speichern der Rechnung.
- [ ] AC14: Ab 8 Positionen gibt es in der Rechnung ein Filterfeld, das Treffer hervorhebt.
- [ ] AC15: Die Suche der Rechnungsliste findet auch Rechnungen über ihre Positionen. Bei einem Positions-Treffer zeigt die Zeile die gefundene Position. Ein Tipp öffnet die Rechnung mit vorbelegtem Filter.
- [ ] AC16: Löschen einer Rechnung und „Benutzerdaten löschen“ entfernen auch die Positionen. Partner-Rechnungen zeigen ihre Positionen nur lesend.

**Allgemein**

- [ ] AC17: Backend-Tests decken ab: Upload mit sofortiger Verarbeitung, die Liste der Analysen in Arbeit, Positionen (Anlegen, Ersetzen, Lesen, Suche, Rechte, Löschen) und Validierung über die echte Pipeline. Frontend-Tests decken ab: Mehrfach-Upload mit Fortschritt, den Tab mit drei Abschnitten und Aktualisierung, die Positionsanzeige, Bearbeiten, Filter und den Suchtreffer. Builds und Tests sind grün.
- [ ] AC18: Die UI-Prüfung mit Playwright bei 390 px und 1440 px ist grün. Lokal fehlt der KI-Dienst, deshalb werden Analyse-Ergebnisse im Browser gestubbt oder als Testdaten angelegt.

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
