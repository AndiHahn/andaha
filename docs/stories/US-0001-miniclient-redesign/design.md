# Design: US-0001 Redesign MiniClient („Tinte & Kupfer“)

Story: [`story.md`](./story.md) · Designunterlagen: [`docs/design/`](../../design/) (README, DESIGN.md, umsetzung.md, Tokens, Mockups 01–07, Screenshots)

Stand: 2026-10-29 · Status: Entwurf zur Freigabe

## 1. Absicht

Der MiniClient (`src/WebApps/MiniClient/Andaha.WebApps.MiniClient`, Angular 14) bekommt eine neue, helle Oberfläche nach `docs/design/DESIGN.md`. **Oberste Priorität des Nutzers: Nach dem Redesign funktioniert alles genau wie vorher.** Das Aussehen ist das Ziel, Funktionstreue ist die harte Grenze. Bei jedem Zielkonflikt gewinnt die Funktion.

## 2. Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**
- Alle Screens entsprechen bei 390 × 844 und 1440 × 900 sichtbar den Screenshots in `docs/design/screenshots/` (Mockups 01–07). Screens ohne Mockup folgen denselben Mustern.
- Die bewussten UI-Änderungen aus `umsetzung.md` („Bewusste UI-Änderungen“) sind umgesetzt.
- Angular Material wird dort durch eigenes Markup und CSS ersetzt, wo es nur Optik liefert (siehe Abschnitt 4).

**Nicht-Ziele**
- Keine Backend- oder API-Änderungen, keine neuen Funktionen, keine Textänderungen über `umsetzung.md` hinaus.
- Kein Angular-Upgrade, kein dunkles Theme, kein Theme-Umschalter.
- Keine Umstellung auf eine andere Component Library.

**Anti-Ziele** (wäre ein Fehlschlag, auch wenn es „gut aussieht“)
- Eine Funktion geht verloren oder verhält sich anders: Validierung, Fehlermeldung, Speichern/Löschen, Filter, Nachladen der Rechnungsliste, Drag & Drop, Datums- und Zeitauswahl, Upload, Export, Ausloggen.
- Nachgebaute Widgets (Datepicker, Select, Dialog), die Tastatur, Fokus oder Screenreader schlechter bedienen als heute.
- Ein halb fertiger Zustand: Pro Phase muss die App lauffähig und vollständig bedienbar bleiben.

## 3. Ausgangslage (Recon 2026-10-29)

- Angular 14.2, Angular Material 14 (Legacy-Komponenten, kein MDC), CDK 14, `@angular/material-moment-adapter`, `ngx-mat-timepicker` 14, ng2-charts 4 / Chart.js 3, `angular-oauth2-oidc`.
- Material-Nutzung in Templates (ungefähr): 54 `mat-form-field`, 95 Buttons (`mat-raised-button`, `mat-icon-button`), 98 `mat-icon`, 16 `mat-select`, 7 Datepicker, 1 Timepicker, 11 `mat-card`, 15 `mat-divider`, 6 `mat-toolbar`, 5 `mat-chip`, 2 `mat-checkbox`, 2 `mat-radio`, 1 `mat-menu`, 1 `mat-sidenav`, 19 `mat-progress-bar`, 17 Spinner, 2 versteckte `mat-paginator`.
- Services: `MatDialog` (27 Stellen, Konfiguration über `shared/dialog/dialog-functions.ts#getDialogBaseConfig`), `MatSnackBar` (`shared/snackbar/*`), `DateAdapter`/`MAT_DATE_FORMATS`/`MAT_DATE_LOCALE` (Moment).
- CDK: `cdk-virtual-scroll-viewport` (Rechnungen, Analyse), `DragDropModule` (Kategorien, Unterkategorien).
- Die versteckten `mat-paginator` in `bill-list` und `analyzed-bill-list` steuern das seitenweise Nachladen. Sie sind Logik, keine Optik.
- Es gibt **keine Frontend-Unit-Tests** (`*.spec.ts`: 0).

## 4. Entscheidung: Angular Material teilweise behalten

Der Nutzer hat die Wahl der Bibliothek an mich übergeben und den folgenden Mittelweg am 2026-10-29 bestätigt. Begründung: Funktionstreue hat Vorrang. Den größten Gewinn bringt es, Optik-Komponenten zu ersetzen. Das größte Risiko liegt im Nachbau von Komponenten mit Verhalten.

| Bleibt Material (nur über Theme/Tokens/globale Overrides gestylt) | Wird ersetzt durch eigenes Markup + CSS |
|---|---|
| `MatDatepicker` (+ Moment-Adapter, Formate, Locale) | `mat-form-field`, `mat-label`, `mat-hint`, `mat-error`, `matInput` → Feld-Muster `.field` (Label oben, 48 px, Hinweis, Fehler) |
| `MatSelect` / `MatOption` / `mat-select-trigger` (inkl. `multiple`) | Buttons (`mat-raised-button`, `mat-flat-button`, `mat-icon-button`) → native `<button>` mit `.btn`, `.pri`, `.sec2`, `.del` und `.icon-btn` |
| `MatDialog` (wird auf Mobile zum Bottom Sheet) | `mat-card`, `mat-divider`, `mat-list`/`mat-nav-list`, `mat-grid-list` → Listenzeile `.row`, Abschnittskopf `.sec`, Wertezeile `.kv` |
| `MatSnackBar` | `mat-toolbar` → eigene Kopfzeile in `app.component` |
| `MatMenu` (Konto-Menü) | Filter-Chips (`mat-chip-list`) → `<button aria-pressed>` als Pill |
| `MatSidenav` (Drawer/Sidebar inkl. Fokusfalle, Scrim) | Datumstyp-Select → Segment aus nativen Radio-Inputs (`role=radiogroup`), gebunden an dasselbe `form.controls.dateType` |
| `MatCheckbox`, `MatRadio` | |
| `MatProgressBar`, `MatProgressSpinner` | |
| `MatIcon` (Font-Set auf Material Symbols Outlined umgestellt) | |
| `MatPaginator` (unsichtbar, Logik) | |
| `ngx-mat-timepicker` | |
| CDK: Virtual Scroll, Drag & Drop, `BreakpointObserver` | |

Verifiziert per Context7 (Angular Material v14-Doku): `matDatepicker` hängt an einem einfachen `<input [matDatepicker]>`, `mat-datepicker-toggle` ist ein eigenständiger Button, `mat-select` ist eine eigenständige Komponente mit `panelClass`, `ariaLabel` und `errorStateMatcher`. Overlays wie Dialog, Select-Panel, Menü und Datepicker liegen im `cdk-overlay-container` und werden daher nur über globale Styles mit App-Präfix (`andaha-…`) gestylt.

**Erste Aufgabe der Umsetzung ist ein Absicherungstest** (siehe 7.1): `mat-select` (einfach und `multiple`), Datepicker und Timepicker außerhalb von `mat-form-field` im neuen `.field`. Fällt einer davon durch (Fehler, kaputtes Layout, Tastatur), bleibt für genau diesen Typ `mat-form-field` erhalten und wird per Override gestylt (Variante B aus `umsetzung.md`, Phase 3.1). Das wird im Plan vermerkt.

Pakete werden in dieser Story **nicht** deinstalliert: `@angular/material` bleibt Abhängigkeit. Nicht mehr genutzte Material-Module (`MatCardModule`, `MatDividerModule`, `MatToolbarModule`, `MatListModule`, `MatGridListModule`, `MatChipsModule`, `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`) werden aus den jeweiligen Feature-Modulen entfernt, sobald ihr letzter Einsatz in diesem Modul weg ist.

## 5. Architektur der Oberfläche

### 5.1 Fundament (umsetzung.md Phase 1)

- `index.html`: Hanken Grotesk und Material Symbols Outlined (opsz/wght/FILL/GRAD wie in `umsetzung.md`), `lang="de"`, `theme-color #F8F4EC`. Roboto und die alten Material Icons entfallen.
- `MatIconRegistry.setDefaultFontSetClass('material-symbols-outlined')` einmalig in `AppModule`. Icon-Namen nach der Tabelle in `umsetzung.md`.
- Tokens: `docs/design/tokens/_andaha-tokens.scss` wird nach `src/themes/` kopiert. Alle Werte kommen aus CSS Custom Properties (`var(--bg)` usw.), keine Hex-Werte in Komponenten-SCSS.
- Material-Theme: `docs/design/tokens/andaha-theme.scss` ersetzt `src/themes/custom-theme.scss`. Es wird genau einmal eingebunden. `purple-green.css` fliegt aus `angular.json` (build und test).
- `styles.scss` wird neu aufgebaut: Basis (Hintergrund, Schrift, `tabular-nums`, `::selection`, Fokusring), globale Muster aus den Mockups (`.row`, `.date`, `.amt`, `.dot`, `.sec`, `.kv`, `.actions`, `.btn`-Varianten, `.tag`, `.empty`, `.big`, `.field`, `.chip`, `.segment`, `.bottom-nav`) und Overrides für die verbleibenden Material-Komponenten (Select-Panel, Datepicker, Menü, Snackbar, Progressbar 3 px Primär, Checkbox/Radio, Sheet).
- Das Markup und CSS der Muster wird aus `docs/design/mockups/*.html` übernommen, nicht neu erfunden.
- `manifest.webmanifest`: Farben auf `#F8F4EC`.
- Zahlen- und Datumsanzeige: `registerLocaleData(localeDe)`. Beträge werden nur in der Anzeige über `number:'1.2-2':'de'` formatiert.

### 5.2 Shell (Phase 2)

- **Seitentitel** kommt aus Route-`data: { title }` in den Feature-Routing-Modulen. `AppComponent` liest bei `NavigationEnd` den tiefsten `title` der `ActivatedRoute`-Kette. Detailseiten dürfen den Titel zur Laufzeit überschreiben (Namen wie „Miete“), über einen kleinen `PageTitleService` mit einem `title$`-Stream: Route-Titel als Default, `set()` aus der Komponente, Zurücksetzen bei Navigation.
- **Zurück-Pfeil:** Seiten mit bisherigem Zurück-Button zeigen ihn in der Kopfzeile. Mechanismus: Route-`data: { back: '<pfad>' }` bzw. `PageTitleService.setBack(link)`, falls der Zielpfad von Parametern abhängt. Die `routerLink`s bleiben gleich. Neu ist nur der Zurück-Pfeil bei der analysierten Rechnung.
- **Kopfzeile Mobile (< 1024 px):** 56 px, Menü-Button bzw. Zurück, Titel, Sync-Icon (nur bei `syncActive`), Konto-Button mit `mat-menu` → „Ausloggen“ (gleicher Handler).
- **Kopf Desktop (≥ 1024 px), maßgeblich ist Screenshot 07:** Es gibt keine 56-px-Leiste. Der Seitentitel steht als `h1` (28/600) oben in der Inhaltsspalte (max. 1120 px, 40 px Rand). Rechts daneben stehen Sync-Status (Icon + „Synchronisiert …“, nur bei `syncActive`), Benutzername und Konto-Button. Direkt darunter folgen die Bereichs-Tabs. Die Kopfzeile gibt es also zweimal im Markup von `app.component` (mobile Leiste und Desktop-Kopf, je per Breakpoint ein-/ausgeblendet) mit denselben Bindungen. Die Bereichs-Tabs bleiben in den fünf Bereichskomponenten und erscheinen auf Desktop im Fluss unter dem Kopf. *(Meine Entscheidung: Der Text „Synchronisiert …“ kommt aus Mockup 07 und DESIGN.md („Sync-Status“) und gilt als Teil der abgenommenen Gestaltung, nur auf Desktop.)*
- **`mat-sidenav`:** unter 1024 px `mode="over"` (Drawer 304 px), ab 1024 px `mode="side" opened` (Sidebar 248 px). Der Breakpoint kommt über `BreakpointObserver`. Inhalt nach Mockup 02 und 07, 6 Einträge mit `routerLinkActive`, Rechtliches unten. Das Schließen nach einem Klick passiert nur im Modus `over`.
- **Bereichsnavigation** der fünf Features (`bill`, `bill-analysis`, `budgetplan`, `work`, `settings`): `<nav class="bottom-nav">` mit `<a routerLinkActive>`, gleiche Links. Ab 1024 px dasselbe Markup als Tabs unter dem Titel, nur per CSS. Die Styles stehen global, die fünf Komponenten enthalten nur noch Markup.
- **Layout:** Die Platzhalter-Divs (`toolbar-placeholder`, `bottom-navigation-placeholder`, `button-placeholder`, `progressbar-placeholder`, `filter-placeholder*`) und `position: fixed` werden durch ein Flex-Layout ersetzt (`100dvh`, Inhalt `flex:1; overflow:auto`, Aktionsleiste und Navigation `flex:none`).

### 5.3 Gemeinsame Bausteine (Phase 3)

- **Feld `.field`:** `<label class="field">` mit `.field-label`, darin das Steuerelement (`input`, `textarea`, `mat-select` oder Datepicker-Input) und optional `.suffix`. Darunter `.field-hint` bzw. `.field-error`.
  - **Fehleranzeige:** Bisher zeigt `mat-error` Fehler, wenn das Control ungültig und berührt ist bzw. das Formular abgeschickt wurde. Diese Regel wird beibehalten, und zwar zentral über einen kleinen Helfer (z. B. Pipe/Funktion `showError(control, form)`), der dieselbe Logik wie Materials `ShowOnDirtyErrorStateMatcher`/Default nachbildet. Für `mat-select` wird weiterhin der Default-`ErrorStateMatcher` genutzt.
  - Ob `.field` reines CSS-Muster oder eine kleine `app-field`-Komponente mit Content Projection wird, entscheidet der Plan.
  - `shared/date-picker/date-picker-form-field` und `time-picker-form-field` behalten ihre Inputs/Outputs (API unverändert) und nutzen intern das neue Feld.
- **Dialoge → Bottom Sheet:** Alle Dialoge werden zum Sheet, auch die drei, die heute ohne `getDialogBaseConfig()` geöffnet werden (`confirmation-dialog.service`, `add-connection-dialog.service`, `analyzed-bill-image-dialog.service`). Diese drei Services bekommen die Basis-Konfiguration ergänzt. Bestehende eigene Optionen (Daten, Breite usw.) bleiben erhalten und werden darübergelegt. `getDialogBaseConfig()` liefert unter 600 px `panelClass: 'andaha-sheet'`, `position: { bottom: '0' }`, `width: '100%'`, `maxWidth: '100vw'`, ab 600 px `panelClass: 'andaha-dialog'` (max. 480 px). `shared/dialog/dialog.component` bekommt Griff, Titel-Slot und Schließen-Button. Alle Dialoge laufen weiter über `MatDialog` und dieselben Komponenten, Daten und Rückgabewerte. `.fullscreen-dialog` entfällt.
- **Aktionsleiste `.actions`:** ersetzt alle `floating-button`/`bottom-button`-Blöcke. `[disabled]`-Bedingungen und Handler werden 1:1 übernommen.
- **Speichern-Zustand:** Wo heute ein Speicher-Flag einen Fortschrittsbalken zeigt, zeigt der Button stattdessen Spinner (18 px) und „Speichert …“ und ist deaktiviert. Das Flag selbst bleibt unverändert. Listen-Ladebalken bleiben.
- **Listenzeilen:** Muster `.row`. Bei Virtual Scroll wird `pixelHeightPerItem`/`itemSize` an die neue feste Zeilenhöhe angepasst (Rechnungen 64 px, Analyse 60 px, `box-sizing: border-box` inklusive Linie).
- **Chips:** `<button type="button" class="chip" [attr.aria-pressed]>`. Der bisherige Handler `onChipClick(chipList: MatChipList, chip: MatChip, i)` arbeitet mit Material-Chip-Objekten und bekommt deshalb eine neue Signatur (z. B. Index/Kategorie). Die Auswahl- und Emit-Logik (`categoryFilterChanged`) bleibt inhaltlich gleich, einschließlich Mehrfachauswahl und „Alle“/„Keine“-Verhalten. Datums-Chips mit Entfernen-Button nutzen denselben Entfernen-Handler.
- **Segment:** native Radios an `form.controls.dateType`, `dateTypeSelectionChanged()` wird wie bisher aufgerufen. Die Labels Monat, Jahr, Gesamt, „Von – Bis“ kommen aus einer eigenen Map. `DateTypeLabelMapping` bleibt.

### 5.4 Seiten (Phase 4)

Pro Seite gilt die Beschreibung in `umsetzung.md`, Phase 4, plus der jeweilige Mockup-Screen. Dabei werden Template und SCSS geändert, an TypeScript nur das, was für Titel, Zurück, Breakpoint und Anzeigeformat nötig ist. Ergänzend:

- **Rechnungen: Filterleiste beim Scrollen.** `bill-list.component.ts#onScroll` blendet die Filterleiste beim Runterscrollen aus und beim Hochscrollen ein. Derselbe Handler löst bei halber Scrollhöhe `fetchNextBills()` aus. Das Nachladen hängt also an diesem Handler, nicht am Paginator. *(Meine Entscheidung:)* Das Verhalten bleibt auf Mobile erhalten, weil es Platz schafft und die Funktion nicht geändert werden soll. Die Leiste wird nicht mehr per `*ngIf` aus dem DOM genommen, sondern per Klasse eingeklappt (`max-height`/`transform`, kurze Transition), damit das Flex-Layout stabil bleibt. Die Nachlade-Schwelle wird in der Regression explizit geprüft (> 50 Rechnungen, langsam und schnell scrollen, kein Springen, kein Endlos-Nachladen). Ab 1024 px bleibt die Filterleiste immer sichtbar (Mockup 07). `showFilterBar` und das Nachladen bleiben in der Logik unverändert, nur die Darstellung wechselt von `*ngIf` zu einer Klassenbindung.
- **Rechnungen Desktop (Mockup 07):** Die Liste wird ab 1024 px als Tabelle dargestellt (Datum | Shop | Kategorie | Herkunft-Icon | Preis). Umsetzung: dieselbe `bill-list-item`-Komponente und derselbe `cdk-virtual-scroll-viewport`, Zeilenlayout per CSS Grid, Kopfzeile außerhalb des Viewports. Die Zeilenhöhe bleibt fest, und `itemSize` wird bei Bedarf je Breakpoint gesetzt. Damit bleibt das Nachladen unverändert.
- **Ringdiagramm:** ng2-charts/Chart.js 3 bleiben (`type: 'doughnut'`, Optionen wie in `umsetzung.md`). Die Legende ist eigene HTML-Liste, ein Klick ruft denselben Handler wie `chartClicked`.
- **Upload (Analyse):** Das bestehende `<input type="file" accept="image/*" capture="environment">` bleibt im DOM (visuell versteckt) und liegt in einem `<label>` als Upload-Fläche.

### 5.5 Reihenfolge

Wie `umsetzung.md`, „Empfohlene Reihenfolge“: (1) Fundament + Shell, (2) Bausteine + Rechnungen, (3) Analyse + Haushaltsplan, (4) Stunden, (5) Einstellungen, Export, Rechtstexte, restliche Dialoge.

Alles passiert auf dem bestehenden Branch `feature/webapps/miniclient/redesign`. Nach jeder Phase muss die App bauen und vollständig bedienbar sein. **Commits nur nach Rückfrage beim Nutzer.**

## 6. Funktionstreue absichern

Weil es keine Unit-Tests gibt, ruht die Absicherung auf drei Säulen:

1. **Logik nicht anfassen.** TypeScript-Änderungen beschränken sich auf: Route-`data`, `PageTitleService`, Breakpoint-Erkennung, `getDialogBaseConfig`, Icon-Registry, Locale-Registrierung, `itemSize`, Fehleranzeige-Helfer, Entfernen ungenutzter Material-Imports, die Basis-Konfiguration in den drei Dialog-Services und die Chip-Handler-Signatur (5.3). Formulare, Validatoren, Services, API-Aufrufe und Handler bleiben unverändert. Wird darüber hinaus TS geändert, muss das im Plan begründet sein.
2. **Template-Bindungs-Inventar je Seite:** Vor dem Umbau einer Komponente werden alle Bindungen des alten Templates aufgelistet (`formControlName`, `(click)`/`(change)`-Handler, `[disabled]`, `*ngIf`/`*ngFor`-Bedingungen, `routerLink`). Nach dem Umbau muss jede davon im neuen Template wieder vorkommen oder ihr Wegfall muss durch `umsetzung.md` gedeckt sein. Das ist das Review-Kriterium pro Task.
3. **Browser-Regression:** die Checkliste aus `umsetzung.md`, Phase 5.3, mit Playwright gegen das lokal laufende Frontend und Backend (Monolith, LocalDB, B2C-Testuser). Der Nutzer hat erlaubt, Testdaten in der lokalen Datenbank über die UI beliebig anzulegen und zu löschen, also Rechnungen (> 50 für das Nachladen), Personen, Arbeitszeiten, Fixkosten, Einkommen und Kategorien. Der Testuser hat lokal aktuell keine Rechnungen.
   - **Ausnahme Verbindungen:** Anfordern, Annehmen und Ablehnen braucht einen zweiten User und einen laufenden Dapr-Sidecar, der lokal nicht läuft. Diesen Teil testet der Nutzer selbst auf der DEV-Umgebung. Lokal wird nur geprüft, dass die Verbindungsseite korrekt dargestellt wird, der Dialog „Verbindung herstellen“ öffnet und sich absenden lässt und die Annehmen-/Ablehnen-Buttons dieselben Handler gebunden haben (Bindungs-Inventar).

**Unit-Tests** (meine Entscheidung): nur für neu eingeführte Logik, also `PageTitleService` (Route-Titel, Überschreiben, Zurücksetzen) und den Fehleranzeige-Helfer. Für Templates werden keine Snapshot- oder Komponenten-Tests nachgerüstet. Sollte `ng test` (Karma/Chrome) lokal nicht lauffähig sein, wird das gemeldet und nicht übergangen.

**Prüfung pro Phase:** `npm run build` grün ohne neue Warnungen, dann Playwright bei 390 × 844 und 1440 × 900 gegen die Screenshots. Abschließend die volle Regressions-Checkliste und die A11y-Punkte aus `umsetzung.md`, Phase 5.4 (Fokus sichtbar, `aria-label`, ≥ 44 px, Kontraste). Screenshots kommen nach `docs/stories/US-0001-miniclient-redesign/ui-testing/`.

## 7. Dem Umsetzer überlassen

- Ob `.field` ein CSS-Muster oder eine `app-field`-Komponente wird (5.3).
- Genaue Aufteilung von globalen und komponentenlokalen Styles, solange die Muster global liegen und Komponenten-SCSS nur Layout-Spezifisches enthält.
- Ob Detailseiten-Titel per Service oder per Resolver gesetzt werden, solange Abschnitt 5.2 erfüllt ist.
- Pixelgenauigkeit: „sichtbar übereinstimmend“ mit den Screenshots. Abweichungen, die nur aus echten Daten statt Beispieldaten entstehen (Längen, Mengen), sind kein Fehler.

### 7.1 Absicherungstest zu Beginn

Vor Phase 3 wird geprüft (Wegwerf-Code oder direkt im ersten echten Formular), ob `mat-select` (einfach und `multiple` mit `mat-select-trigger`), `<input [matDatepicker]>` mit Toggle und `ngx-mat-timepicker` im `.field`-Muster ohne `mat-form-field` korrekt funktionieren. Geprüft werden Auswahl, Tastatur, Wertbindung, Fehleranzeige und Overlay-Position. Das Ergebnis wird im Plan bzw. in einer Notiz in diesem Ordner festgehalten. Bei Problemen gilt die Rückfallregel aus Abschnitt 4.

## 8. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Material-Komponenten ohne `mat-form-field` verhalten sich anders | Absicherungstest 7.1, Rückfall auf gestyltes `mat-form-field` je Typ |
| Fehlermeldungen erscheinen zu einem anderen Zeitpunkt | zentraler Helfer mit Material-Default-Logik, Regression prüft Validierung |
| Virtual Scroll springt oder lädt nicht nach | feste Zeilenhöhen, `itemSize` angepasst, Nachladen in der Regression mit > 50 Rechnungen prüfen |
| Bottom Sheet verdeckt Aktionen oder Tastatur | max. 90dvh, scrollbar, Primär-Button am Sheet-Ende, Test auf 390 × 844 |
| Overlay-Styles greifen nicht (Komponenten-SCSS) | Overlay-Styles nur global mit `andaha-`-Präfix |
| Legacy-Material-Overrides sind fragil | nur für die Komponenten in der linken Spalte von Abschnitt 4, keine `::ng-deep` in Komponenten |
