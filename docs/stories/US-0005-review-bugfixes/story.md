# US-0005: Bugfixes aus dem Review (Daten-Bugs)

| Field | Value |
|-------|-------|
| ID | US-0005 |
| Status | In Progress <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-02 |
| Design Doc | [design.md](./design.md) |
| Plan | [plan.md](./plan.md) |

## Description

Als Nutzer:in des MiniClients (fast nur als PWA am Handy) möchte ich mich darauf verlassen können, dass meine Eingaben gespeichert und korrekt angezeigt werden. Das Review vom 2026-11-02 ([`docs/review.md`](../../review.md)) hat sieben Fehler gefunden, bei denen Daten verloren gehen, falsch angezeigt werden oder Funktionen nicht arbeiten:

1. **Analyse speichert nichts.** Die App ruft den synchronen Endpoint `bill/analyze` auf, der das Ergebnis nur zurückgibt. Der asynchrone Endpoint `upload-for-analysis` legt das Foto im falschen Speicher und ohne Benutzer ab. Die Analyse-Liste zeigt Kategorie und Konfidenz nicht korrekt an.
2. **Personen-Notizen enthalten die Zahlungshistorie.** Das Backend liefert die Zahlungen als Text im Feld `Notes`. Beim Speichern einer Person wird dieser Text als Notiz zurückgeschrieben, die echten Notizen sind nicht sichtbar.
3. **Bezahlte Stunden werden doppelt gezählt**, wenn eine Zahlung erfasst wird (bis zum Neuladen).
4. **Offline erfasste Rechnungen können verloren gehen.** Sie liegen samt Foto als Base64 im localStorage (ca. 5 MB). Bei vollem Speicher geht die Rechnung still verloren. Schlägt die Synchronisierung fehl, bleibt das Sync-Symbol dauerhaft stehen, und ein neuer Versuch erfolgt erst beim nächsten App-Start.
5. **Ein App-Update lädt die Seite sofort neu**, auch mitten in einer Eingabe.
6. **Detailseiten stürzen bei Reload oder Direktaufruf ab**, wenn die Daten noch nicht geladen sind.
7. **Formulare bleiben nach einem Speicherfehler gesperrt** oder zeigen ungespeicherte Werte, als wären sie gespeichert.

Beim Design kamen zwei Backend-Fehler dazu:

- Rechnungen mit Unterkategorie scheitern an der Prüfung.
- Eine erneut übertragene Rechnung führt zu einem Serverfehler, statt erkannt zu werden.

## Acceptance Criteria

**Analyse**

- [ ] AC1: Ein in „Analyse → Hochladen“ gewähltes Foto wird über `upload-for-analysis` hochgeladen und im Analyse-Speicher mit dem angemeldeten Benutzer abgelegt. Es wird genau einmal analysiert.
- [ ] AC2: Ist das Ergebnis plausibel, entsteht automatisch eine Rechnung in der Rechnungsliste. Sonst erscheint ein Eintrag in der Analyse-Liste.
- [ ] AC3: Nach dem Hochladen sagt die App, dass das Foto analysiert wird und wo das Ergebnis erscheint.
- [ ] AC4: Die Analyse-Liste und die Detailansicht zeigen Shop, Preis, Datum, Kategorie (mit Farbe), Unterkategorie und Konfidenz korrekt an, ohne „NaN“. Das Foto einer analysierten Rechnung lässt sich öffnen.

**Personen und Zahlungen**

- [ ] AC5: Das Feld „Notizen“ einer Person zeigt und speichert nur die echte Notiz.
- [ ] AC6: Die Zahlungen einer Person werden als eigene Liste angezeigt: Datum, bezahlte Stunden, bezahlter Betrag (inkl. Trinkgeld) und davon Trinkgeld.
- [ ] AC7: Nach dem Erfassen einer Zahlung stimmen „bezahlt“ und „offen“ sofort, ohne Neuladen. Die neue Zahlung erscheint in der Liste.

**Offline-Rechnungen**

- [ ] AC8: Offline erfasste Rechnungen samt Foto werden so gespeichert, dass auch mehrere Rechnungen mit Foto Platz haben. Fotos werden vor dem Speichern verkleinert.
- [ ] AC9: Kann eine Rechnung lokal nicht gespeichert werden, sieht man eine Fehlermeldung. Die Rechnung verschwindet dann nicht still.
- [ ] AC10: Schlägt die Synchronisierung fehl, verschwindet das Sync-Symbol. Die Rechnung bleibt gespeichert und wird erneut übertragen, sobald das Gerät wieder online ist oder die App wieder in den Vordergrund kommt.
- [ ] AC11: Bereits im alten localStorage-Speicher liegende Rechnungen gehen beim Update nicht verloren.

**App-Update**

- [ ] AC12: Ist eine neue App-Version bereit, wird nicht automatisch neu geladen. Ein Hinweis mit „Neu laden“ erscheint, und die Eingaben bleiben erhalten, bis man ihn antippt.

**Detailseiten**

- [ ] AC13: Reload oder Direktaufruf von Rechnung, Fixkosten, Einkommen, Person, Kategorie und analysierter Rechnung zeigt die Seite, sobald die Daten geladen sind. Es gibt keinen Fehler in der Konsole.
- [ ] AC14: Existiert der Eintrag nicht (mehr), landet man auf der zugehörigen Liste mit einem Hinweis.

**Speicherfehler**

- [ ] AC15: Schlägt das Speichern fehl (Kategorie anlegen, Kategorie bearbeiten, Fixkosten, Einkommen, Person, Arbeitszeit), erscheint eine Fehlermeldung. Das Formular bleibt mit den eingegebenen Werten bearbeitbar, sodass man erneut speichern oder abbrechen kann.

**Rechnungen im Backend**

- [ ] AC16: Rechnungen mit Unterkategorie lassen sich anlegen und bearbeiten. Bisher scheiterte die Prüfung, weil die Unterkategorie mit der Kategorie-ID verglichen wurde.
- [ ] AC17: Wird dieselbe Rechnung (gleiche ID) erneut übertragen, entsteht keine zweite Rechnung. Fehlte das Foto, wird es nachgeladen.

**Allgemein**

- [ ] AC18: Es gibt neue Backend-Testprojekte für Shopping und Work. Sie decken Analyse-Upload, Analyse-DTO, Bild-Endpoint, Rechnung anlegen und Personen-DTO ab. Diese Tests, die Frontend-Unit-Tests für die geänderte Logik sowie Frontend- und Backend-Build laufen grün.

## Technical Notes

- Details, Entscheidungen und betroffene Dateien: [design.md](./design.md).
- Backend: `src/Services/Shopping` (Analyse-Upload, Analyse-DTO, Bild analysierter Rechnungen), `src/Services/Work` (Personen-DTO).
- Frontend: `src/WebApps/MiniClient/Andaha.WebApps.MiniClient`.

## Out of Scope

- Analysierte Rechnung als Rechnung übernehmen oder verwerfen (später, siehe `docs/review.md`)
- Positionen (LineItems) in der Analyse-Detailansicht anzeigen
- Zahlungen bearbeiten oder löschen
- Bereits falsch gespeicherte Personen-Notizen automatisch bereinigen
- Analyse-Pipeline härten (Worker/Handler bei fehlgeschlagener Analyse), siehe `docs/review.md`
- Alle Verbesserungen aus `docs/review.md`

## AI Usage

See [ai-usage.md](./ai-usage.md).
