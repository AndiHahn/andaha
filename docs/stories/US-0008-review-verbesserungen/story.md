# US-0008: Übrige Verbesserungen aus dem Review (Liste, Statistik, Haushalt, Stunden, Einstellungen, Export, Allgemeines)

| Field | Value |
|-------|-------|
| ID | US-0008 |
| Status | Open <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-03 |
| Design Doc | — <!-- link to ./design.md once brainstorming is done --> |

## Description

Als Nutzer:in der MiniClient-PWA möchte ich, dass alle Bereiche der App so schnell und verlässlich funktionieren wie die neue Schnellerfassung: übersichtliche Listen, klickbare Statistiken, korrekte Texte und Zahlen, Rückmeldung nach jeder Aktion, Schutz vor versehentlichem Löschen und verständliche Fehler- und Leerzustände.

Grundlage ist [`docs/review.md`](../../review.md), Abschnitte 3, 5, 6, 7 und 8, ohne die Punkte, die in US-0007 umgesetzt werden oder abgewählt wurden (siehe Out of Scope). Gestaltung nach `docs/design/DESIGN.md` und der Navigation aus Design v2 (`docs/design/v2/`). Wo die Review Gestaltungsspielraum lässt, legt das Design dieser Story die Lösung fest und markiert sie.

Setzt US-0006 und US-0007 voraus (Tabs, Snackbar, Sheet-Verhalten, Vibrieren).

## Acceptance Criteria

**Rechnungsliste und Statistik (Review 3)**

- [ ] AC1: Die Rechnungsliste ist nach Monaten gruppiert. Der Gruppenkopf zeigt Monat und Monatssumme.
- [ ] AC2: Über der Liste steht die Summe der gefilterten Treffer, z. B. „23 Rechnungen · 412,30 €“. Sie gilt für alle Treffer, nicht nur die geladene Seite, und kommt dafür vom Backend.
- [ ] AC3: Wischaktionen auf Listenzeilen: nach links „Löschen“ mit Rückfrage, nach rechts „Duplizieren“ (öffnet die Erfassung mit gleichen Werten und Datum heute). Beide Aktionen gibt es zusätzlich ohne Geste (z. B. in der Detailansicht).
- [ ] AC4: Pull-to-Refresh lädt die Rechnungsliste neu. `overscroll-behavior` ist dafür angepasst.
- [ ] AC5: In der Statistik wechselt der Monat (bzw. das Jahr) per ‹ › neben dem Zeitraum statt über das Select. Das Wischen zwischen den Tabs bleibt dabei funktionsfähig, das Design legt die Abgrenzung fest.
- [ ] AC6: Ein Tipp auf eine Kategorie in der Statistik öffnet die Rechnungsliste, gefiltert nach dieser Kategorie und dem Zeitraum. Die Unterkategorie-Summen bleiben erreichbar.
- [ ] AC7: Die Statistik zeigt den Vergleich zum Vormonat bzw. Vorjahr (z. B. „+12 %“) und ein Balkendiagramm der letzten 12 Monate.

**Haushalt (Review 5)**

- [ ] AC8: Der Anteil der Lebenserhaltungskosten ist einstellbar, Standard 35 %. Er wird pro Benutzer im Backend gespeichert. Die feste Kodierung in `overview.component.ts` entfällt.
- [ ] AC9: Ein Tipp auf eine Kategorie in der Übersicht öffnet die Fixkostenliste, gefiltert nach dieser Kategorie.
- [ ] AC10: Die Fixkostenliste zeigt Kategoriesummen im Abschnittskopf und pro Zeile den auf den Monat umgerechneten Wert.
- [ ] AC11: Nach dem Anlegen von Fixkosten oder Einkommen gibt es eine Snackbar, danach geht es zurück zur Liste.
- [ ] AC12: Texte sind korrigiert: Bei Einkommen heißt das Feld „Betrag“ statt „Kosten“, der Leerzustand „Keine Einkommen.“, und die Fehlermeldung beim Löschen nennt Einkommen.

**Stunden (Review 6)**

- [ ] AC13: Auf der Personen-Seite gibt es „Arbeitszeit erfassen“ mit vorgewählter Person.
- [ ] AC14: Beim Erfassen lässt sich der letzte Eintrag der Person übernehmen (Uhrzeiten, Pause, Notiz), Datum heute.
- [ ] AC15: Der Zahlungsdialog ist vorbelegt: Betrag = offene Stunden × Stundensatz, Trinkgeld 0. Bezahlte Stunden haben eine Formatprüfung.
- [ ] AC16: Die Personenliste zeigt den offenen Betrag in Euro. „Zahlung offen“ beruht auf dem offenen Betrag.
- [ ] AC17: Liegt das Ende vor dem Beginn, erscheint ein Fehler am Feld, und es kann nicht gespeichert werden. Netto wird nicht negativ.
- [ ] AC18: Die Arbeitszeitenliste ist nach Monaten gruppiert, mit Zwischensumme je Monat. Sie lädt nicht mehr die ganze Historie auf einmal.
- [ ] AC19: Statistik: Beträge mit Tausender- und Dezimaltrennzeichen, ein Leerzustand mit Erklärung, Filter pro Person (Backend `personFilter`) und Diagramme. Die tote `WorktimeComponent` und der leere Filter-Platzhalter sind entfernt.
- [ ] AC20: Zahlungen in der Historie lassen sich bearbeiten und löschen (neue Backend-Endpoints). Löschen hat eine Rückfrage.
- [ ] AC21: Der Export ist aus dem Bereich Stunden heraus erreichbar.
- [ ] AC22: Beim Anlegen und Bearbeiten landet das gewählte Datum unabhängig von der Zeitzone auf genau diesem Tag. Ein Monatserster landet nicht im Vormonat, und der `getUTCDate() + 1`-Hack entfällt.
- [ ] AC23: Nach Bearbeiten oder Löschen eines Eintrags stimmen die Gesamtstunden der Person sofort.
- [ ] AC24: Der Eintragsdialog meldet bei Fehlern „Arbeitszeit konnte nicht gespeichert werden“.

**Einstellungen, Verbindungen, Export, Datenschutz (Review 7)**

- [ ] AC25: Kategoriefarben werden aus einem Swatch-Raster gewählt statt aus einem Select mit CSS-Namen. Bestehende Farben bleiben gültig.
- [ ] AC26: Löschen von Unterkategorien, Rechnungsfotos und allen anderen Einträgen hat eine Rückfrage. Es gibt kein Rückgängig.
- [ ] AC27: Der Löschen-Button der Standardkategorie ist deaktiviert, mit Erklärung.
- [ ] AC28: Nach dem Speichern einer Kategorie setzt „Abbrechen“ auf den gespeicherten Stand zurück. Neue Unterkategorien bekommen nach dem Speichern ihre ID, ein zweites Speichern erzeugt keine Duplikate.
- [ ] AC29: Verbindungen: Annehmen und Ablehnen zeigen Ladezustand, Rückmeldung und Fehler. Nach dem Senden einer Anfrage gibt es eine Rückmeldung. Eine Verbindung lässt sich trennen und eine ausgehende Anfrage zurückziehen (neue Backend-Endpoints, mit Rückfrage).
- [ ] AC30: Export: Zeitraum und Kategorie sind wählbar (Backend-Kategoriefilter in `ExportExpensesRequest` aktiviert). Die Datei wird über die Web Share API geteilt, wo verfügbar, sonst heruntergeladen. Fehler werden angezeigt.
- [ ] AC31: „Benutzerdaten löschen“ funktioniert: Nach doppelter Rückfrage werden alle Daten des Benutzers in allen Services gelöscht (neue Endpoints), danach wird der Benutzer abgemeldet.

**PWA und Allgemeines (Review 8)**

- [ ] AC32: Zoomen ist erlaubt: kein `user-scalable=0`/`maximum-scale=1.0`, das Kontextmenü ist nicht mehr global abgeschaltet.
- [ ] AC33: Der Fehler-Interceptor zeigt einheitliche Fehler-Snackbars. Bei fehlender Verbindung erscheint ein Offline-Hinweisbanner.
- [ ] AC34: Jede Liste und Seite hat einen Fehlerzustand mit „Erneut versuchen“ statt endlosem Spinner und einen Leerzustand mit Erklärung (z. B. Stunden-Statistik ohne Arbeitszeiten).
- [ ] AC35: Löschen löst ein kurzes Vibrieren aus, wo unterstützt (Speichern seit US-0007).
- [ ] AC36: „Warten auf Login …“ ist durch einen gestalteten Ladezustand ersetzt.
- [ ] AC37: Komponenten, die Root-BehaviorSubjects abonnieren, melden sich beim Zerstören ab (`takeUntilDestroyed` o. ä.). Betroffen u. a. `overview`, `fixed-cost`, `income`, `person`, `add-working-entry`, `statistics`.
- [ ] AC38: Der Haushaltsplan wird beim Start einmal geladen, nicht 3–4 Mal.
- [ ] AC39: Die Statistik zeigt beim Zeitraumwechsel keine Werte des vorherigen Zeitraums. Der verfügbare Zeitraum aktualisiert sich nach neuen Arbeitszeiten.

**Allgemein**

- [ ] AC40: Backend-Tests decken alle neuen und geänderten Endpoints ab: Summe der Treffer, Lebenserhaltungs-Anteil, `personFilter`, Zahlungen bearbeiten/löschen, Verbindung trennen/zurückziehen, Export-Filter, Benutzerdaten löschen. Frontend-Unit-Tests decken die geänderte Logik ab (Gruppierung, Datum/Zeitzone, Zahlungsvorbelegung, Plausibilität). Builds und Tests sind grün.
- [ ] AC41: Die UI-Prüfung mit Playwright bei 390 px und 1440 px deckt alle Bereiche ab und ist grün.

## Technical Notes

- Betroffene Services: Shopping (Summe, Export-Filter), Budgetplan (Lebenserhaltungs-Anteil), Work (Statistik `personFilter`, Zahlungen), Verbindungen (Service im Design klären), alle Services für „Benutzerdaten löschen“.
- Dateiverweise stehen in `docs/review.md` an den jeweiligen Punkten.
- Bibliotheks-APIs (z. B. Diagramme, Web Share API) per Context7 bzw. MDN nachschlagen.

## Out of Scope

- Soll/Ist-Vergleich Haushaltsplan und Fälligkeiten von Fixkosten
- Rückgängig nach Speichern oder Löschen (stattdessen Rückfrage)
- Offline-Warteschlange über den Bestand aus US-0005 hinaus
- Punkte aus US-0007 (Navigation, Erfassen, Vorlagen, Analyse, App-Shortcut, Share Target)
- Angular-Upgrade (US-0006)
