# Design: Rechnungsstatistik – Kategoriefarben und Ausblenden (US-0004)

## Intent

In der Statistik sollen Ring und Legende jede Kategorie zuverlässig in ihrer Farbe zeigen, auch wenn ein verbundener Benutzer (Collaboration) mitgezählt wird. Wer eine dominante Kategorie vorübergehend ausblendet, soll die Verteilung der übrigen Kategorien lesen können.

**Anti-Goals:**
- Eine einzelne problematische Kategorie darf nie wieder die ganze Statistik kaputt machen.
- Kein dauerhafter Zustand, den man später „vergessen“ hat.
- Das Design „Tinte & Kupfer“ bleibt unverändert.

## Befund (Code-Recon, Fehler nachgestellt)

| Thema | Befund |
|-------|--------|
| Daten | `GetExpensesQueryHandler` filtert `bill.UserId == userId \|\| connectedUsers.Contains(bill.UserId)` und `bill.Category.IncludeToStatistics` und gruppiert dann nach `bill.Category.Name`. `ExpenseDto(Category, Costs, SubCategories)` hat keine Farbe. |
| Kategorien | `ListBillCategoriesQueryHandler` liefert nur `category.UserId == userId`, also nur die eigenen Kategorien. |
| Absturz | `ChartComponent.refreshChart()`: `this.categories.find(c => c.name == e.category)!.color` wirft bei einer fremden Kategorie `TypeError: Cannot read properties of undefined (reading 'color')`. Der Initialwert von `chartDatasets` (`data: [1], backgroundColor: ['red']`) bleibt stehen. Die Legende liest `chartDatasets[0].backgroundColor[i]`, deshalb ist nur Zeile 1 gefärbt, und zwar Rot. Mit einem Karma-Test nachgestellt, Ergebnis `background: red; \| \| \|`. |
| DEV vs. PROD | Auf DEV gibt es keinen verbundenen Benutzer, deshalb ist dort jede Kategorie eine eigene. |
| Legende | Jede Legendenzeile ist ein `<button class="lg">`. Ein Tipp öffnet `chartClicked({active:[{index:i}]})`. Ein zweiter Button darf nicht in einen Button geschachtelt werden. |

## Entscheidungen (mit dem Nutzer abgestimmt)

### 1. Farbe kommt vom Backend

- `ExpenseDto` bekommt das Feld `Color` (string, JSON `color`), Reihenfolge `(Category, Color, Costs, SubCategories)`. Die Farbe gilt pro Gruppe (Kategoriename):
  1. Hat der anfragende Benutzer eine eigene Kategorie mit diesem Namen, gilt **deren** Farbe, auch wenn die Gruppe Rechnungen eines verbundenen Benutzers enthält.
  2. Sonst gilt die Farbe einer Kategorie dieses Namens, die in der Gruppe vorkommt (also die eines verbundenen Benutzers). Haben mehrere verbundene Benutzer gleichnamige Kategorien mit unterschiedlicher Farbe, muss die Wahl deterministisch sein (z. B. `MIN(Color)`), welche ist egal.
- Das Ergebnis bleibt nach `Costs` absteigend sortiert, Filter und Gruppierung bleiben unverändert.

### 2. Frontend: Farbe robust auflösen

- `ExpenseDto.ts` bekommt `color?: string`. Optional, damit ein Client gegen ein noch nicht aktualisiertes Backend weiter funktioniert.
- Farbe pro Kategorie: `expense.color`, sonst die Farbe der eigenen Kategorie gleichen Namens aus `categories`, sonst die Ersatzfarbe `'grey'` (aus `getAllColors()`, als Konstante). Es wird **nie** geworfen.
- Die Legende liest die Farbe nicht mehr per Index aus `chartDatasets[0].backgroundColor[i]`, sondern aus einer eigenen, pro Kategorie aufgelösten Liste. Ringindex und Legendenindex sind durch das Ausblenden nicht mehr gleich, siehe Punkt 3.
- Der Platzhalter-Datensatz `['red']` entfällt. Initial ist der Datensatz leer.
- `dot-light` (weißer Rand für `white`) bleibt.

### 3. Ausblenden (vorübergehend)

- **Bedienung:** Jede Legendenzeile wird ein Container (`div.lg`) mit zwei Buttons:
  - **Hauptbereich** (Punkt, Name, %, Betrag, Chevron): öffnet die Kategorie-Details wie bisher.
  - **Augen-Button** rechts außen: `mat-icon` `visibility` (sichtbar) bzw. `visibility_off` (ausgeblendet). `aria-label` lautet „{Kategorie} ausblenden“ bzw. „{Kategorie} einblenden“, dazu `aria-pressed` = ausgeblendet. Tippfläche mindestens 40 × 40 px.
- **Ausgeblendete Zeile:** bleibt an ihrer Stelle in der Legende (Reihenfolge wie geliefert). Sie wird ausgegraut (Text und Punkt gedämpft, z. B. `opacity` bzw. Token `--dim`), statt der Prozentangabe steht „–“, der Betrag bleibt sichtbar. Ein Tipp auf den Hauptbereich öffnet weiterhin die Details.
- **Ring:** enthält nur sichtbare Kategorien, in Legendenreihenfolge. Ein Klick in ein Segment öffnet die Details der Kategorie **dieses Segments**. Abbildung über eine Liste der sichtbaren Ausgaben, nicht über `this.expenses[index]`.
- **Summe und Prozente:** Die Summe in der Ringmitte ist die Summe der sichtbaren Kategorien, die Prozente beziehen sich auf diese Summe. Sind alle ausgeblendet, ist die Summe 0, der Ring leer, und alle Zeilen zeigen „–“.
- **Lebensdauer:** Gemerkt werden die ausgeblendeten **Kategorienamen** im Zustand von `ExpensesComponent`. Grund: `app-chart` wird beim Laden eines neuen Zeitraums durch `*ngIf="!isLoading …"` neu erzeugt. Damit bleibt das Ausblenden beim Zeitraumwechsel erhalten (AC7). Fehlt eine ausgeblendete Kategorie im neuen Zeitraum, bleibt ihr Name gemerkt, das ist harmlos. Nach Verlassen der Seite (Komponente zerstört) ist alles wieder sichtbar. Kein Local Storage.
- **Datenfluss:** `ExpensesComponent` gibt `hiddenCategories: string[]` (bzw. `Set`) an `app-chart` und reagiert auf ein Output `visibilityToggled(categoryName)`. Die Summe berechnet weiterhin `ExpensesComponent`, jetzt nur über die sichtbaren. Ob `ChartComponent` die Summe stattdessen selbst berechnet, entscheidet der Builder. Wichtig ist nur: Es gibt eine Quelle, und Ringmitte und Prozente stimmen überein.
- **Chart neu zeichnen:** `refreshChart()` läuft, wenn sich `expenses` oder die ausgeblendeten Kategorien ändern. Es wird ein **neues** `chartDatasets`-Array zugewiesen, wie bisher, damit ng2-charts (`BaseChartDirective.ngOnChanges`) neu zeichnet. Es wird keine neue Chart.js-API benutzt (kein `toggleDataVisibility`). Deshalb war kein Context7-Lookup nötig.

## Rahmen

- Backend: `Requests/Expense/Dtos/V1/ExpenseDto.cs`, `Requests/Expense/GetExpenses/V1/GetExpensesQueryHandler.cs` (.NET 10, EF Core 10). Für Shopping gibt es kein Testprojekt. Gate ist der Build. Die Farbregel wird über das Frontend-Verhalten und den UI-Check geprüft.
- Frontend: `api/shopping/dtos/ExpenseDto.ts`, `features/bill/modules/expenses/expenses.component.{ts,html}`, `.../chart/chart.component.{ts,html,scss}`, neue Specs `chart.component.spec.ts` und `expenses.component.spec.ts`. Angular 14, ng2-charts 4, Chart.js 3.9.
- Specs mit `DecimalPipe` und Locale `de` brauchen `registerLocaleData(localeDe, 'de')`.

## Nicht-Ziele

- Ausblenden dauerhaft speichern, die Einstellung „Aufnehmen in Statistik“ ändern, Gruppierung nach Namen bzw. Collaboration-Logik ändern, Kategorie-Farben verbundener Benutzer in den Einstellungen anzeigen.

## Dem Builder überlassen

- Die EF-Formulierung der Farbregel. Eine Übersetzung in SQL ist gewünscht. Alternativ eigene Kategorien als Name→Farbe-Map in einer zweiten Abfrage laden und die Gruppenfarbe per `Min` ermitteln.
- Wo die Summe der sichtbaren Kategorien berechnet wird (siehe oben).
- Exakte Stile der ausgegrauten Zeile im Rahmen der Tokens.

## Verifikation

- **Unit-Tests:**
  - ChartComponent: Farbe aus `expense.color`, Rückfall auf eigene Kategorie, Ersatzfarbe ohne Fehler, Legenden-Punkte in richtiger Farbe, ausgeblendete Kategorie nicht im Datensatz, Segment-Klick öffnet richtige Kategorie, Prozente bezogen auf die sichtbare Summe.
  - ExpensesComponent: Toggle, Summe nur über sichtbare, Ausblenden überlebt neue `expenses`.
- **Backend:** `dotnet build` des Shopping-Service.
- **Playwright** (API per Route gemockt, inkl. fremder Kategorie mit eigener Farbe und Kategorie ohne Farbe): Farben in Legende und Ring, Augen-Button, Summe/Prozente, Zeitraumwechsel, Segment-Klick, keine Konsolenfehler. Mobile 390 × 844 und Desktop.
