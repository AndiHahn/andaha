# US-0008: Übrige Verbesserungen aus dem Review (Liste, Statistik, Haushalt, Stunden, Einstellungen, Export, Allgemeines)

| Field | Value |
|-------|-------|
| ID | US-0008 |
| Status | In Review <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-03 |
| Design Doc | [design.md](./design.md) |

## Description

Als Nutzer:in der MiniClient-PWA möchte ich, dass alle Bereiche der App so schnell und verlässlich funktionieren wie die neue Schnellerfassung: übersichtliche Listen, klickbare Statistiken, korrekte Texte und Zahlen, Rückmeldung nach jeder Aktion, Schutz vor versehentlichem Löschen und verständliche Fehler- und Leerzustände.

Grundlage ist [`docs/review.md`](../../review.md), Abschnitte 3, 5, 6, 7 und 8, ohne die Punkte, die in US-0007 umgesetzt werden oder abgewählt wurden (siehe Out of Scope). Gestaltung nach `docs/design/DESIGN.md` und der Navigation aus Design v2 (`docs/design/v2/`). Wo die Review Gestaltungsspielraum lässt, legt das Design dieser Story die Lösung fest und markiert sie.

Setzt US-0006 und US-0007 voraus (Tabs, Snackbar, Sheet-Verhalten, Vibrieren).

## Acceptance Criteria

**Rechnungsliste und Statistik (Review 3)**

- [x] AC1: Die Rechnungsliste ist nach Monaten gruppiert. Der Gruppenkopf zeigt Monat und Monatssumme.
- [x] AC2: Entfällt auf Wunsch des Nutzers: Über der Liste steht keine Summenzeile („<N> Rechnungen · <Summe> €“) mehr. Die Monatsköpfe mit der Monatssumme vom Backend (AC1) bleiben. [Nutzer, 2026-11-05]
- [x] AC3: Langer Druck auf eine Listenzeile (Desktop: Rechtsklick) öffnet ein kleines Menü mit „Duplizieren“ (öffnet die Erfassung mit gleichen Werten und Datum heute) und „Löschen“ (mit Rückfrage); Rechnungen verbundener Konten bieten nur „Duplizieren“. Ein normaler Tipp öffnet weiter die Detailseite. Beide Aktionen gibt es zusätzlich in der Detailseite. Zeilen-Wischen gibt es nicht. [Nutzer, 2026-11-05]
- [x] AC4: Pull-to-Refresh lädt die Rechnungsliste neu. `overscroll-behavior` ist dafür angepasst.
- [x] AC5: In der Statistik wechselt der Monat (bzw. das Jahr) per ‹ › neben dem Zeitraum statt über das Select. Das Wischen zwischen den Tabs bleibt dabei funktionsfähig, das Design legt die Abgrenzung fest.
- [x] AC6: Ein Tipp auf eine Kategorie in der Statistik öffnet die Rechnungsliste, gefiltert nach dieser Kategorie und dem Zeitraum. Die Unterkategorie-Summen bleiben erreichbar.
- [x] AC7: Die Statistik zeigt den Vergleich zum Vormonat bzw. Vorjahr (z. B. „+12 %“) und ein Balkendiagramm der letzten 12 Monate.

**Haushalt (Review 5)**

- [x] AC8: Der Anteil der Lebenserhaltungskosten ist einstellbar, Standard 35 %. Er wird pro Benutzer im Backend gespeichert. Die feste Kodierung in `overview.component.ts` entfällt.
- [x] AC9: Ein Tipp auf eine Kategorie in der Übersicht öffnet die Fixkostenliste, gefiltert nach dieser Kategorie.
- [x] AC10: Die Fixkostenliste zeigt Kategoriesummen im Abschnittskopf und pro Zeile den auf den Monat umgerechneten Wert.
- [x] AC11: Nach dem Anlegen von Fixkosten oder Einkommen gibt es eine Snackbar, danach geht es zurück zur Liste.
- [x] AC12: Texte sind korrigiert: Bei Einkommen heißt das Feld „Betrag“ statt „Kosten“, der Leerzustand „Keine Einkommen.“, und die Fehlermeldung beim Löschen nennt Einkommen.

**Stunden (Review 6)**

- [x] AC13: Auf der Personen-Seite gibt es „Arbeitszeit erfassen“ mit vorgewählter Person.
- [x] AC14: Beim Erfassen lässt sich der letzte Eintrag der Person übernehmen (Uhrzeiten, Pause, Notiz), Datum heute.
- [x] AC15: Der Zahlungsdialog ist vorbelegt: Betrag = offene Stunden × Stundensatz, Trinkgeld 0. Bezahlte Stunden haben eine Formatprüfung.
- [x] AC16: Die Personenliste zeigt den offenen Betrag in Euro. „Zahlung offen“ beruht auf dem offenen Betrag.
- [x] AC17: Liegt das Ende vor dem Beginn, erscheint ein Fehler am Feld, und es kann nicht gespeichert werden. Netto wird nicht negativ.
- [x] AC18: Die Arbeitszeitenliste ist nach Monaten gruppiert, mit Zwischensumme je Monat. Sie lädt nicht mehr die ganze Historie auf einmal.
- [x] AC19: Statistik: Beträge mit Tausender- und Dezimaltrennzeichen, ein Leerzustand mit Erklärung, Filter pro Person (Backend `personFilter`) und Diagramme. Die tote `WorktimeComponent` und der leere Filter-Platzhalter sind entfernt.
- [x] AC20: Zahlungen in der Historie lassen sich bearbeiten und löschen (neue Backend-Endpoints). Löschen hat eine Rückfrage.
- [x] AC21: Der Export ist aus dem Bereich Stunden heraus erreichbar.
- [x] AC22: Beim Anlegen und Bearbeiten landet das gewählte Datum unabhängig von der Zeitzone auf genau diesem Tag. Ein Monatserster landet nicht im Vormonat, und der `getUTCDate() + 1`-Hack entfällt.
- [x] AC23: Nach Bearbeiten oder Löschen eines Eintrags stimmen die Gesamtstunden der Person sofort.
- [x] AC24: Der Eintragsdialog meldet bei Fehlern „Arbeitszeit konnte nicht gespeichert werden“.

**Einstellungen, Verbindungen, Export, Datenschutz (Review 7)**

- [x] AC25: Kategoriefarben werden aus einem Swatch-Raster gewählt statt aus einem Select mit CSS-Namen. Bestehende Farben bleiben gültig.
- [x] AC26: Löschen von Unterkategorien, Rechnungsfotos und allen anderen Einträgen hat eine Rückfrage. Es gibt kein Rückgängig.
- [x] AC27: Der Löschen-Button der Standardkategorie ist deaktiviert, mit Erklärung.
- [x] AC28: Nach dem Speichern einer Kategorie setzt „Abbrechen“ auf den gespeicherten Stand zurück. Neue Unterkategorien bekommen nach dem Speichern ihre ID, ein zweites Speichern erzeugt keine Duplikate.
- [x] AC29: Verbindungen: Annehmen und Ablehnen zeigen Ladezustand, Rückmeldung und Fehler. Nach dem Senden einer Anfrage gibt es eine Rückmeldung. Eine Verbindung lässt sich trennen und eine ausgehende Anfrage zurückziehen (neue Backend-Endpoints, mit Rückfrage).
- [x] AC30: Export: Zeitraum und Kategorie sind wählbar (Backend-Kategoriefilter in `ExportExpensesRequest` aktiviert). Die Datei wird über die Web Share API geteilt, wo verfügbar, sonst heruntergeladen. Fehler werden angezeigt.
- [x] AC31: „Benutzerdaten löschen“ funktioniert: Nach doppelter Rückfrage werden alle Daten des Benutzers in allen Services gelöscht (neue Endpoints), danach wird der Benutzer abgemeldet.

**PWA und Allgemeines (Review 8)**

- [x] AC32: Zoomen ist erlaubt: kein `user-scalable=0`/`maximum-scale=1.0`, das Kontextmenü ist nicht mehr global abgeschaltet.
- [x] AC33: Der Fehler-Interceptor zeigt einheitliche Fehler-Snackbars. Bei fehlender Verbindung erscheint ein Offline-Hinweisbanner.
- [x] AC34: Jede Liste und Seite hat einen Fehlerzustand mit „Erneut versuchen“ statt endlosem Spinner und einen Leerzustand mit Erklärung (z. B. Stunden-Statistik ohne Arbeitszeiten).
- [x] AC35: Löschen löst ein kurzes Vibrieren aus, wo unterstützt (Speichern seit US-0007).
- [x] AC36: „Warten auf Login …“ ist durch einen gestalteten Ladezustand ersetzt.
- [x] AC37: Komponenten, die Root-BehaviorSubjects abonnieren, melden sich beim Zerstören ab (`takeUntilDestroyed` o. ä.). Betroffen u. a. `overview`, `fixed-cost`, `income`, `person`, `add-working-entry`, `statistics`.
- [x] AC38: Der Haushaltsplan wird beim Start einmal geladen, nicht 3–4 Mal.
- [x] AC39: Die Statistik zeigt beim Zeitraumwechsel keine Werte des vorherigen Zeitraums. Der verfügbare Zeitraum aktualisiert sich nach neuen Arbeitszeiten.

**Allgemein**

- [x] AC40: Backend-Tests decken alle neuen und geänderten Endpoints ab: Summe der Treffer, Lebenserhaltungs-Anteil, `personFilter`, Zahlungen bearbeiten/löschen, Verbindung trennen/zurückziehen, Export-Filter, Benutzerdaten löschen. Frontend-Unit-Tests decken die geänderte Logik ab (Gruppierung, Datum/Zeitzone, Zahlungsvorbelegung, Plausibilität). Builds und Tests sind grün.
- [x] AC41: Die UI-Prüfung mit Playwright bei 390 px und 1440 px deckt alle Bereiche ab und ist grün.

## UI Verification

- 2026-11-05, **PASSED.** Abschlussprüfung bei 390 px und 1440 px gegen alle sichtbaren ACs, design.md und die Mockups 01–03 (`ui-testing/phase4/`), dazu Sichtprüfungen je UI-Task (`ui-testing/task-*`). Erster Lauf: 41 PASS, 1 FAIL (AC25: Farbpunkte nur 8 px groß), behoben in 885bfd0 und nachgeprüft (`ui-testing/phase4/recheck-*`). „Benutzerdaten löschen“ wurde mit Freigabe des Nutzers echt mit test2 ausgeführt: vier DELETE-Aufrufe mit 204 in Reihenfolge, Abmeldung, Wiederholung ebenfalls 204, frische Standardkategorien beim nächsten Login, eine test1-Rechnung in einer test2-Kategorie landete in der Standardkategorie von test1; test1 blieb unverändert. Lokal nicht prüfbar (durch Unit-/Backend-Tests und frühere Sichtprüfungen abgedeckt): Offline-Kaltstart ohne Service Worker, Senden/Annehmen echter Verbindungsanfragen (B2C Graph und Dapr fehlen lokal), echtes Pinch-Zoom und langer Druck auf eine Kachel. Konsole ohne Fehler außer den absichtlich erzeugten.

## Technical Notes

- Betroffene Services: Shopping (Summe, Export-Filter), Budgetplan (Lebenserhaltungs-Anteil), Work (Statistik `personFilter`, Zahlungen), Verbindungen (Service im Design klären), alle Services für „Benutzerdaten löschen“.
- Dateiverweise stehen in `docs/review.md` an den jeweiligen Punkten.
- Bibliotheks-APIs (z. B. Diagramme, Web Share API) per Context7 bzw. MDN nachschlagen.
- Offene Punkte aus US-0006: toter Routen-Provider `NgxMatTimepickerModule.setLocale` in `person-details.routes.ts` (Route `working-entry/:entry-id` wird nie angesteuert); Zeitauswahl-Buttons englisch („CANCEL“/„OK“); Zahlungszeile zeigt „08:00 h h“; fest kodierte M2-Farben in `styles.scss` als Tokens nach `_andaha-tokens.scss`; zeitabhängige Specs laufen unter Last in Timeouts (vor CI-Tests `testTimeout` anheben); bekannte NG0100 in Ausgaben/Statistik (Monats-Select zeigt Vormonat) und Warnung „ngModel mit formControl“ in den Kategorie-Details.
- Offene Punkte aus US-0007 (Backend, Shopping): Beim Löschen der eigenen Standardkategorie ordnet `DeleteBillCategoryCommandHandler` die Rechnungen der gerade gelöschten Kategorie zu (`SingleAsync(IsDefault)` liefert dieselbe Kategorie; vgl. AC27). Die Bill-Create/Update-Handler sind nicht darauf geprüft, ob `CategoryId`/`SubCategoryId` einer fremden Kategorie angegeben werden kann (Besitzprüfung wie bei den Vorlagen-Validatoren ergänzen).
- Beobachtungen aus der UI-Prüfung von US-0007 (2026-11-04):
  - Beim ersten Login eines neuen Kontos entstehen die Standardkategorien doppelt. Jede Seite ruft `GET /api/billcategory` zweimal gleichzeitig auf, und das Anlegen der Standardkategorien ist nicht gegen diese Parallelität abgesichert. Der Testbenutzer test2 hat deshalb doppelte Kategorien.
  - Rechnungen, die zwischen 23:00 und 24:00 Ortszeit gespeichert werden, bekommen das Datum des Folgetags. „Heute“ sendet den Zeitpunkt jetzt, und `shared/utils/utils.ts` wandelt ihn mit `moment(...).utc(true)` um. Zusammen mit AC22 lösen.
  - Das große Rechnungsformular und das Vorlagenformular zeigen bei ungültigen Feldern keinen Text, nur einen roten Rahmen und einen deaktivierten Speichern-Button.
  - Der Duplikat-Hinweis der Schnellerfassung zeigt keine Uhrzeit. Nach „Andere …“ klappt das Tastenfeld zu, und auf dem Desktop verliert das Betragsfeld den Fokus.
  - Auf `/settings/*` erscheint bei 1440 px ein Zurück-Pfeil, den Design v2 (04) nicht hat.
  - Ausgeblendete Vorschläge lassen sich nicht wieder einblenden, dafür gibt es keinen Endpoint.
  - Neuladen löscht den History-Zustand des aktuellen Eintrags: `AuthService` ruft `oauthService.tryLogin()` auf, und angular-oauth2-oidc macht dabei `history.replaceState(null, …)`. Dadurch geht die Spur `appTrail` aus US-0007 verloren, und nach Neuladen und Speichern zeigt Zurück die Liste einmal doppelt. Möglicher Ansatz: `tryLogin({ preventClearHashAfterLogin: true })`, wenn die URL keinen `code` enthält (Auth-Änderung, darum eigens prüfen).

## Out of Scope

- Soll/Ist-Vergleich Haushaltsplan und Fälligkeiten von Fixkosten
- Rückgängig nach Speichern oder Löschen (stattdessen Rückfrage)
- Offline-Warteschlange über den Bestand aus US-0005 hinaus
- Punkte aus US-0007 (Navigation, Erfassen, Vorlagen, Analyse, App-Shortcut, Share Target)
- Angular-Upgrade (US-0006)

## AI Usage

Siehe [ai-usage.md](./ai-usage.md). Die Session begann noch mit dem Abschluss von US-0007: Die Zeile „Before Planning“ (€106.90) ist US-0007 und dort erfasst. Auf US-0008 entfallen die übrigen Zeilen, zusammen €185.19 und 12h 05m (Planning bis Wrap-up). Die Sichtprüfungen je Task stecken in der Phase Implementation.
