# Design: Aufräumarbeiten nach dem Redesign (US-0003)

## Intent

Der MiniClient wird hauptsächlich als installierte PWA am Android-Handy verwendet. Nach dem Redesign (US-0001) stören dort drei Dinge: Die Seite ist zu hoch, die Suche feuert zu früh und mischt Ergebnisse, und der Export zeigt zwei Spinner. Ziel ist, dass sich die App wie eine native App anfühlt: Nichts scrollt außer Listen und Inhalten, die Suche ist ruhig und korrekt, und das Export-Feedback ist eindeutig.

**Anti-Goals:** Design oder Texte von „Tinte & Kupfer“ ändern; das Layout im normalen Browser verschlechtern; Inhalte unter System-Leisten (Statusleiste, Gesten- bzw. Navigationsleiste, Notch) verschwinden lassen.

## Befund (Code-Recon)

| Thema | Befund |
|-------|--------|
| Höhe | `.shell` (`mat-sidenav-container`) setzt `height: 100vh; height: 100dvh` (`src/app/app.component.scss`). `html, body { height: 100% }` hat kein `overflow: hidden` (`src/styles.scss`). Kein `viewport-fit=cover`, nirgends `env(safe-area-inset-*)`. Der Fehler tritt **nur** in der installierten Android-PWA auf (Standalone), im Handy-Browser nicht. Vermutung: `100dvh` ist im Standalone-Modus größer als der tatsächlich sichtbare Bereich → Dokument scrollt. |
| Suche | `bill-list-filter.component.ts`: `keyup` → `debounceTime(300)` → `distinctUntilChanged()` → `searchTextChanged`. Kein Trim; Subscription wird nie beendet. `BillContextService.fetchBills()` startet pro Aufruf einen eigenen HTTP-Request ohne Abbruch, und `updateBillList()` **fügt Ergebnisse in die bestehende Liste ein**. Antworten einer älteren Suche können also in die neue Liste gemischt werden. |
| Export | `export.component.html`: Beide `mat-spinner` und beide `[disabled]` hängen an einem gemeinsamen `isExporting`. |

## Entscheidungen (mit dem Nutzer abgestimmt)

### 1. Bildschirmhöhe – robust, unabhängig von Gerät und Modus

- **Shell an den sichtbaren Bereich heften statt Höhe berechnen:** `.shell { position: fixed; inset: 0; }` ersetzt `height: 100vh/100dvh`. Angular Material v14 zeigt für Vollbild-Sidenav-Layouts genau dieses Muster (Container absolut/fix an allen vier Kanten; Context7 `/websites/material_angular_dev/v14`, Sidenav).
- **Dokument scrollt nie:** `html, body { height: 100%; overflow: hidden; overscroll-behavior: none; }`.
- **Safe Areas:** `src/index.html` Viewport-Meta um `viewport-fit=cover` ergänzen. Die Hauptspalte `.shell-main` bekommt `padding-top: env(safe-area-inset-top)` und `padding-bottom: env(safe-area-inset-bottom)`. Dadurch sitzen Kopfzeile und untere Leiste (`.bottom-nav`) über bzw. unter den System-Leisten, auf Seiten mit und ohne Bereichsnavigation. Die Fläche darunter hat die Farbe `var(--bg)`, wie Kopfzeile und Leiste. Der Drawer (`mat-sidenav`) bekommt dieselben oberen und unteren Abstände. Ohne Insets (Desktop, Browser) ist `env()` = 0, es ändert sich also nichts.
- Scrollen bleibt, wie es ist, in `.content` bzw. in den Kindern von `.area` (`styles.scss`).
- **Nachweis:** Playwright bei 390 × 844 (Mobile) und 1440 × 900 (Desktop): `document.scrollingElement.scrollHeight <= innerHeight`, untere Leiste vollständig im Viewport. Den Standalone-Modus der PWA kann Playwright nicht nachbilden; die Bestätigung am Android-Gerät macht der Nutzer.

### 2. Rechnungssuche

- **Auslösen:** Suchbegriff wird getrimmt. Getippte Änderungen lösen nach **600 ms** Tipp-Pause aus (bisher 300 ms). **Sofort** lösen aus: Enter bzw. die „Suchen“-Taste der Bildschirmtastatur, „Suche löschen“ und ein leeres Feld.
- **Keine Doppelsuchen:** `distinctUntilChanged` auf dem getrimmten Begriff, über beide Wege (verzögert und sofort) hinweg. Beispiel: Enter und danach die abgelaufene Pause für denselben Begriff ergeben genau eine Suche.
- **Lebensdauer:** Die Subscription endet mit der Komponente.
- **Nur die neueste Anfrage zählt:** `BillContextService` verwirft Antworten von Anfragen, die vor dem letzten Zurücksetzen (Suche, Kategorie- oder Datumsfilter, Seitengröße) gestartet wurden, und bricht deren HTTP-Request ab. RxJS: `switchMap` bzw. Unsubscribe beim Zurücksetzen (Context7 `/reactivex/rxjs/7_8_2`: switch-Operatoren melden sich vom vorherigen inneren Observable ab). Das Nachladen weiterer Seiten **derselben** Suche (`fetchNextBills`) darf sich dabei nicht gegenseitig abbrechen. `loading$` bleibt `true`, bis die gültige, neueste Anfrage fertig ist.

### 3. Export

- Ein Merker für den laufenden Export: `exporting: 'expenses' | 'work' | null`. Der Spinner erscheint nur in der passenden Zeile. Beide Buttons sind gesperrt, solange `exporting !== null`. Bei Abschluss **oder** Fehler wird der Merker zurückgesetzt (`finalize`).
- *(Nachtrag aus dem Final Review, eigene Entscheidung:)* Die Download-Methoden der Services geben `Subject`s zurück, die nie abschließen. Die Komponente nimmt deshalb `take(1)` vor `finalize`. Zusätzlich, entgegen „Services unverändert“: `ExpenseContextService.downloadExpenses()` und `PersonContextService.downloadPersonInformations()` liefern über `ReplaySubject(1)`, damit eine synchrone Antwort nicht verloren geht und der Spinner nicht hängen bleibt. Der Zeitraum wird nur einmal gelesen (`take(1)`), sodass spätere Zeitraum-Änderungen keine weiteren Downloads auslösen. Ist noch kein Zeitraum geladen, endet der Klick wie bisher ohne Download.
- *(Nachtrag, Safe Areas:)* Bottom-Sheets (`andaha-sheet`) und Snackbars bekommen ebenfalls `env(safe-area-inset-bottom)`, weil `viewport-fit=cover` sie sonst unter die System-Leiste schieben würde.

## Rahmen

- Nur Frontend `src/WebApps/MiniClient/Andaha.WebApps.MiniClient` (Angular 14, Angular Material 14, RxJS 7.4). Kein Backend-Change, keine geänderten API-Aufrufe (gleiche Parameter).
- Betroffene Dateien: `src/index.html`, `src/styles.scss`, `src/app/app.component.scss`, `src/app/features/bill/modules/bill-list/bill-list-filter/bill-list-filter.component.{ts,html}`, `src/app/features/bill/services/bill-context.service.ts`, `src/app/features/export/export.component.{ts,html}` sowie die zugehörigen Specs.
- Design-Tokens und Optik bleiben unverändert.

## Nicht-Ziele

- Querformat-Optimierung (seitliche Safe Areas), Änderungen an der Such-API, neue Export-Funktionen.

## Dem Builder überlassen

- Genaue rxjs-Komposition (z. B. `merge` aus verzögertem und sofortigem Strom; Versions-Zähler vs. `switchMap` im Service), solange die Regeln oben gelten.
- Ob `overscroll-behavior` zusätzlich an Scroll-Containern nötig ist.

## Verifikation

- **Unit-Tests:** Filter-Komponente (600 ms, Enter sofort, Löschen sofort, Trim und Distinct), `BillContextService` (veraltete Antwort wird verworfen, Seiten-Nachladen bleibt), Export-Komponente (Spinner pro Zeile, Sperre, Reset bei Fehler).
- **Playwright** (390 × 844 und 1440 × 900): keine Dokument-Scrollbar, Leiste sichtbar, Export-Spinner pro Zeile, Suchverhalten über die Netzwerk-Requests.
- **Nutzer:** Check in der Android-PWA.
