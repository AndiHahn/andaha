# Review MiniClient – Verbesserungsvorschläge

Stand: 2026-11-02. Ergebnis einer Code-Durchsicht des MiniClients (`src/WebApps/MiniClient/Andaha.WebApps.MiniClient`) mit Blick auf die Nutzung als PWA am Handy. Die Punkte stammen aus dem Lesen des Codes, die App lief dabei nicht. Dateiangaben beziehen sich auf `src/app/`, sofern nicht anders angegeben.

Die Daten-Bugs aus dem Review (Analyse speichert nichts, Personen-Notizen, doppelt gezählte Stunden, Offline-Cache/Sync, Update-Reload, Detailseiten bei Reload, gesperrte Formulare nach Speicherfehler) werden separat behoben und stehen hier nicht.

---

## 1. Navigation und Struktur

Heute: 6 Bereiche im Drawer (Hamburger, also 2 Taps zum Wechseln), jeder Bereich mit eigener Bottom-Nav für die Unterseiten.

- [ ] **Unterseiten als Tabs oben, Wechsel per Wischen.** Beispiele: Rechnungen | Statistik, Übersicht | Fixkosten | Einkommen, Personen | Statistik. Wischen nach links/rechts wechselt den Tab, mit Slide-Animation.
  - Nur bei klar horizontaler Geste auslösen (ca. > 60 px, Winkel < 30°).
  - Nicht auslösen auf dem Kategorie-Chip-Streifen der Rechnungsliste, auf dem Pinch-Zoom-Foto, in Datepickern, auf Formularen und in Dialogen.
- [ ] **„Hinzufügen“ als FAB statt als Tab.** Ein Formular gehört nicht in die Wisch-Reihenfolge, sonst wischt man versehentlich ins Formular oder halb ausgefüllt wieder hinaus.
- [ ] **Bottom-Nav für die Hauptbereiche:** Rechnungen · Analyse · Haushalt · Stunden · Mehr (Einstellungen, Export, Rechtliches). Jeder Bereich mit einem Tap erreichbar.
- [ ] **Bottom-Sheets runterwischbar machen.** Die Griffleiste ist bisher nur Optik (`shared/dialog/dialog-functions.ts`).
- [ ] **Android-Zurück-Taste und Wischgeste** schließen offene Sheets/Dialoge, statt die Seite zu verlassen.

## 2. Rechnung erfassen

- [ ] **Shopname mit Autovervollständigung** aus den bisherigen Rechnungen. Nach der Auswahl die zuletzt verwendete Kategorie und Unterkategorie dieses Shops vorbelegen. Braucht ggf. einen Backend-Endpoint (z. B. „zuletzt verwendete Shops mit Kategorie“).
- [ ] **Preisfeld mit `inputmode="decimal"`** statt nur `type="number"` (Komma, Ziffernblock). Ggf. Preis als erstes Feld mit Autofokus (`features/bill/modules/add-bill/add-bill.component.html`).
- [ ] **Datum mit Schnellwahl** „Heute · Gestern · Datum wählen“ statt Texteingabe.
- [ ] **Feedback nach dem Speichern:** Snackbar „Gespeichert · Rückgängig“. Bisher wird das Formular nur geleert (`add-bill.component.ts` `onSubmit`).
- [ ] **Foto mit nativer Kamera** (`<input type="file" accept="image/*" capture="environment">`) statt ngx-webcam im Dialog mit Radio-Umschalter (`features/bill/modules/add-bill-image-dialog/`).
- [ ] **Fotos vor Upload und Cache verkleinern** (JPEG, ca. 1600 px lange Kante, Qualität 0,8). Bisher werden Kamerabilder als PNG gespeichert (`shared/utils/file-utils.ts`), Analyse-Fotos gehen ungeändert raus.
- [ ] **„Rechnung scannen“ im Hinzufügen-Ablauf:** Foto → Analyse → Formular vorbefüllt (Shop, Datum, Betrag, Kategorie, Unterkategorie) → prüfen → Speichern. Das Backend liefert diese Felder bereits.

## 3. Rechnungsliste und Statistik

- [ ] **Liste nach Monaten gruppieren**, Monatssumme im Gruppenkopf.
- [ ] **Summe der gefilterten Treffer** anzeigen, z. B. „23 Rechnungen · 412,30 €“ (braucht ggf. die Summe vom Backend).
- [ ] **Wischaktionen auf Listenzeilen:** nach links Löschen mit Undo, nach rechts Duplizieren.
- [ ] **Pull-to-Refresh.** Derzeit durch `overscroll-behavior: none` abgeschaltet (`styles.scss`).
- [ ] **Statistik: Monat per Wischen oder ‹ › wechseln** statt über das Select (`features/bill/modules/expenses/timerange-selection/`).
- [ ] **Tipp auf eine Kategorie öffnet die Rechnungsliste**, gefiltert nach Kategorie und Zeitraum. Kategorie- und Datumsfilter gibt es im `BillContextService` schon. Der Kategorie-Dialog zeigt bisher nur Summen der Unterkategorien.
- [ ] **Vergleich zum Vormonat** („+12 %“) und Balkendiagramm über die letzten 12 Monate.

## 4. Analyse (nach dem Bugfix)

- [ ] **Positionen (LineItems) in der Detailansicht anzeigen.** Das Backend liefert sie, das Frontend zeigt sie nicht.
- [ ] **„Als Rechnung übernehmen“ und „Verwerfen“** für analysierte Rechnungen. Für „Verwerfen“ fehlt ein Backend-Endpoint.
- [ ] **Pinch-Zoom im Foto-Dialog** der analysierten Rechnung, wie bei normalen Rechnungen (`features/bill-analysis/modules/analyzed-bill-image/analyzed-bill-image-dialog/`).
- [ ] **Analyse-Pipeline härten:**
  - Azure: Der `AnalyzeBillWorker` markiert ein Bild direkt nach dem Verschicken der Nachricht als verarbeitet. Schlägt die Analyse danach fehl, wird das Foto nie analysiert.
  - Dateisystem-Repository (Development): `MarkAsProcessedAsync` markiert nichts. Ein Bild wird jede Minute erneut verschickt, bis der Handler es löscht.
  - Betroffen: `Services/Shopping/.../BackgroundJobs/AnalyzeBillWorker.cs`, `FileSystemAnalysisImageRepository.cs`.
- [ ] **Paginierung der Analyse-Liste:** Sie ist wirkungslos, weil `totalResults = result.length` und das Backend die Seitenparameter ignoriert. Echte Paginierung bauen oder den versteckten Paginator entfernen (`features/bill-analysis/services/analyzed-bill-context.service.ts`).

## 5. Haushaltsplan

- [ ] **Soll/Ist-Vergleich** zwischen Plan und echten Ausgaben aus den Rechnungen (`ExpenseApiService.getExpenses(timeRange)` gibt es schon). Dafür braucht es eine Zuordnung der Rechnungskategorien zu den `CostCategory`-Kategorien.
- [ ] **„Lebenserhaltungskosten“ einstellbar machen** oder durch echte Ausgaben ersetzen. Bisher fest mit 35 % des Einkommens kodiert (`features/budgetplan/modules/overview/overview.component.ts:77`).
- [ ] **Tipp auf eine Kategorie in der Übersicht** führt zur gefilterten Fixkostenliste. Kategoriesummen und normierten Monatswert pro Zeile in der Fixkostenliste zeigen.
- [ ] **Fälligkeiten** für vierteljährliche und jährliche Fixkosten, optional mit Erinnerung (Backend-Erweiterung nötig).
- [ ] **Feedback nach dem Anlegen** von Fixkosten und Einkommen (Snackbar oder Rücksprung zur Liste). Bisher wird nur das Formular geleert (`create-fixed-cost.component.ts:49-52`).
- [ ] **Texte korrigieren:**
  - Bei Einkommen heißt das Feld „Kosten“ (`create-income.component.html:23`, `income-details.component.html:24`).
  - Leerzustand bei Einkommen lautet „Keine Ausgaben.“ (`income-list.component.html:4`).
  - Fehlermeldung beim Löschen von Einkommen lautet „Fixkostenpunkt konnte nicht gelöscht werden.“ (`income-details.component.ts:143`).

## 6. Stunden

- [ ] **„Arbeitszeit erfassen“ direkt auf der Personen-Seite**, mit vorgewählter Person.
- [ ] **„Letzten Eintrag duplizieren“** oder Vorlagen für die Arbeitszeit.
- [ ] **Zahlungsdialog vorbelegen:** Betrag = offene Stunden × Stundensatz, Trinkgeld standardmäßig 0 statt leerem Pflichtfeld (`payment-form-functions.ts:15`). Bezahlte Stunden mit Formatprüfung statt freiem Text (`person-payment-dialog.component.html:8`).
- [ ] **Offenen Betrag in der Personenliste anzeigen.** „Zahlung offen“ vergleicht bisher nur Stunden:Minuten (`person-list.component.ts:28-31`).
- [ ] **Plausibilitätsprüfung:** Ende vor Beginn wird nicht erkannt, Netto wird dann falsch (`features/work/functions/date-time-functions.ts:29-52`).
- [ ] **Arbeitszeitenliste nach Monaten gruppieren**, mit Zwischensummen. Bisher wird die ganze Historie ungruppiert geladen.
- [ ] **Statistik:**
  - Beträge mit `number`-Pipe formatieren (`statistics.component.html:36,57,71`).
  - Leerzustand ergänzen.
  - Statistik pro Person (Backend unterstützt `personFilter` noch nicht), ggf. Diagramme.
  - Tote `WorktimeComponent` und leeren Filter-Platzhalter entfernen.
- [ ] **Zahlungshistorie bearbeiten/löschen** (Backend hat nur `POST {id}/pay`).
- [ ] **Export aus den Stunden heraus** erreichbar machen, nicht nur im Export-Bereich.
- [ ] **Datum beim Bearbeiten eines Eintrags prüfen (Vermutung):** UTC- und lokale Werte werden gemischt (`work-entry-details-dialog.component.ts:166-168`), beim Anlegen steht der Hack `getUTCDate() + 1` (`add-working-entry.component.ts:134`). Ein Monatserster landet möglicherweise im Vormonat.
- [ ] **Gesamtstunden nach Bearbeiten/Löschen eines Eintrags aktualisieren.** Bisher werden nur die Einträge neu geladen, nicht die Person (`work-entry-list.component.ts:51`).
- [ ] **Fehlertext korrigieren:** Der Eintragsdialog meldet „Person konnte nicht gespeichert werden“ (`work-entry-details-dialog.component.ts:123`).

## 7. Einstellungen und Export

- [ ] **Kategoriefarben als Swatch-Raster** statt Select mit 40 englischen CSS-Namen wie „lemonchiffon“ (`features/settings/modules/categories/functions/category-functions.ts`).
- [ ] **Löschen absichern:** Unterkategorien und Rechnungsfotos werden ohne Rückfrage gelöscht (`category-item-details.component.ts:77-83`, `bill-image-dialog.component.ts:40`). Einheitlich eine Undo-Snackbar einführen (`shared/snackbar/` kennt bisher keine Aktion).
- [ ] **Löschen-Button bei der Standardkategorie deaktivieren** (`category-item-details.component.html:97`).
- [ ] **Kategorie-Details:** Nach dem Speichern `this.category` aktualisieren, sonst setzt „Abbrechen“ auf alte Werte zurück. Neue Unterkategorien behalten `id=null`, ein zweites Speichern erzeugt vermutlich Duplikate (`category-item-details.component.ts:111`).
- [ ] **Verbindungen:**
  - Annehmen/Ablehnen mit Ladezustand, Rückmeldung und Fehlerbehandlung (bisher nur `console.log`, `incoming-connection-requests.component.ts:21-35`).
  - Feedback nach dem Senden einer Anfrage (`connection.component.ts:18`).
  - Verbindung trennen und ausgehende Anfrage zurückziehen (Backend-Endpoints fehlen).
- [ ] **Export:**
  - Zeitraum und Kategorie wählbar. Das Backend kann den Kategoriefilter fast, der Parameter ist nur auskommentiert (`Services/Shopping/.../ExportExpensesRequest.cs:9`).
  - Datei über die Web Share API teilen statt als Download (`shared/utils/file-utils.ts:43-60`).
  - Fehler anzeigen statt verschlucken (`features/export/export.component.ts:27,35`).
- [ ] **„Benutzerdaten löschen“:** Der Button hat keinen Handler (`features/data-protection/user-data/user-data.component.html:4`), ein Endpoint fehlt.

## 8. PWA und Allgemeines

- [ ] **Zoomen erlauben:** `user-scalable=0`/`maximum-scale=1.0` und das global abgeschaltete Kontextmenü (`index.html`) verhindern Zoomen (Barrierefreiheit).
- [ ] **Fehler-Interceptor mit Funktion füllen:** einheitliche Fehler-Snackbars, Offline-Hinweisbanner. Bisher wird das Ergebnis von `throwError` verworfen (`core/error-http-interceptor.service.ts:19`).
- [ ] **Fehler- und Leerzustände:** Bei Ladefehlern dreht der Spinner endlos (z. B. `fixed-cost.component.html:3`). Die Statistik bleibt ohne Arbeitszeiten ohne Hinweis leer.
- [ ] **App-Shortcuts im Manifest:** Langes Drücken auf das App-Icon → „Rechnung hinzufügen“, „Rechnung scannen“.
- [ ] **Share Target:** Ein Foto aus der Galerie direkt an Andaha teilen.
- [ ] **Haptisches Feedback:** kurzes Vibrieren beim Speichern und Löschen.
- [ ] **„Warten auf Login...“** durch einen gestalteten Ladezustand ersetzen (`app.component.html`).
- [ ] **Subscriptions beenden:** Mehrere Komponenten abonnieren Root-BehaviorSubjects ohne `takeUntil` (`overview.component.ts:72`, `fixed-cost.component.ts:41`, `income.component.ts:24`, `person.component.ts:21`, `add-working-entry.component.ts:38`, `statistics.component.ts:59-93`).
- [ ] **Doppelte Requests:** Der Haushaltsplan wird beim Start 3–4 Mal geladen (`features/budgetplan/services/budgetplan-context.service.ts:23,52-80`).
- [ ] **Veraltete Statistikwerte:** Werte des vorherigen Zeitraums bleiben stehen, bis neue geladen sind. Der verfügbare Zeitraum wird nach neuen Arbeitszeiten nicht aktualisiert (`statistics-context.service.ts:101-110`, Vermutung).
- [ ] **Angular-Upgrade** von 14 auf eine aktuelle Version (eigenes Projekt).

---

## Empfohlene Reihenfolge

1. Navigation: Tabs und Swipe, FAB statt Hinzufügen-Tab, Hauptbereiche in der Bottom-Nav.
2. Schneller erfassen: Shop-Autovervollständigung mit Kategorie-Vorschlag, Dezimaltastatur, Datum-Schnellwahl, Undo-Snackbar, Fotos verkleinern.
3. Analyse als „Rechnung scannen“ in den Hinzufügen-Ablauf einbauen.
4. Statistik: Monat wischen, Tipp auf Kategorie führt zu den Rechnungen, Vormonatsvergleich.
