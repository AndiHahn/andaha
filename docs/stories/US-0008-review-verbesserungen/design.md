# US-0008 Design: Übrige Verbesserungen aus dem Review

Stand: 2026-11-05. Grundlage: [`story.md`](./story.md) (AC1–AC41), [`docs/review.md`](../../review.md) Abschnitte 3, 5–8, `docs/design/DESIGN.md` und die Navigation aus Design v2 (`docs/design/v2/`).

Abgestimmte Mockups (390 px, statisches HTML im Stil von v2) liegen in [`mockups/`](./mockups/):

- `01-rechnungen.html`: Liste, Statistik, gefilterte Liste
- `02-haushalt-stunden.html`: Übersicht mit Anteil-Sheet, Fixkosten, Person, Arbeitszeit erfassen
- `03-einstellungen.html`: Kategorie, Verbindungen, Export, Daten löschen mit Offline- und Fehlerzustand

Die Mockups sind die Vorlage für Aufbau und Texte. Werte darin sind erfunden.

Markierungen:

- **[Nutzer]** hat der Nutzer entschieden.
- **[Entscheidung]** ist ein Vorschlag aus dem Design, den der Nutzer an den Mockups gesehen und nicht beanstandet hat.
- **[Technik]** ist eine technische Entscheidung des Designs.

## 1. Absicht

Nach US-0007 ist das Erfassen schnell. Diese Story bringt den Rest der App auf denselben Stand:

- Listen sind übersichtlich und zeigen Summen.
- Statistiken führen per Tipp zu den Rechnungen.
- Texte und Zahlen stimmen.
- Jede Aktion gibt eine Rückmeldung.
- Löschen hat immer eine Rückfrage.
- Es gibt keine endlosen Spinner.

**[Nutzer]** Die Story wird in einem Durchgang umgesetzt, mit einem Plan, einer Abschluss-Prüfung und einem Merge.

**Ziele:** alle ACs aus `story.md`, dazu die Restpunkte aus §8.

**Nicht-Ziele:** siehe Out of Scope in `story.md`, außerdem:

- Neugestaltung der Detailseiten über die genannten Punkte hinaus
- Desktop-eigene Layouts: Desktop folgt den bestehenden Mustern aus US-0007, also Sidebar und zentrierte Dialoge.

**Anti-Ziele:**

- eine neue globale Fehlermeldung, die eine bestehende, genauere Meldung doppelt oder ersetzt;
- Gesten, die sich gegenseitig auslösen (Zeilen-Wischen gegen Tab-Wischen);
- Datenmigrationen, die bestehende Daten verändern (die Datumskorrektur in §4.4 kommt ohne aus);
- das Löschen des Login-Kontos.

## 2. Querschnitt (gilt für alle Bereiche)

### 2.1 Lade-, Fehler- und Leerzustand (AC34) [Technik]

Ein gemeinsamer Baustein, z. B. `app-load-state`, bekommt einen Zustand `loading | error | empty | ready`, einen Leertext mit Erklärung und ein Retry-Callback. Der Fehlerzustand zeigt „Laden fehlgeschlagen“, einen Erklärsatz und den Button „Erneut versuchen“ (Mockup 03 D).

Der Baustein kommt auf jede Liste und Seite, die heute nur einen Spinner hat:

- Rechnungen: Statistik
- Haushalt: Übersicht, Fixkosten, Einkommen
- Stunden: Personen, Statistik, Arbeitszeitenliste
- Verbindungen: alle drei Listen
- Mehr: Kategorien, Vorlagen
- Export

Die Context-Services liefern dafür einen Fehlerzustand statt nur `loading`. Wie, entscheidet der Umsetzende, z. B. mit einem `error`-Signal je Liste.

### 2.2 Fehler-Interceptor und Offline-Banner (AC33) [Technik]

- Der Interceptor wird funktional (`withInterceptors`). Er zeigt eine Fehler-Snackbar bei
  - Status 0 bzw. Netzfehler: „Keine Verbindung zum Server“;
  - Status ≥ 500: „Etwas ist schiefgelaufen. Bitte später erneut versuchen.“
- 4xx überlässt er den Komponenten.
- Eine Anfrage, deren Aufrufer eine eigene, genauere Meldung zeigt, setzt ein `HttpContextToken` (z. B. `SKIP_GLOBAL_ERROR`). Der Umsetzende geht alle bestehenden `openErrorSnackbar`-Aufrufe durch: Entweder setzt die Anfrage das Token, oder die eigene Meldung entfällt. Es darf nie zwei Snackbars für einen Fehler geben.
- Das Offline-Banner ist app-weit und sitzt unter dem Seitenkopf: „Keine Verbindung – Änderungen sind gerade nicht möglich“ (Mockup 03 D).
  - Ein kleiner Service liest `navigator.onLine` und die Events `online`/`offline`.
  - Der Offline-Speicher aus US-0005 und die Offline-Texte aus US-0007 bleiben unverändert.
  - **[Entscheidung, Builder-Check]** Da neue Rechnungen offline weiter erfasst werden können, lautet der Text: „Keine Verbindung – neue Rechnungen werden später übertragen.“ Andere Aktionen werden nicht gesperrt. Sie scheitern mit der Snackbar aus dem Interceptor.

### 2.3 Löschen (AC26, AC35)

- Jedes Löschen hat eine Rückfrage über den bestehenden `ConfirmationDialogService`. Es gibt kein Rückgängig. Der Umsetzende sucht alle Lösch-Aktionen und ergänzt die fehlenden. Bekannt sind:
  - Unterkategorie (bisher `removeAt` ohne Rückfrage, wirksam erst beim Speichern; die Rückfrage kommt beim Entfernen);
  - Rechnungsfoto (`bill-image-dialog`);
  - Zahlung (neu);
  - Verbindung trennen und Anfrage zurückziehen (neu).
- Nach erfolgreichem Löschen vibriert das Gerät kurz: `vibrate()` aus `shared/utils/haptics.ts`.

### 2.4 Weiteres

- **Zoom (AC32):** In `index.html` entfallen `maximum-scale=1.0, user-scalable=0` und `oncontextmenu="return false;"`. Der lange Druck auf Kacheln (US-0007) verhindert sein Kontextmenü selbst. Der Umsetzende prüft, dass das so bleibt.
- **Login-Ladezustand (AC36):** Statt „Warten auf Login …“ zeigt die App einen zentrierten Ladebildschirm mit App-Name bzw. Logo und Spinner, in den Farben aus DESIGN.md.
- **Abmelden der Subscriptions (AC37):** `takeUntilDestroyed` in allen Komponenten, die Root-Streams abonnieren. Mindestens betroffen sind:
  - `overview`, `fixed-cost`, `income`
  - `person`, `add-working-entry`
  - `statistics` (Stunden)

  Der Umsetzende sucht weitere.
- **Haushaltsplan einmal laden (AC38):** `BudgetPlanContextService` lädt beim Start genau einmal. Danach lädt er nach jeder Änderung an Fixkosten und Einkommen neu, aber erst nach der Server-Antwort, nicht schon beim optimistischen Entfernen. Heute laden Konstruktor, `backendReady` und die beiden Listen-Streams je einzeln.
  - Ein Unit-Test prüft die Zahl der Requests.

## 3. Rechnungen (AC1–AC7)

### 3.1 Liste (AC1–AC4), Mockup 01 A/C

- **Summe der Treffer (AC2) [Nutzer, 2026-11-05]:** Entfällt. Über der Liste steht keine Zeile „<N> Rechnungen · <Summe> €“ mehr; die Monatsköpfe mit Monatssumme bleiben. Das Backend liefert `totalSum` weiter, das Frontend zeigt es nicht an (`totalSum$` im `BillContextService` entfernt).
- **Monatsgruppen (AC1):** Vor jedem Monat steht ein Kopf „November 2026“ mit der Monatssumme rechts.
  - Die Monatssummen kommen vom Backend für alle Monate der Treffer. Sie stimmen also auch dann, wenn ein Monat erst teilweise geladen ist.
  - Wie Köpfe und virtuelles Scrollen zusammengehen, entscheidet der Umsetzende. Möglich sind Köpfe als eigene Einträge im Viewport oder ein Verzicht auf `cdk-virtual-scroll`, wenn die Leistung reicht.
  - Seitenweises Nachladen (50 Einträge) bleibt.
- **Backend [Technik]:** `GET api/bill/` liefert zusätzlich `totalSum` und `monthSums: [{ month: "YYYY-MM", sum }]` über alle Treffer. Das bestehende `PagedResultDto` wird dafür erweitert, z. B. als `BillSearchResultDto`. Gerechnet wird mit denselben Filtern wie die Liste: eigene und verbundene Benutzer, Suche, Kategorie, Datum.
- **Langer Druck auf Listenzeilen (AC3) [Nutzer, 2026-11-05]:** Ersetzt die Wischaktionen, weil das Zeilen-Wischen das Tab-Wischen störte.
  - Langer Druck auf eine Zeile (Touch, 500 ms; Desktop: Rechtsklick) öffnet unter der Zeile ein kleines Menü mit „Duplizieren“ und „Löschen“. Baustein wie bei den Kacheln der Schnellerfassung (US-0007): `appLongPress` und `MatMenu` mit `appMenuBack`, Zurück schließt das Menü.
  - „Duplizieren“ öffnet das große Formular `/bill/create` mit dem `BillCreatePrefill` aus US-0007: Preis, Shop, Kategorie, Unterkategorie und Notizen übernommen, Datum heute, ohne Foto.
  - „Löschen“ löst die Rückfrage aus, dann das Löschen mit kurzem Vibrieren. Rechnungen verbundener Konten bieten nur „Duplizieren“.
  - Ein normaler Tipp öffnet weiter die Detailseite; der Tipp, der einen langen Druck beendet, navigiert nicht.
  - In der Rechnungsdetailseite stehen „Duplizieren“ und „Löschen“ zusätzlich als Buttons.
- **Abgrenzung zum Tab-Wischen [Nutzer, 2026-11-05]:**
  - Es gibt kein Zeilen-Wischen mehr. Die Zeilen tragen kein `data-no-swipe`, das Tab-Wischen greift auf der ganzen Liste.
  - Ein langer Druck bricht ab, sobald sich der Finger mehr als 10 px bewegt; Scrollen und Tab-Wischen lösen ihn also nicht aus.
- **Pull-to-Refresh (AC4) [Technik]:**
  - Am oberen Rand der Liste zieht man einen runden Indikator herunter, wie in Mockup 01 C. Wer über eine Schwelle zieht, lädt neu. Das ruft `refreshBills()` und lädt die Summen mit.
  - `overscroll-behavior` wird so angepasst, dass der Browser nicht selbst neu lädt und die Geste beim Scroll-Container der Liste ankommt.
  - Die Geste wird selbst gebaut, ohne neue Bibliothek.

### 3.2 Statistik (AC5–AC7), Mockup 01 B

- **Zeitraum (AC5) [Entscheidung]:**
  - Ein Segment „Monat | Jahr | Gesamt“. „Benutzerdefiniert“ bleibt als vierte Option mit Von/Bis, falls die heutige Auswahl das hat.
  - Daneben ‹ und › um den Zeitraum. Bei Monat und Jahr wechseln sie den Zeitraum, bei Gesamt sind sie ausgeblendet.
  - An den Grenzen des verfügbaren Zeitraums ist der Pfeil deaktiviert.
  - Wischen auf der Seite wechselt weiter die Tabs, nicht den Monat.
  - Das Mat-Select für Monat und Jahr entfällt. Damit verschwindet das bekannte NG0100.
  - Die Stunden-Statistik nutzt dieselbe Komponente (`TimerangeSelectionComponent`) und bekommt die Pfeile mit.
- **Summe und Vergleich (AC7):**
  - Unter dem Zeitraum steht die Summe mit einem Abzeichen „+12 % zum Vormonat“ bzw. „zum Vorjahr“. Mehr Ausgaben sind rot, weniger grün.
  - Bei Gesamt und Benutzerdefiniert gibt es keinen Vergleich.
  - Jede Kategoriezeile zeigt ihre eigene Veränderung in %. Ist der Vorzeitraum 0, steht dort „neu“.
- **Balkendiagramm (AC7):**
  - Es zeigt die letzten 12 Monate bis zum gewählten Monat, den gewählten Monat in Primärfarbe.
  - Im Jahr-Modus zeigt es die 12 Monate des gewählten Jahres.
  - Bei Gesamt und Benutzerdefiniert entfällt das Diagramm.
  - Umsetzung mit chart.js bzw. ng2-charts, die schon im Projekt sind. Für die Bar-Chart-API Context7 nutzen.
- **Backend [Technik]:**
  - Neuer Endpoint `GET api/expense/monthly?until=YYYY-MM&months=12` liefert `[{ month, costs }]`. Er nutzt dieselbe Grundlage wie `GetExpenses`: eigene und verbundene Benutzer, nur Kategorien mit `IncludeToStatistics`.
  - Den Vorzeitraum holt das Frontend mit dem bestehenden `GET api/expense/` für den vorherigen Monat bzw. das vorherige Jahr.
- **Kategorie antippen (AC6) [Entscheidung]:**
  - Die Kategoriezeile öffnet die Rechnungsliste mit Kategoriefilter (Name, wie der bestehende Filter) und Datumsfilter (Zeitraum der Statistik) über `BillContextService`.
  - Beide Filter erscheinen in der Liste als aktive Chips mit ×. Der Datumschip zeigt z. B. „November 2026“ oder „01.01.–31.12.2026“.
  - Die Summe über der Liste stimmt dann mit der Statistik überein.
  - Ein Pfeil rechts in der Zeile klappt die Unterkategorie-Summen auf. Sie kommen aus dem bestehenden `ExpenseDto.subCategories`, Kosten ohne Unterkategorie stehen als „ohne Unterkategorie“.
  - Der bisherige Dialog `chart-details-dialog` und der Ring entfallen. Der Ring wird durch Balken und Zeilen ersetzt.
  - Das Ausblenden einzelner Kategorien („Auge“) entfällt mit dem Ring **[Entscheidung]**.

## 4. Haushalt (AC8–AC12), Mockup 02 A/B

- **Lebenserhaltungskosten (AC8):**
  - Die Zeile zeigt Untertitel „35 % vom Einkommen“ und Betrag.
  - Ein Tipp öffnet ein Sheet (Desktop: Dialog) mit einem Prozentfeld, ganzzahlig von 0 bis 100. Darunter steht der Hinweis „Entspricht … € im Monat. Standard: 35 %.“, dann Abbrechen und Speichern.
- **Backend [Technik]:**
  - Neue Tabelle im BudgetPlan-Service, z. B. `BudgetPlanSettings` mit `UserId` (Schlüssel) und `LivingCostShare` (int, Prozent, Standard 35).
  - `GET api/budgetplan/settings` liefert den gespeicherten Wert oder 35. `PUT api/budgetplan/settings` legt an oder ändert.
  - Dazu eine Migration im BudgetPlan-Kontext.
  - Der Anteil gilt für den angemeldeten Benutzer. Das Einkommen bleibt die Summe aus eigenen und verbundenen Benutzern, wie heute.
  - Die feste Kodierung `* 0.35` in `overview.component.ts` entfällt.
- **Kategorie antippen (AC9):**
  - Eine Kategoriezeile der Übersicht öffnet den Tab Fixkosten mit Filter auf diese Kategorie, z. B. `/budgetplan/fixedcost?category=FlatAndOperating`. Oben steht ein Filter-Chip mit ×.
  - „Einkommen“ öffnet den Tab Einkommen.
- **Fixkostenliste (AC10):**
  - Der Abschnittskopf zeigt rechts die Kategoriesumme pro Monat, z. B. „1.240,00 € / Monat“.
  - Jede Zeile zeigt rechts den Betrag fett. Darunter steht das Intervall und, wenn es nicht monatlich ist, „· 120,00 € / Monat“.
  - Umgerechnet wird im Frontend mit den Faktoren aus `Duration`: 1, 3, 6, 12. Das Backend rechnet genauso (`GetMonthlyValue`).
- **Nach dem Anlegen (AC11):** Snackbar „Gespeichert · <Name>“, kurzes Vibrieren wie in US-0007, dann zurück zur Liste über `historyTrail.leaveTo`, wie bei den anderen Formularen.
- **Texte (AC12):**
  - Einkommen anlegen und bearbeiten: Das Feld heißt „Betrag“ statt „Kosten“.
  - Leerzustand der Einkommen: „Keine Einkommen.“
  - Die Löschmeldung bei Einkommen ist schon richtig („Einkommen konnte nicht gelöscht werden.“). Der Umsetzende prüft das und hält es fest.

## 5. Stunden (AC13–AC24, AC39), Mockup 02 C/D

### 5.1 Personen

- **Personenliste (AC16):**
  - Jede Zeile zeigt den offenen Betrag in Euro neben den offenen Stunden. Offener Betrag = (Gesamtstunden − bezahlte Stunden) × Stundensatz.
  - „Zahlung offen“ erscheint, wenn der offene Betrag über 0,00 € liegt (auf Cent gerundet).
  - Gerechnet wird im Frontend aus `PersonDto` **[Technik]**.
- **Personenseite (Mockup 02 C):**
  - Kennzahlen: Gesamt, Offen (h) und Offen (€).
  - Neuer Primär-Button „Arbeitszeit erfassen“ (AC13). Er öffnet die Erfassung mit vorgewählter Person, z. B. `create-working-entry?person=<id>`. Daneben steht „Zahlung“.
  - Die Zahlungszeile zeigt „12.10.2026 · 20:00 h“; das doppelte „h h“ entfällt. Darunter „300,00 € + 20,00 € Trinkgeld“.
  - Jede Zahlung hat die Aktionen Bearbeiten und Löschen (AC20). Löschen hat eine Rückfrage.

### 5.2 Arbeitszeitenliste (AC18, AC23)

- Die Liste ist nach Monaten gruppiert. Der Kopf zeigt die Monatssumme in Stunden und den Betrag in Euro (Stunden × aktueller Stundensatz).
- **Laden [Technik]:**
  - Zuerst die neuesten 3 Monate mit Einträgen, darunter „Ältere Monate laden“ für die nächsten 3.
  - Das Backend bekommt einen Endpoint, der Einträge einer Person monatsweise liefert. Er gibt zurück, ob es ältere gibt, z. B. `GET api/working-entry/{personId}?until=YYYY-MM&months=3` mit der Antwort `{ entries, nextUntil }`.
  - Die genaue Form legt der Umsetzende fest. Wichtig ist nur, dass ein Monat immer vollständig geladen ist, damit die Monatssumme stimmt.
- Nach Bearbeiten oder Löschen eines Eintrags laden die Einträge und die Person neu (`PersonContextService`). Die Gesamtstunden stimmen also sofort (AC23).

### 5.3 Arbeitszeit erfassen (AC14, AC17, AC22, AC24)

- Eine vorgewählte Person kommt aus dem Query-Parameter.
- **Letzten Eintrag übernehmen (AC14):**
  - Ist genau eine Person gewählt, zeigt eine Zeile „Letzter Eintrag: 04.11. · 07:00 – 12:30 · Übernehmen“.
  - Übernehmen setzt Beginn, Ende, Pause und Notiz. Das Datum bleibt heute.
  - Bei mehreren gewählten Personen entfällt die Zeile **[Entscheidung]**.
  - Den letzten Eintrag liefert der monatsweise Endpoint (neuester Eintrag) oder ein kleiner eigener Endpoint. Das entscheidet der Umsetzende.
- **Plausibilität (AC17):**
  - Liegt das Ende vor oder gleich dem Beginn, erscheint der Fehler „Ende liegt vor dem Beginn“ am Feld Ende, und Speichern ist gesperrt.
  - Ist die Pause länger als die Arbeitszeit, erscheint ein Fehler am Feld Pause.
  - Netto wird nie negativ; bei ungültiger Eingabe zeigt es „–“.
  - Dieselbe Prüfung gilt im Bearbeiten-Dialog.
  - Das Backend prüft beides im Validator für Anlegen, Bulk und Ändern. `WorkingEntry.Update` prüft heute nicht.
- **Datum (AC22) [Technik]:**
  - Beginn und Ende werden aus den **lokalen** Bestandteilen des gewählten Tages gebildet (`getFullYear/getMonth/getDate`) plus der Uhrzeit, als lokale `Date`.
  - Es gibt keine UTC-Getter und kein `+ 1` mehr. Anlegen und Bearbeiten nutzen eine gemeinsame Funktion statt der zwei Kopien von `setFormTime` und `formatDateAsString`.
  - Der Bearbeiten-Dialog liest die Werte ebenfalls lokal.
  - Transport und Speicherung bleiben wie heute: ISO-Zeitpunkt, `smalldatetime`. Bestehende Einträge bleiben damit richtig, und es gibt keine Datenmigration.
  - Unit-Tests decken Monatserste, Monatsletzte und den Jahreswechsel ab.
- **Fehlermeldung (AC24):** Der Text „Arbeitszeit konnte nicht gespeichert werden“ steht schon im Bearbeiten-Dialog. Der Umsetzende prüft das Anlegen und gleicht es an.
- **Nach dem Speichern:**
  - Snackbar und Vibrieren wie bisher.
  - Zusätzlich aktualisiert sich der verfügbare Zeitraum der Statistik (AC39).

### 5.4 Zahlung (AC15, AC20)

- **Dialog vorbelegt:**
  - Bezahlte Stunden = offene Stunden im Format „hh:mm“. Ein Validator prüft das Format (`^\d{1,4}:[0-5]\d$`) und dass der Wert größer als 0 ist.
  - Betrag = offene Stunden × Stundensatz, auf Cent gerundet.
  - Trinkgeld = 0.
  - Der Dialog bekommt den Stundensatz in seinen Daten.
- **Bearbeiten:** derselbe Dialog mit den Werten der Zahlung.
- **Backend [Technik]:**
  - `PUT api/person/{personId}/payments/{paymentId}` und `DELETE api/person/{personId}/payments/{paymentId}`.
  - `Payment` bekommt eine `Update`-Methode, `Person` eine Methode zum Entfernen einer Zahlung.
  - Beide Endpoints prüfen den Besitz wie die bestehenden Person-Endpoints.

### 5.5 Statistik (AC19, AC21, AC39)

- **Personenfilter:**
  - Chips „Alle“ plus eine pro Person, mit Einfachauswahl.
  - **Backend:** `personFilter` als optionale Liste von Person-IDs, sowohl für `POST api/work-statistics/` als auch für `GET api/work-statistics/full`.
  - Das Frontend reicht den Parameter durch. Heute ignoriert `statistics-api.service.ts` ihn.
- **Beträge:** mit Tausender- und Dezimaltrennzeichen (de-AT bzw. die bestehende Locale), überall auf der Seite.
- **Diagramm:** (bei „Benutzerdefiniert“ wie bei Gesamt kein Diagramm)
  - Ein Balkendiagramm der Stunden pro Monat (letzte 12 Monate bis zum gewählten Zeitraum, respektiert den Personenfilter).
  - **Backend:** neuer Endpoint, z. B. `GET api/work-statistics/monthly?until=YYYY-MM&months=12&personFilter=…`, liefert `[{ month, hours }]`.
- **Leerzustand:** „Noch keine Arbeitszeiten – erfasse sie unter Personen.“ und ein Link dorthin.
- **Aufräumen:**
  - Die tote `WorktimeComponent` und der leere Platzhalter `<!-- Person filter -->` entfallen.
  - Ebenso der tote Routen-Provider `working-entry/:entry-id` in `person-details.routes.ts`.
- **Kein Stand vom vorigen Zeitraum (AC39):** Bei einem Zeitraum- oder Personenwechsel leert der Context-Service die alten Werte sofort, und die Seite zeigt den Ladezustand.
- **Export (AC21):**
  - Eine Kopfaktion „Exportieren“ auf der Stunden-Statistik teilt bzw. lädt den bestehenden Personen-Export (`GET api/person/export`), mit derselben Teilen-Logik wie §6.4.
  - Unter Mehr → Export bleibt er ebenfalls.

## 6. Einstellungen, Verbindungen, Export, Benutzerdaten (AC25–AC31), Mockup 03

### 6.1 Kategorien (AC25, AC27, AC28)

- **Farbe (AC25):**
  - Ein Raster von 18 Farbpunkten zum Antippen, aus der Palette in Mockup 03 A.
  - Neue Farben werden als Hex gespeichert. Die Werte legt der Umsetzende fest; sie müssen auf `--bg` und im Ring bzw. in den Punkten unterscheidbar sein.
  - Eine bestehende Farbe, die nicht im Raster ist (CSS-Name wie „lemonchiffon“), bleibt gültig. Sie erscheint als zusätzlicher, gestrichelt umrandeter Punkt vorne, mit dem Hinweis „bisherige Farbe …“.
  - Alle Anzeigen von Kategoriefarben funktionieren weiter mit Namen und Hex.
  - Die Warnung „ngModel mit formControl“ entfällt mit dem Raster.
- **Standardkategorie (AC27):**
  - Löschen ist deaktiviert. Darunter steht: „Die Standardkategorie kann nicht gelöscht werden. Rechnungen gelöschter Kategorien landen hier.“
  - **Backend:** Löschen der Standardkategorie liefert 400.
  - **Backend:** `UpdateBillsForDeletedCategoryAsync` sucht die Standardkategorie des Benutzers so, dass nie die gerade gelöschte zurückkommt. Das behebt den Fehler aus den US-0007-Notizen.
- **Rechnungen fremder Benutzer in einer gelöschten Kategorie [Entscheidung, Builder-Check]:**
  - Ein verbundener Benutzer kann eine Rechnung bearbeiten und ihr dabei eine seiner Kategorien geben. Heute löscht `OnDelete(Cascade)` solche Rechnungen still, wenn diese Kategorie gelöscht wird.
  - Künftig gilt: Wird eine Kategorie gelöscht, egal ob einzeln oder mit „Benutzerdaten löschen“, wandern **alle** Rechnungen darin in die Standardkategorie ihres jeweiligen Besitzers. Ihre Unterkategorie wird geleert.
  - Die Beziehung `Bill→Category` (und `Bill→SubCategory`, falls ebenfalls Cascade) wird auf `Restrict` umgestellt. Dafür braucht es eine Migration ohne Datenänderung. So kann keine Rechnung mehr über eine Kategorie gelöscht werden.
  - Der Validator beim Bearbeiten bleibt wie er ist: Der Bearbeitende wählt aus seinen eigenen Kategorien.
  - Die Besitzprüfung aus den US-0007-Notizen, also beim Anlegen und Ändern einer Rechnung keine Kategorie eines nicht verbundenen Benutzers, prüft der Umsetzende und ergänzt sie, wo sie fehlt.
- **Nach dem Speichern (AC28):**
  - Die Komponente übernimmt den gespeicherten Stand als neuen Ausgangspunkt. „Abbrechen“ setzt also auf ihn zurück.
  - Neue Unterkategorien bekommen ihre Server-ID, ein zweites Speichern legt keine Duplikate an.
  - Ein Test prüft „Speichern, neue Unterkategorie, nochmal Speichern“.

### 6.2 Verbindungen (AC29), Mockup 03 B

- **Annehmen und Ablehnen:** Der Button zeigt einen Spinner, beide Buttons der Zeile sind gesperrt. Danach kommt eine Snackbar („Verbindung mit … hergestellt“ bzw. „Anfrage abgelehnt“). Bei einem Fehler kommt eine Fehler-Snackbar, und die Zeile bleibt.
- **Anfrage senden:** Snackbar „Anfrage an … gesendet“. Fehler wie „Benutzer nicht gefunden“ zeigt der Dialog selbst an.
- **Trennen und Zurückziehen:**
  - Rückfrage, z. B. „Verbindung mit … trennen? Ihr seht danach die Rechnungen, den Haushalt und die Stunden des anderen nicht mehr.“
  - Danach eine Snackbar, und Rechnungen und Haushalt laden neu.
- **Backend (Collaboration) [Technik]:**
  - `DELETE api/connection/{userId}` trennt die Verbindung. Es entfernt beide Richtungen und die angenommenen Anfragen zwischen den beiden, damit eine neue Anfrage möglich ist.
  - `DELETE api/connection/request/{targetUserId}` zieht eine eigene, offene Anfrage zurück.
  - Ob eine Verbindung heute als zwei Zeilen gespeichert ist, prüft der Umsetzende im Accept-Handler.

### 6.3 Export (AC30), Mockup 03 C

- **Ausgaben:**
  - Zeitraum per Schnellwahl („Dieser Monat“, „Dieses Jahr“, „Letztes Jahr“, „Alles“) oder Von/Bis. Standard ist „Dieses Jahr“.
  - Kategorien als Mehrfachauswahl, Standard „Alle Kategorien“.
  - **Backend:** `CategoryFilter` wird in `ExportExpensesRequest` und im Handler aktiviert. Leer bedeutet alle.
- **Kategoriefilter nach Name [Entscheidung, Builder-Check]:** Der Export enthält auch Rechnungen verbundener Benutzer. Liste und Statistik filtern nach Kategorie-**Name**, und der Export macht es genauso: `CategoryFilter` ist eine Liste von Namen. Die Auswahl zeigt die Namen der eigenen Kategorien.
- **Stunden:** wie bisher ohne Filter.
- **Teilen [Technik]:**
  - Wo `navigator.canShare({ files })` true liefert, öffnet `navigator.share({ files: [file] })` das Teilen-Menü.
  - Sonst wird die Datei wie heute heruntergeladen.
  - Bricht der Nutzer das Teilen ab (`AbortError`), ist das kein Fehler.
  - Den Button beschriftet „teilen“ oder „herunterladen“, je nach Fähigkeit.
- **Fehler:** Fehler-Snackbar statt verschluckter Fehler.

### 6.4 Benutzerdaten löschen (AC31), Mockup 03 D

- **[Nutzer]** Gelöscht werden nur die Daten in der App. Das Login-Konto in Azure B2C bleibt bestehen. Beim nächsten Login ist man ein leerer Benutzer, die Standardkategorien entstehen neu.
- **Ablauf:**
  - Button „Alle Benutzerdaten löschen“.
  - Erste Rückfrage mit der Aufzählung, was gelöscht wird.
  - Zweite Rückfrage mit Eingabe von „LÖSCHEN“. Erst dann ist „Endgültig löschen“ aktiv.
  - Während des Löschens zeigt die Seite einen Ladezustand.
  - Danach meldet `authService.logout()` den Benutzer ab.
- **Backend [Technik]:** Jeder Service bekommt einen Endpoint, der alle Daten des angemeldeten Benutzers löscht. Die Endpoints sind idempotent, ein zweiter Aufruf liefert ebenfalls 204.
  - Shopping:
    - Rechnungen mit Positionen und Fotos, inklusive Blobs im Container „images“;
    - analysierte Rechnungen und deren Blobs im Container „analysis“, inklusive noch nicht verarbeiteter Uploads mit dieser `userId` in den Metadaten;
    - Kategorien mit Unterkategorien, Vorlagen und ausgeblendete Vorschläge.
  - BudgetPlan: Fixkosten, Einkommen, Einstellungen.
    - **[Entscheidung, Builder-Check]** „Alle Daten“ schließt die Historie der Temporal Tables ein. Für die Zeilen des Benutzers in den History-Tabellen von `FixedCost` und `Income` braucht es rohes SQL: Versionierung kurz aus, löschen, wieder ein, in einer Transaktion.
    - Dieser Teil wird gegen SQL Server bzw. LocalDB getestet, und der Test wird übersprungen, wenn keine Datenbank verfügbar ist, wie die Azurite-Tests in Shopping. Der Rest läuft wie üblich mit SQLite.
  - Work: Personen mit Arbeitszeiten und Zahlungen.
  - Collaboration: Verbindungen und Anfragen in beide Richtungen.
  - Routen eindeutig im Monolith, z. B. `DELETE api/bill/user-data`, `api/budgetplan/user-data`, `api/person/user-data`, `api/connection/user-data`.
  - Daten verbundener Benutzer bleiben unberührt. Ihre Rechnungen in Kategorien des Löschenden wandern in ihre eigene Standardkategorie, siehe §6.1.
- **Frontend:**
  - Ruft die vier Endpoints nacheinander auf, Collaboration zuletzt.
  - Schlägt einer fehl, kommt die Meldung „Löschen nicht vollständig. Bitte erneut versuchen.“, und der Benutzer bleibt angemeldet. Ein erneuter Versuch ist gefahrlos, weil die Endpoints idempotent sind.

## 7. Tests und Prüfung (AC40, AC41)

- **Backend:** xUnit mit SQLite wie in Shopping und Work. Tests decken ab:
  - Summe und Monatssummen der Suche, Monats-Endpoint der Ausgaben;
  - Lebenserhaltungs-Anteil (Standard, Ändern, pro Benutzer);
  - `personFilter` und Monats-Endpoint der Stunden;
  - Zahlung ändern und löschen samt Besitzprüfung;
  - Plausibilität der Arbeitszeit;
  - Verbindung trennen und zurückziehen;
  - Export-Filter;
  - Löschen der Standardkategorie (400) und die Neuzuordnung der Rechnungen;
  - Benutzerdaten löschen je Service, inklusive „Daten anderer Benutzer bleiben“ und Idempotenz.
- **Neue Testprojekte:** BudgetPlan und Collaboration haben noch keins und bekommen je eins nach dem Muster von Shopping, eingetragen in `Andaha.sln`. Die Temporal-Table-Konfiguration verträgt sich eventuell nicht mit SQLite `EnsureCreated`. Der Umsetzende löst das im Testprojekt, nicht im Produktivcode.
- **Frontend:** Vitest. Tests decken ab:
  - Monatsgruppierung;
  - Datum und Zeitzone (§5.3);
  - Zahlungsvorbelegung und Format-Validator;
  - Plausibilität;
  - Monatswert der Fixkosten;
  - Vergleich in %;
  - Interceptor-Regeln, inklusive Token;
  - Request-Zahl des Haushaltsplans;
  - Teilen bzw. Download;
  - Zeilen-Wisch-Logik als reine Funktion, wie `swipe.ts`.
- **UI-Prüfung (AC41):** Playwright bei 390 und 1440 px über alle Bereiche, gegen die Mockups dieses Ordners.

## 8. Restpunkte aus US-0006 und US-0007 (Technical Notes der Story)

**[Entscheidung]** Diese Punkte wurden bewusst nach US-0008 verschoben und gehören zum Umfang:

1. **Zeitauswahl auf Deutsch:** Die Buttons heißen „Abbrechen“ und „OK“, über die Konfiguration von `ngx-mat-timepicker`. Wenn die Bibliothek das nicht kann: festhalten und lassen.
2. **Farben als Tokens:** Fest kodierte M2-Farben in `styles.scss` werden Tokens in `_andaha-tokens.scss`.
3. **Testlaufzeit:** `testTimeout` anheben, damit zeitabhängige Specs unter Last nicht scheitern.
4. **Doppelte Standardkategorien beim ersten Login [Entscheidung, Builder-Check]:**
   - Ursache sind zwei gleichzeitige `GET api/billcategory` beim Start. Das Frontend lädt die Kategorien künftig nur einmal.
   - Das Backend legt die Standardkategorien idempotent an: In einer Transaktion wird geprüft, ob der Benutzer schon Kategorien hat, erst dann wird angelegt.
   - Es gibt **keinen** eindeutigen Index, weil bestehende Datenbanken schon Doppelte enthalten können (test2) und die Migration dann scheitern würde.
   - Bestehende Doppelte werden nicht automatisch bereinigt.
5. **Rechnungsdatum zwischen 23:00 und 24:00:**
   - Das Datum einer Rechnung ist immer der lokale Kalendertag, den der Benutzer gewählt hat. Die Umwandlung in `shared/utils/utils.ts` (`moment(...).utc(true)`) wird so korrigiert, dass der Tag erhalten bleibt.
   - Der Umsetzende prüft auch, was das Backend mit der Uhrzeit macht.
   - Ein Test deckt 23:30 Ortszeit ab.
   - **[Umsetzung, Task 18]** `Bill.Date` ist eine SQL-Spalte `date`: gespeichert war und bleibt der lokale Kalendertag (Bestandsdaten stimmen ohne Migration, Tagesfilter und Monatsgruppen rechnen in Ortszeit). Der Fehler lag beim Parsen und Lesen: `DateTime.Parse` verschob ein „…T23:30:00Z“ auf einem Server außerhalb von UTC in den Folgetag, und `new Date(…)` las die als UTC markierte Mitternacht als Zeitpunkt. Jetzt sendet `getRecordOfProperties` die Ortszeit ohne Zone, `BillFormDate.Parse` übernimmt sie unverändert (auch mit „Z“ älterer App-Stände), und `parseLocalDateTime` liest Rechnungsdaten als Ortszeit (`BillDto`, `ShopStatDto`, `BillAnalyzedDto`, Zeitraum der Ausgaben). Die Uhrzeit im Duplikat-Hinweis kommt aus `CreatedAt` (echter UTC-Zeitpunkt, in Ortszeit angezeigt).
6. **Fehlertexte in Formularen:** Das große Rechnungsformular und das Vorlagenformular zeigen bei ungültigen Feldern einen Text am Feld (`mat-error`), z. B. „Pflichtfeld“ oder „Betrag größer 0“.
7. **Schnellerfassung:**
   - Der Duplikat-Hinweis zeigt die Uhrzeit des vorhandenen Eintrags, wenn sie bekannt ist.
   - Nach „Andere …“ bleibt das Tastenfeld offen bzw. der Fokus im Betrag.
8. **Desktop:** Der Zurück-Pfeil auf `/settings/*` bei 1440 px entfällt, wie in Design v2 (04).
9. **Ausgeblendete Vorschläge:**
   - Unter Mehr → Vorlagen steht ein Abschnitt „Ausgeblendet“ mit „Wieder anzeigen“.
   - **Backend:** `GET` und `DELETE api/bill-template/hidden-suggestions/{id}`.
10. **Zurück nach Neuladen:**
    - `tryLogin()` von angular-oauth2-oidc darf den History-Zustand nur leeren, wenn die URL einen Login-Code enthält, z. B. per `preventClearHashAfterLogin`, wenn kein `code` vorhanden ist. Context7 für die Option nutzen.
    - Ein Test bzw. die UI-Prüfung bestätigt: Login und Logout funktionieren unverändert, und nach Neuladen von `/bill/create` führt Speichern und dann Zurück nicht doppelt zur Liste.
    - Die Korrektur in US-0007 design.md §9 entsprechend nachziehen.

## 9. Dem Umsetzenden überlassen

- Genaue Form der neuen DTOs und Routen, solange sie den Mustern der Services folgen (MediatR, Validator, Besitzprüfung).
- Monatsköpfe gegenüber virtuellem Scrollen.
- Schwellen der Gesten.
- Hex-Werte der Farbpalette.
- Name und Schnittstelle von `app-load-state`.
- Liste der Lösch-Aktionen und der Aufrufer mit eigener Fehlermeldung (§2.2, §2.3), samt Nachweis im Bericht.
- Reihenfolge der Tasks im Plan.

## 10. Entscheidungen zur Prüfung durch den Nutzer

- ~~Zeilen-Wischen gewinnt auf den Rechnungszeilen.~~ Ersetzt [Nutzer, 2026-11-05]: kein Zeilen-Wischen, Duplizieren/Löschen per langem Druck auf die Zeile; das Tab-Wischen greift auf der ganzen Liste (§3.1).
- Ring-Diagramm und Kategorie-Ausblenden in der Statistik entfallen zugunsten von Balken und Zeilen.
- Datumsvergleich nur für Monat und Jahr.
- Offener Betrag mit dem aktuellen Stundensatz.
- „Letzten Eintrag übernehmen“ nur bei genau einer gewählten Person.
- Monatsweises Laden der Arbeitszeiten in Dreierschritten.
- Restpunkte aus §8 vollständig im Umfang, inklusive der Login-Änderung (§8.10).
- Aus dem Builder-Check:
  - Rechnungen in fremden Kategorien wandern beim Löschen in die Standardkategorie ihres Besitzers. `Bill→Category` wird `Restrict`, mit Migration (§6.1).
  - „Benutzerdaten löschen“ löscht auch die Historie von Fixkosten und Einkommen (§6.4).
  - Keine eindeutige DB-Regel gegen doppelte Standardkategorien, nur idempotentes Anlegen und einmaliges Laden (§8.4).
  - Der Export filtert Kategorien nach Name (§6.3).
  - Text des Offline-Banners: „Keine Verbindung – neue Rechnungen werden später übertragen.“ (§2.2)
