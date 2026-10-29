# Umsetzungsplan Redesign MiniClient (helles Theme)

App: `src/WebApps/Miniclient/Andaha.WebApps.MiniClient` (Angular 14, Angular Material 14, ng2-charts 4 / Chart.js 3).
Alle Pfade unten relativ zu `src/WebApps/Miniclient/Andaha.WebApps.MiniClient/src/`.

## Leitplanken

1. **Funktionalität bleibt unverändert.** Gleiche Routen, gleiche Seiten, gleiche Formularfelder, Validierungen, Services, API-Aufrufe und Texte. Nur Templates (Struktur/Markup) und Styles ändern sich.
2. **Referenz ist das Mockup**, nicht die Fantasie: `docs/design/mockups/*.html` (Markup + CSS zum Abschauen) und `docs/design/screenshots/*.png` (Soll-Bild). Werte aus `docs/design/DESIGN.md` bzw. `docs/design/tokens/`.
3. **Mobile first.** Jede Seite zuerst bei 390 × 844 fertig, dann ab 1024 px Desktop.
4. **Schrittweise und überprüfbar.** Nach jeder Phase: `npm run build` grün, App starten, Seite bei 390 px und 1440 px ansehen und mit dem Screenshot vergleichen.

### Bewusste UI-Änderungen (vom Nutzer abgenommen)

| Bisher | Neu | Hinweis |
|---|---|---|
| Dunkles Material-Theme, Pink | Helles Theme „Tinte & Kupfer“ | DESIGN.md |
| Roboto, Material Icons (gefüllt) | Hanken Grotesk, Material Symbols Outlined (wght 300) | Phase 1 |
| Kopfzeile zeigt „Andaha“ | Kopfzeile zeigt den Seitentitel; „Andaha“ im Drawer/in der Sidebar | Titel über Route-`data` |
| Benutzername in der Kopfzeile (Mobile) | Benutzername im Drawer-Kopf; Desktop weiterhin oben rechts | Ausloggen bleibt im Konto-Menü |
| Vollbild-Dialoge auf Mobile | Bottom Sheets (gleiche `MatDialog`-Komponenten, nur Konfiguration/Styles) | `getDialogBaseConfig` |
| Gestapelte Vollbreiten-Buttons (`floating-button`) | Aktionsleiste über der Bereichsnavigation | `Bearbeiten | Löschen`, `Abbrechen | Speichern` |
| `mat-card` je Listeneintrag, farbige Kategorie-Chips | Listenzeilen mit Haarlinie, Kategorie als Farbpunkt | |
| Datumstyp als Select | Segment `Monat | Jahr | Gesamt | Von – Bis` | `Von – Bis` = `DateType.Custom` |
| Tortendiagramm mit Chart-Legende | Ringdiagramm + eigene Legende als Liste | Tipp auf Legendenzeile = gleicher Detail-Dialog wie Klick ins Diagramm |
| Rechnungsdetails als deaktiviertes Formular | Lesemodus als Kopf (Shop, Betrag, Datum) + Wertezeilen; „Bearbeiten“ zeigt das Formular | gleiche `isEditing`-Logik |
| Personenliste mit orangem Warn-Icon | Tag „Zahlung offen“ | gleiche Bedingung `isPaymentRequired` |
| Fortschrittsbalken beim Speichern | Spinner im Speichern-Button, Text „Speichert …“ | Laden von Listen behält den Balken |
| Zurück-Pfeil fehlt bei analysierter Rechnung | Zurück-Pfeil in der Kopfzeile | einzige neue Navigation |

## Screen-Zuordnung

| Mockup (Datei · Screen) | Angular-Komponenten |
|---|---|
| 01 · Liste | `app/app.component.*` (Kopf), `features/bill/bill.component.*` (Bereichsnav), `features/bill/modules/bill-list/bill-list.component.*`, `.../bill-list-filter/bill-list-filter.component.*`, `.../bill-list-item/bill-list-item.component.*` |
| 01 · Datumfilter | `.../bill-list-filter/bill-list-filter-dialog/*` + `shared/dialog/*` |
| 01 · Hinzufügen | `features/bill/modules/add-bill/*`, `features/bill/modules/bill-image/*` |
| 01 · Details | `features/bill/modules/bill-details/*`, `bill-image`, `bill-image-dialog` |
| 02 · Statistik | `features/bill/modules/expenses/expenses.component.*`, `.../timerange-selection/*`, `.../chart/*` |
| 02 · Kategorie-Details | `features/bill/modules/expenses/chart-details-dialog/*` |
| 02 · Navigation | `app/app.component.*` (Drawer) |
| 03 · Analysiert / Hochladen / Details | `features/bill-analysis/**` (`analyzed-bill-list`, `analyzed-bill-list-item`, `add-bill-for-analysis`, `analyzed-bill-details`, `analyzed-bill-image`) |
| 04 · Haushaltsplan | `features/budgetplan/modules/overview/*`, `features/budgetplan/budgetplan.component.*` |
| 04 · Fixkosten / Bearbeiten | `features/budgetplan/modules/fixed-cost/**` (`fixed-cost`, `fixed-cost-list`, `fixed-cost-details`, `create-fixed-cost`, `fixed-cost-history-dialog`) |
| 04 · Einkommen | `features/budgetplan/modules/income/**` (analog Fixkosten) |
| 05 · Personen / Person / Arbeitszeiten / Zahlung | `features/work/modules/person/**` (`person`, `person-list`, `person-details`, `add-working-entry`, `work-entry-list`, `person-payment-dialog`, `work-entry-details`, `add-person`) |
| 05 · Statistik | `features/work/modules/statistics/*` (nutzt `timerange-selection`) |
| 06 · Verbindungen | `features/settings/modules/connection/**` |
| 06 · Kategorien / Kategorie bearbeiten | `features/settings/modules/categories/**` |
| 06 · Export | `features/export/*` |
| 07 · Desktop | `app/app.component.*` + Bereichs-Komponenten (Tabs statt Bottom-Nav) |

Ohne eigenes Mockup, nach denselben Mustern gestalten: `add-person`, `create-income`, `income-details`, `income-history-dialog`, `fixed-cost-history-dialog`, `work-entry-details-dialog`, `create-category`, `add-connection-dialog`, `confirmation-dialog`, `add-bill-image-dialog`, `bill-image-dialog`, `analyzed-bill-image-dialog`, Snackbars, `features/data-protection/**` (Textseiten: body 15/1.5, max. 70 Zeichen Zeilenlänge).

---

## Phase 1 – Fundament (Theme, Schrift, Icons, globale Styles)

1. **Schriften** in `index.html`: Roboto- und Material-Icons-Link ersetzen durch
   - `https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap`
   - `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..24,300,0,0`
   - `<meta name="theme-color" content="#F8F4EC">`; `lang="de"`.
2. **Icons:** in `AppModule` (oder `AppComponent`-Konstruktor) `MatIconRegistry.setDefaultFontSetClass('material-symbols-outlined')`. Icon-Namen in Templates bleiben `mat-icon`-Ligaturen; Zuordnung siehe Tabelle unten.
3. **Theme:** `docs/design/tokens/_andaha-tokens.scss` und `andaha-theme.scss` nach `themes/` kopieren, `themes/custom-theme.scss` dadurch ersetzen.
4. **`angular.json`:** In `build` und `test` den Eintrag `./node_modules/@angular/material/prebuilt-themes/purple-green.css` entfernen. Das Theme genau einmal einbinden (aktuell wird `custom-theme.scss` sowohl in `angular.json` als auch per `@import` in `styles.scss` geladen).
5. **`styles.scss` neu aufbauen:**
   - `html, body { background: var(--bg); color: var(--fg); font-family: $andaha-font; font-variant-numeric: tabular-nums; }`, `::selection` in Primär.
   - Globale Muster als Klassen (aus den Mockups übernehmen): `.row`, `.date`, `.amt`, `.dot`, `.sec` (Abschnittskopf), `.kv`/`.k`/`.v`, `.actions`, `.btn` + `.pri`/`.sec2`/`.del`, `.tag`, `.empty`, `.big`.
   - Material-Overrides: `mat-form-field` (siehe Phase 3), `mat-chip`, `mat-progress-bar` (Farbe Primär, 3 px), `mat-snack-bar` (info: `fg` auf `surface` mit Linie; Fehler: `negative-bg` / `negative`), `mat-menu` (Popover-Schatten), Datepicker (Primär für Auswahl).
   - Entfernen: `.button-style` (Radius 0, 50 px), `.dark-bg-color`, `.primary-bg-color` usw., sobald nicht mehr benutzt.
6. **`manifest.webmanifest`:** `theme_color` und `background_color` → `#F8F4EC`.

**Fertig, wenn:** Build grün, App hell, Schrift Hanken Grotesk, Icons dünn, keine Pink-Reste.

### Icon-Zuordnung (Material Symbols Outlined)

| Zweck | Name |
|---|---|
| Menü / Zurück / Schließen | `menu` / `arrow_back` / `close` |
| Sync aktiv / Konto / Ausloggen | `sync` / `account_circle` / `logout` |
| Suche / Datumfilter | `search` / `filter_list` |
| Rechnungen (Drawer) / Liste (Bereichsnav) | `receipt_long` / `list` |
| Hinzufügen / Statistik | `add_circle` (Nav), `add` (Button) / `donut_small` |
| Analyse / Hochladen | `document_scanner` / `upload` bzw. `cloud_upload` |
| Haushaltsplan / Fixkosten / Einkommen | `account_balance_wallet` / `north_east` / `south_west` |
| Stunden / Arbeitszeit / Zahlung | `group` / `schedule` / `payments` |
| Einstellungen / Verbindungen / Kategorien | `settings` / `link` / `category` |
| Export | `download` |
| Bearbeiten / Löschen / Speichern | `edit` / `delete` / `check` |
| Foto / Beleg / Verlauf | `photo_camera` / `receipt_long` / `history` |
| Select / Weiter / Datum | `expand_more` / `chevron_right` / `calendar_today` |
| Ziehen / Reihenfolge | `drag_indicator` / `swap_vert` |
| Annehmen / Ablehnen | `check` / `close` |

---

## Phase 2 – Shell (Kopfzeile, Drawer, Sidebar, Bereichsnavigation)

1. **Seitentitel:** In den Feature-Routing-Modulen `data: { title: '…' }` ergänzen (Rechnungen, Rechnung hinzufügen, Rechnung, Statistik, Analyse, Rechnung hochladen, Analysierte Rechnung, Haushaltsplan, Fixkosten, Einkommen, Stundenaufzeichnungen, Statistik, Verbindungen, Kategorien, Export, AGB, Datenschutzerklärung, Benutzerdaten). Detailseiten mit Namen (Miete, Maria Novak, Lebensmittel) dürfen den Namen aus der Komponente setzen. `AppComponent` liest den Titel aus dem Router (`ActivatedRoute`-Kette, `NavigationEnd`).
2. **`app.component.html/.scss`:**
   - Kopf 56 px, Hintergrund `bg`, Linie unten. Links Menü-Button (Mobile) bzw. Zurück-Pfeil, wenn die Seite einen hat (bestehende Zurück-Buttons der Detailseiten wandern in die Kopfzeile, gleiche `routerLink`s). Titel 18/600. Rechts Sync-Icon (`syncActive`), Konto-Button mit `mat-menu` → „Ausloggen“.
   - Desktop: zusätzlich Benutzername links vom Konto-Button.
   - `mat-sidenav`: Mobile `mode="over"`, ab 1024 px `mode="side" opened` (`BreakpointObserver`). Inhalt nach Mockup 02 · Navigation bzw. 07: „Andaha“, Benutzername + Sync (nur Drawer), 6 Einträge mit `routerLinkActive`, Rechtliches unten. `(click)="sidenav.toggle()"` nur im Modus `over`.
   - „Warten auf Login…“ zentriert, 15 `muted`.
3. **Bereichsnavigation** (`bill`, `bill-analysis`, `budgetplan`, `work`, `settings` → je `*.component.html/.scss`): gleiche Links, neues Markup als `<nav>` mit `<a routerLinkActive>` (Icon + Label), aktiv nach DESIGN.md. Gemeinsames SCSS in `styles.scss` (z. B. `.bottom-nav`), damit die fünf Dateien nur noch Markup enthalten. Ab 1024 px als Tabs unter dem Titel (`position: static`, horizontale Leiste, Unterstrich).
4. **Platzhalter-Divs** (`toolbar-placeholder`, `bottom-navigation-placeholder`, `button-placeholder`, `progressbar-placeholder`) durch ein Flex-Layout ersetzen: Shell `display:flex; flex-direction:column; height:100dvh`, Inhalt `flex:1; overflow:auto`, Aktionsleiste und Navigation `flex:none`.

**Fertig, wenn:** Alle Routen erreichbar wie vorher, Titel stimmt, Drawer (Mobile) und Sidebar (Desktop) wie Mockup, Ausloggen funktioniert.

---

## Phase 3 – Gemeinsame Bausteine

1. **Formularfelder:** `mat-form-field` mit `appearance="outline"` und `floatLabel="always"`, per CSS so gestylt, dass das Label über dem Feld steht (13/500 `muted`), Feld 48 px, `surface`, Rahmen `line-field`, Radius 10, Fokus Primär + Ring. Gilt auch für `shared/date-picker/date-picker-form-field` und `time-picker-form-field`. `mat-hint`/`mat-error` 12 px. Textarea 76 px. Variante B, falls `outline` sich nicht sauber anpassen lässt: eigenes `<label>` über `mat-form-field` ohne `mat-label`; Validierung bleibt unverändert.
2. **Dialoge → Bottom Sheet:** `shared/dialog/dialog-functions.ts` liefert unter 600 px `panelClass: 'andaha-sheet'`, `position: { bottom: '0' }`, `width: '100%'`, `maxWidth: '100vw'` statt Vollbild. `shared/dialog/dialog.component.html`: Griff + Kopf mit Titel-Slot und Schließen-Button. Styles `.andaha-sheet` (Radius 20 oben, `surface`, Schatten, max. Höhe 90dvh, scrollt). Ab 600 px zentrierter Dialog, max. 480 px. Bisherige `mat-dialog-actions`-Fixierung (`.fullscreen-dialog`) entfernen; Primär-Button steht am Sheet-Ende. Gilt für alle Dialoge, auch `confirmation-dialog`.
3. **Aktionsleiste:** Muster `.actions` (Flex, Gap 10, Padding 12×16, Linie oben, `bg`). Ersetzt alle `floating-button`/`bottom-button`-Blöcke. Deaktiviert-Logik unverändert übernehmen (`[disabled]="…"`).
4. **Buttons:** `mat-flat-button color="primary"` (Primär), `mat-stroked-button` mit Klasse `sec2` bzw. `del`; Höhe 52, Radius 12, 16/600. Speichern-Zustand: `*ngIf="isSaving"` → `mat-spinner diameter="18"` + „Speichert …“ (Angular 14, keine `@if`-Syntax).
5. **Listenzeilen:** Muster `.row` aus den Mockups; ersetzt `mat-card`-Listeneinträge und `mat-divider`. Bei der virtuellen Liste (`cdk-virtual-scroll-viewport`) `pixelHeightPerItem` an die neue Zeilenhöhe anpassen (`box-sizing: border-box`, Linie inklusive: Rechnungen 64 px, Analyse 60 px) und prüfen.
6. **Chips:** Kategoriefilter weiter `mat-chip-list`, gestylt nach DESIGN.md (Häkchen bei `selected`). Datums-Chips mit Entfernen-Button, gleiche Handler.
7. **Segment:** `MatButtonToggleModule` importieren; `timerange-selection` bekommt `mat-button-toggle-group` an `form.controls.dateType`, gleiche `dateTypeSelectionChanged()`-Logik. Anzeigetexte: Monat, Jahr, Gesamt, „Von – Bis“ (eigene Label-Map fürs Segment, `DateTypeLabelMapping` bleibt). Monat/Jahr bleiben `mat-select`, Von/Bis bleiben Datepicker.

---

## Phase 4 – Seiten

Pro Seite: Template nach Mockup umbauen, Komponenten-SCSS leeren bzw. auf das Nötige reduzieren, Logik nicht anfassen.

**Rechnungen (Mockup 01, 02)**
- `bill-list`: Filterbereich nicht mehr `position: fixed` mit `dark-bg-color`, sondern im Flex-Fluss (Suche + Datumfilter-Button mit Punkt, wenn ein Datum gesetzt ist; Chip-Zeile; Datums-Chips). Leerzustand „Keine Rechnungen verfügbar.“
- `bill-list-item`: Datumsspalte (Tag, Monat kurz deutsch via `DatePipe` `'dd'`/`'MMM'` mit Locale `de`), Shop, Metazeile mit Farbpunkt `bill.category.color`, Unterkategorie, Icons `receipt_long` (fromAnalysis) / `link` (isExternal) in `muted` statt Limettengrün; Betrag formatiert `1.234,56` + kleines €. Für Komma-Format `registerLocaleData(localeDe)` und `| number:'1.2-2':'de'` (nur Anzeige).
- `add-bill`: Foto-Zeile (bestehende `app-bill-image` mit `onlyUpload`) als gestrichelte Zeile „Foto der Rechnung · Optional“, Felder in bisheriger Reihenfolge, Speichern in der Aktionsleiste.
- `bill-details`: Lesemodus = Kopf (Shop 26/600, Betrag `amount`, Datum) + Rechnungsfoto-Zeile (öffnet wie bisher `bill-image-dialog`) + Wertezeilen Kategorie (mit Punkt), Unterkategorie, Notizen. Bearbeiten = Formular wie `add-bill`. Aktionen `Bearbeiten | Löschen` bzw. `Abbrechen | Speichern`.
- `expenses`: Segment + Monat/Jahr/Von-Bis-Felder, Ring (`type: 'doughnut'`, `cutout: '78%'`, `borderWidth: 3`, `borderColor` = `bg`, `plugins.legend.display: false`), Summe absolut zentriert über dem Canvas, darunter Legende als Buttons → gleicher Handler wie `chartClicked` (Kategorie-Details öffnen). Leerzustand „Keine Daten vorhanden.“
- `chart-details-dialog`: Sheet mit Punkt + Kategoriename als Titel, „Ausgaben für … “ + `amount`, Wertezeilen der Unterkategorien; Leertext bleibt.

**Analyse (Mockup 03)**
- `analyzed-bill-list(-item)`: Zeile wie Rechnungen ohne Metazeile.
- `add-bill-for-analysis`: großes `<label>` als Upload-Fläche (`well`, gestrichelt), darin das bestehende `<input type="file" accept="image/*" capture="environment">` (visuell versteckt, nicht entfernt); nach Auswahl Dateiname + Vorschau. „Hochladen“ in der Aktionsleiste, `[disabled]` unverändert; Upload-Fortschritt als Spinner im Button.
- `analyzed-bill-details`: Kopf + Wertezeilen (Kategorie, Unterkategorie, Analyse-Konfidenz mit kleinem Balken in `positive`, Notizen), Bild darunter in `well`. Desktop: Bild rechts (bestehendes `.left/.right`-Layout).

**Haushaltsplan (Mockup 04)**
- `overview`: „Monatlicher Überschuss“ + `amount` in `positive` (negativ: `negative`, mit Vorzeichen), geteilter Balken (Ausgaben `negative-bar`, Überschuss `positive`, 10 px, 3 px Lücke) mit Prozent-Beschriftung; darunter Abschnitte „Einnahmen“ (Einkommen) und „Ausgaben“ (Lebenserhaltungskosten + `budgetPlan.expenses`) als Wertezeilen. `mat-progress-bar` entfällt hier.
- `fixed-cost` / `fixed-cost-list` / `income-list`: Abschnittskopf je Kategorie, Zeilen Name | Betrag + Intervall (12 `muted`) rechts, Leertext „Keine Ausgaben.“; „Hinzufügen“ in der Aktionsleiste.
- `fixed-cost-details`, `create-fixed-cost`, `income-details`, `create-income`: Formular; Verlauf-Button als Icon in der Kopfzeile (`history`), öffnet den bestehenden History-Dialog (als Sheet).

**Stundenaufzeichnungen (Mockup 05)**
- `person` / `person-list`: Zeilen Name | Tag „Zahlung offen“ (wenn `isPaymentRequired`) | Stunden. Aktionen untereinander: „Arbeitszeiten hinzufügen“ (Primär), „Person hinzufügen“ (Sekundär).
- `person-details`: Kennzahl-Zeile Gesamt | Bezahlt | Offen (Bezahlt/Offen nur bei Stundensatz > 0, wie bisher), Wertezeilen Stundensatz, Notizen (Lesemodus), Abschnitt „Arbeitszeiten“ mit `work-entry-list` als Zeilen (Datum | von – bis | Dauer, Notiz darunter). Aktionen `Zahlung | Bearbeiten | Löschen (Icon)`; im Bearbeiten-Modus `Abbrechen | Speichern`.
- `add-working-entry`: Personen-Multiselect, Datum, Start/Ende/Pause in einer 3er-Reihe, „Arbeitszeit netto“ als Wertezeile (22/600), Notizen, Speichern.
- `person-payment-dialog`: Sheet „Zahlung hinzufügen“, Betrag und Trinkgeld nebeneinander.
- `statistics`: Segment + Kennzahl-Blöcke (Label 14 `muted`, Wert 30/600; „noch nicht bezahlt“ in `secondary-text`).

**Einstellungen & Export (Mockup 06)**
- `connection` + Unterkomponenten: drei Abschnitte, Zeilen E-Mail | Status; eingehende Anfragen mit zwei 44-px-Buttons (Annehmen `positive-bg`/`positive`, Ablehnen `negative-bg`/`negative`, `aria-label`). „Verbindung herstellen“ als Sekundär-Button unter den aktiven Verbindungen.
- `categories`: Zeilen Musterfeld | Name | Chevron; im Modus „Reihenfolge anpassen“ Drag-Griff links (cdkDrag unverändert). Aktionen untereinander: „Hinzufügen“ (Primär), „Reihenfolge anpassen“ (Sekundär) bzw. `Abbrechen | Speichern`.
- `category-item-details`: Name, Farbe (Select mit Musterfeld), Checkbox „Aufnehmen in Statistik“, Abschnitt „Unterkategorien“ (Griff | Feld | Löschen-Icon), „Unterkategorie hinzufügen“ als Sekundär-Button; Aktionsleiste wie Mockup, Löschen außerhalb des Bearbeiten-Modus.
- `export`: Abschnittskopf „Exportieren“, zwei Zeilen-Buttons (Icon-Kachel, Text, rechts Download-Icon bzw. Spinner bei `isExporting`).

---

## Phase 5 – Prüfung

1. `npm run build` ohne Fehler, keine neuen Warnungen.
2. App starten (`npm start`, http://localhost:4200) und mit Playwright jede Route bei **390 × 844** und **1440 × 900** ansehen; mit `docs/design/screenshots/*.png` vergleichen.
3. **Regressions-Checkliste (Funktion):** Rechnung anlegen (mit/ohne Foto), bearbeiten, löschen; Suche, Kategorie- und Datumsfilter inkl. Entfernen; Statistik je Datumstyp, Kategorie-Details; Upload zur Analyse, Details; Fixkosten/Einkommen anlegen, bearbeiten, Verlauf, löschen; Person anlegen, Arbeitszeiten (mehrere Personen), Zahlung, Arbeitszeit-Details; Stunden-Statistik; Verbindung anfordern/annehmen/ablehnen; Kategorie anlegen, Farbe, Unterkategorien, Reihenfolge, löschen; beide Exporte; Ausloggen; Rechtstexte.
4. **Zugänglichkeit:** Fokus sichtbar (Tab durch jede Seite), Icon-Buttons mit `aria-label`, Touch-Ziele ≥ 44 px, Kontraste laut DESIGN.md nicht unterschreiten.
5. Optional: `/impeccable audit` bzw. `/impeccable polish` auf die geänderten Komponenten.

## Empfohlene Reihenfolge für Pull Requests

1. Phase 1 + 2 (Fundament + Shell) – danach sieht die App schon „hell“ aus, Seiten noch alt.
2. Phase 3 (Bausteine) + Rechnungen.
3. Analyse + Haushaltsplan.
4. Stundenaufzeichnungen.
5. Einstellungen, Export, Rechtstexte, restliche Dialoge.
