# Absicherungstest Feld-Muster (Task 4)

Ergebnis: **alle vier Typen OK, kein Rückfall auf `mat-form-field`.** Bedingungen siehe unten.

| Typ | Ergebnis | Befund |
|---|---|---|
| `mat-select` einfach | OK | Wertbindung (`[value]`/`selectionChange`), Tastatur (Tab, Enter öffnet, Pfeile, Enter wählt), Panel-Position und Overlay-Styling funktionieren. |
| `mat-select multiple` + `mat-select-trigger` | OK | `[formControl]`-Bindung, Trigger-Text („Spike B, Spike A“), Hinweis „2 Personen ausgewählt“, Tab/Enter/Pfeile/Escape, `required` -> Control invalid, Fehler per `showError`. Panel öffnet über dem Feld (Material-Standard bei `multiple`), ca. 16 px breiter als das Feld. |
| Datepicker (`<input [matDatepicker]>` + `mat-datepicker-toggle`) | OK | Wertbindung über Kalender (15.10.2026 übernommen), Overlay unter dem Feld, Toggle per Tab erreichbar, eigenes Icon per `<mat-icon matDatepickerToggleIcon>calendar_today`. |
| Timepicker (`[ngxMatTimepicker]` auf einfachem `<input>`) | OK | Dialog öffnet per Klick, Zeit wird übernommen (`timeChanged` -> Netto-Arbeitszeit aktualisiert sich). Escape schließt den Dialog nicht (Verhalten der Bibliothek, unabhängig vom Feld). CANCEL/OK funktionieren. |

## Regeln für alle späteren Tasks

1. **Kein `<label class="field">` um `mat-select`.** Ein umschließendes `<label>` leitet den Klick weiter, das Panel öffnet und schließt sich sofort (im Test: nie sichtbar). Für `mat-select` immer `<div class="field">` mit `<span class="field-label">` verwenden und `aria-label` am `mat-select` setzen. `<label class="field">` ist nur für `input`/`textarea`/Datepicker/Timepicker geeignet (dort ist der Input das labelbare Element).
2. **Chevron selbst setzen:** `mat-select` bringt einen eigenen Pfeil mit. `styles.scss` blendet `.field .mat-select-arrow-wrapper` aus, im Feld steht stattdessen `<mat-icon class="suffix">expand_more</mat-icon>`. In `styles.scss` ergänzt: `.field .mat-select` (flex 1, Schrift/Farbe), `.mat-select-placeholder` (faint).
3. **Ein `mat-select` mit leerer Optionsliste öffnet nicht** (Material: kein Öffnen ohne `mat-option`). Kein Fehler, aber bei Tests mit Testdaten beachten.
4. **`showError`-Pipe ist impure (`pure: false`)**, anders als im Plan angesetzt. Das Control ist ein veränderliches Objekt mit gleicher Referenz, eine pure Pipe wertet nach `touched`/Eingabe nicht neu aus (im Browser nachgewiesen: kein roter Rahmen trotz `ng-touched ng-invalid`). Mit `pure: false` erscheint Rahmen und Fehlertext korrekt.
5. **Suchfeld im Select-Panel** (`person-search-input`) war nur als Probe ohne `matInput`: unstyled. In Task 12 mit eigener Klasse stylen.
6. **Datepicker-Accessible-Name:** Das Feld ist ein `<label>`, das auch den Toggle-Button enthält. Deshalb `[attr.aria-label]="label"` am Input (steht in der Komponente).

## Bekannt, nicht Teil dieses Tasks
- `MY_FORMATS.parse.dateInput` ist `'LT'` (Zeitformat). Manuelles Tippen eines Datums im geteilten Datepicker wird dadurch beim Verlassen auf das heutige Datum zurückgesetzt. Auswahl über Kalender funktioniert. Verhalten bestand vor dem Redesign (TS unverändert).
- Der Datumfilter-Dialog der Rechnungsliste nutzt seine eigenen `mat-form-field`-Datepicker (nicht die geteilte Komponente), tippen von `01.10.2026` ergibt dort `10.01.2026` (Monat/Tag vertauscht). Ebenfalls vor dem Redesign. Wird in Task 6 umgebaut.
