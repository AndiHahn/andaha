# US-0010 Design: Schnell-Hilfe – geführte Tour durch die neue Bedienung

Stand: 2026-11-07. Grundlagen:
- [`story.md`](./story.md) (AC1–AC13) und `docs/design/DESIGN.md`.
- Navigation und Schnellerfassung aus US-0007, langer Druck aus US-0008, Scans aus US-0009.
- Mockup: `.superpowers/brainstorm/537-1794038250/content/tour-stil-v2.html`, Variante C.

Markierungen:

- **[Nutzer]** hat der Nutzer entschieden.
- **[Entscheidung]** ist ein Vorschlag aus dem Gespräch, den der Nutzer mit „passt“ bestätigt hat, oder eine Entscheidung dieses Designs.
- **[Technik]** ist eine technische Entscheidung.

## 1. Absicht

**[Nutzer]** Die Tour ist vor allem für Leute, die die alte App gut kennen. Nach dem Update finden sie das Menü nicht mehr. Nach der Tour sollen sie wieder Rechnungen eintragen und die App gut verwenden können. Sie erscheint einmal.

**Ziele:**

- In unter einer Minute weiß man, wo Hauptmenü und Untermenü sind und wie man eine Rechnung einträgt (Eingabezeile, Foto, Vorlagen).
- Man weiß auch, dass es Wischen und den langen Druck gibt.
- Die Tour zeigt auf die echte App und nicht auf Bilder.

**Nicht-Ziele:**
- Fachbegriffe erklären (Kategorie, Haushalt usw.).
- Haushalt, Stunden und Einstellungen im Detail erklären.
- Ein Changelog.

**Anti-Ziele:**

- Die Tour nervt: Sie erscheint öfter als einmal, lässt sich nicht abbrechen oder blockiert die App.
- Pfeile zeigen ins Leere oder auf das falsche Element, etwa auf einem anderen Handy oder nach dem Drehen.
- Die Tour hinterlässt Spuren: eine gespeicherte Rechnung, einen Entwurf oder eine offene Schnellerfassung.
- Hauptmenü und Untermenü sind nicht klar unterscheidbar **[Nutzer]**.

## 2. Form

**[Nutzer]** Variante C, „Pfeile direkt auf der App“:

- Die App wird abgedunkelt, nur die erklärten Elemente bleiben hell.
- Kurze Texte mit gezeichneten Pfeilen zeigen darauf, mehrere gleichzeitig.
- Eine Seite heißt hier „Bildschirm“.
- Es gibt keine Kartenbox, die man durchklickt.

**[Nutzer]** Hauptmenü und Untermenü sind klar getrennt:

| Ebene | Farbe | Elemente |
|---|---|---|
| Hauptmenü | Kupfer: Rand `secondary` #B8692F, Beschriftung auf dunklem Grund z. B. #F6C9A0 | Mobil die Leiste unten, am Desktop die Sidebar |
| Untermenü | Blau: Rand `primary` #2E4FA8, Beschriftung auf dunklem Grund z. B. #B9C8EE | Die Tabs oben bzw. unter dem Titel |

Die Beschriftung steht jeweils als kleine Überschrift über dem Hinweis, also „Hauptmenü“ bzw. „Untermenü“. Alle anderen Hervorhebungen sind neutral mit einem hellen Rand.

**Bedienelemente:**
- Oben links „Überspringen“, oben rechts „1 / 3“.
- Darunter ein Knopf als Pille in Weiß mit blauer Schrift: „Weiter“ bzw. „Los geht’s“.
- Ab Bildschirm 2 gibt es neben dem Knopf einen Textlink „Zurück“ **[Entscheidung]**.
- Ein Tipp auf die abgedunkelte Fläche macht nichts **[Entscheidung]**, damit man die Tour nicht versehentlich beendet.
- Die App darunter ist während der Tour nicht bedienbar.

## 3. Bildschirme **[Entscheidung]**

Alle Texte sind Vorschläge. Der Umsetzende darf kürzen, aber nicht erweitern. Pro Hinweis gibt es eine fette Zeile und höchstens einen Satz.

### Bildschirm 1 · Menüs

| Ziel | Mobil (< 1024 px) | Desktop (≥ 1024 px) |
|---|---|---|
| Tabs (Untermenü, blau) | **Untermenü** · Die Tabs eines Bereichs. | **Untermenü** · Die Tabs eines Bereichs, zum Wechseln klicken. |
| Wisch-Hinweis (kein Element, Doppelpfeil ←→ über der Liste) | Wisch nach links oder rechts, um den Tab zu wechseln. | entfällt |
| Hauptleiste bzw. Sidebar (Hauptmenü, kupfer) | **Hauptmenü** · Ersetzt das ☰-Menü. Kategorien, Vorlagen und Export liegen unter *Mehr*. | **Hauptmenü** · Rechnungen, Haushalt, Stunden. Kategorien, Vorlagen und Export liegen unter *Mehr*. |

### Bildschirm 2 · Eintragen

| Ziel | Text |
|---|---|
| Eingabezeile „Neue Rechnung: Betrag“ | **Rechnung eintragen** · Betrag tippen, Vorlage wählen, fertig. |
| Kamera-Knopf | **Foto** · Wird automatisch angelegt. Unklares landet unter *Scans*. |
| Erste sichtbare Rechnungszeile | **Lang drücken** · Duplizieren oder Löschen. Am Desktop: **Rechtsklick** · Duplizieren oder Löschen. |

Wenn die Liste leer ist (neue:r Nutzer:in), entfällt nur der Hinweis zur Rechnungszeile (AC9).

### Bildschirm 3 · Vorlagen

- Beim Betreten öffnet die Tour die Schnellerfassung über `QuickEntryService.open()`: mobil als Sheet, am Desktop als Dialog.
- Die Tour liegt darüber und zeigt auf den Kachelbereich (`quick-tiles`) und den Knopf „Andere …“.
- Beim Verlassen des Bildschirms schließt die Tour die Schnellerfassung wieder. Das gilt für Zurück, Abschließen, Überspringen, Escape und die Zurück-Geste.

| Ziel | Text |
|---|---|
| Kachelbereich, mit Kacheln | **Vorlagen** · Deine häufigen Einkäufe als Kachel. Lang drücken auf einen Vorschlag heftet ihn an. Am Desktop: Rechtsklick auf einen Vorschlag heftet ihn an. |
| Kachelbereich, ohne Kacheln | **Vorlagen** · Hier erscheinen deine häufigen Einkäufe als Kachel. |
| „Andere …“ | **Neuer Shop?** · Über *Andere …* mit „Als Vorlage merken“. |
| Freier Hinweis unten, ohne Pfeil | Verwalten unter *Mehr → Vorlagen*. |

Der Knopf heißt hier „Los geht’s“. Danach schließt sich die Schnellerfassung, und man ist auf der Liste.

**Spurenfreiheit (AC4) [Technik]:** Die Schnellerfassung speichert beim Schließen ohne Speichern einen Entwurf (US-0007 AC18).
- Die Tour öffnet sie mit leerem Betrag und ohne Auswahl und darf **keinen** Entwurf erzeugen bzw. hinterlassen.
- Bestand vorher schon ein Entwurf, muss er unverändert bleiben.
- Der Umsetzende prüft, wie `quick-entry-draft.service` heute mit leeren Werten umgeht. Falls nötig, bekommt das Öffnen eine Option „Tour/Vorschau“: kein Entwurf laden, keinen speichern, Eingaben gesperrt.
- Wie genau das gebaut wird, entscheidet der Umsetzende. Das Ergebnis muss ein Unit-Test belegen.

## 4. Wann die Tour erscheint

**[Nutzer]** Einmal. **[Entscheidung]** „Einmal“ gilt **pro Gerät**: Am Desktop zeigen die Pfeile auf andere Elemente, eine zweite Runde dort ist also sinnvoll, und das Backend bleibt unverändert.

- Der Schlüssel `andaha.tour.v1.seen` in `localStorage` wird auf `"1"` gesetzt, **sobald die Tour angezeigt wird** **[Entscheidung]**. Eine durch Reload oder Schließen der App unterbrochene Tour kommt also nicht wieder (Anti-Ziel „öfter als einmal“). Wer sie nochmal sehen will, startet sie über „Schnell-Hilfe“. Der Schlüssel gilt pro Gerät und nicht pro Benutzer **[Technik]**. Das `v1` erlaubt später eine neue Tour.
- Ist `localStorage` nicht verfügbar oder wirft es einen Fehler, erscheint die Tour nicht von selbst **[Entscheidung]**. Eine Tour bei jedem Start wäre schlimmer als gar keine.
- **Startbedingung (AC1, AC2):** Die Tour startet automatisch, wenn alle diese Punkte zutreffen:
  - Die Rechnungsliste `/bill/list` ist aktiv.
  - Die Liste hat ihren ersten Ladevorgang abgeschlossen, egal ob mit Ergebnis, leer oder mit Fehler.
  - Kein Overlay ist offen: weder Sheet noch Dialog noch Menü.
  - Es gibt keinen Launch-Intent (`?quick`, `?shared`).
  - Der Schlüssel fehlt.

  Die Bedingung wird **laufend** geprüft, solange die Liste aktiv ist **[Entscheidung]**. Wird also die über den App-Shortcut geöffnete Schnellerfassung geschlossen, ob gespeichert oder nicht, und man bleibt auf der Liste, startet die Tour danach. Gerade wer immer über den Shortcut einsteigt, gehört zur Zielgruppe. Verlässt man die Liste, wird beim nächsten Erreichen wieder geprüft. Nach Erfüllen der Bedingung gibt es eine Verzögerung von etwa 400 ms, damit Layout, Snackbar-Einblendung und Sheet-Animation fertig sind. Ändert sich in dieser Zeit etwas, etwa weil ein neues Overlay aufgeht, wird nicht gestartet.
- Pro App-Start gibt es höchstens einen automatischen Versuch, der auch wirklich angezeigt wird.

## 5. Wieder aufrufen (AC10) **[Entscheidung]**

- In `nav-areas.ts` kommt ein Eintrag „Schnell-Hilfe“ dazu, mit dem Icon `help` (Material Symbols Outlined). Er erscheint in der Seite „Mehr“ und in der Sidebar-Gruppe „Mehr“, als letzter Eintrag der Gruppe mit Export.
- Ein Tipp navigiert zu `/bill/list` und startet die Tour, sobald die Startbedingung erfüllt ist. Der Schlüssel spielt dabei keine Rolle.
- Wie der Start transportiert wird (Query-Parameter wie `?tour=1`, analog `readLaunchIntent`, oder ein Service-Signal), entscheidet der Umsetzende. Ein Reload darf die Tour nicht erneut starten, der Parameter wird also nach dem Start entfernt (`replaceUrl`).

## 6. Technik

**[Technik]** Es gibt eine eigene, kleine Komponente und keine Tour-Bibliothek. Gängige Bibliotheken (driver.js, Shepherd) heben pro Schritt ein Element mit einer Box hervor. Variante C braucht aber mehrere Ziele mit Pfeilen gleichzeitig, und Hauptmenü und Untermenü sollen eigene Farben haben.

- **Ziele markieren:** Jedes erklärte Element bekommt ein Attribut `data-tour="<id>"`. Die IDs sind:
  - `tabs`, `main-nav`: die Leiste unten bzw. die Sidebar, und zwar die jeweils sichtbare.
  - `entry`, `camera`: die Eingabezeile bzw. der Kamera-Knopf, jeweils in der Variante, die gerade sichtbar ist. In der Liste gibt es mobil und am Desktop je einen Dock.
  - `bill-row`: die erste Zeile.
  - `tiles`, `tiles-other`.

  Die Tour sucht pro Bildschirm das erste **sichtbare** Element mit dieser ID, also mit Größe > 0 und im Viewport. Gibt es keins, entfällt dieser Hinweis (AC9).
- **Darstellung:**
  - Die Tour ist ein Vollbild-Overlay über dem CDK-Overlay-Container, damit sie auch über Sheet und Dialog der Schnellerfassung liegt.
  - Abgedunkelt wird mit einer SVG-Maske, in der die Ziel-Rechtecke ausgespart sind. Dazu kommt ein Rand in der Ebenenfarbe.
  - Texte und Pfeile werden aus den Rechtecken der Ziele berechnet (`getBoundingClientRect`). Als Pfeil dient eine Bézier-Kurve vom Text zur nächstliegenden Kante des Ziels.
  - Die Texte stehen auf der Seite des Ziels mit dem meisten Platz. Wie genau sie platziert werden, entscheidet der Umsetzende. Bedingung: Kein Text überlappt ein Ziel oder einen anderen Text bei 360–430 px Breite und am Desktop.
- **Mitgehen:** Bei `resize`, Drehen und Scrollen sowie nach dem Öffnen der Schnellerfassung (Animation abwarten) wird neu gemessen. Ein `ResizeObserver` bzw. eine Neuberechnung pro Frame bei Bedarf ist ausreichend.
- **Zurück-Taste:** Die Tour meldet sich wie Sheets und Dialoge beim bestehenden `OverlayBackService` an (`core/overlay`). Die Zurück-Taste schließt dann zuerst die Tour, also auch die von ihr geöffnete Schnellerfassung, und navigiert nicht weg.
- **Zugänglichkeit (AC11):**
  - `role="dialog"`, `aria-modal="true"`, `aria-labelledby` zeigt auf den Titel des Bildschirms (Menüs, Eintragen, Vorlagen; für Screenreader, optisch versteckt).
  - Der Fokus liegt auf dem Hauptknopf und bleibt in der Tour gefangen (`cdkTrapFocus`). Escape beendet die Tour.
  - Die Hinweise stehen im DOM in Lesereihenfolge.
  - Bei `prefers-reduced-motion` erscheinen sie ohne Einblenden oder Zeichnen der Pfeile. Sonst ist ein kurzes Einblenden (≤ 200 ms) erlaubt.
- **Ort im Code:** ein Ordner `src/app/core/tour/` mit diesen Teilen:
  - `TourService`: Zustand, Start und Ende, Speicherung.
  - `TourOverlayComponent`: Darstellung.
  - `tour-steps.ts`: Bildschirme, Ziele, Texte mobil und Desktop.
  - Eine reine Funktion für die Platzierung, damit sie testbar ist.

  Der Auslöser sitzt in der `bill-list`, dort wo heute `readLaunchIntent` ausgewertet wird.

## 7. Tests und Prüfung (AC12, AC13)

**Unit-Tests (Vitest über `ng test`, wie im Projekt üblich):**
- **Speicher:** Den Schlüssel lesen und setzen. Der Schlüssel wird schon beim Anzeigen gesetzt. Ein Fehler von `localStorage` führt zu keinem automatischen Start.
- **Startbedingungen:** Kein Start mit Launch-Intent, mit offenem Overlay oder vor dem ersten Laden. Start nach dem Laden. Start, nachdem ein Overlay auf der Liste geschlossen wurde. Kein zweiter Start.
- **Beenden:** Alle Wege schließen die Tour und die Schnellerfassung: Überspringen, Abschließen, Escape und Zurück-Taste.
- **Bildschirm 3:** Es wird nichts gespeichert. Ein vorhandener Entwurf bleibt unverändert, ohne vorhandenen Entwurf entsteht keiner.
- **Ziele:** Ein fehlendes Ziel lässt nur seinen Hinweis entfallen. Mobil und Desktop liefern die richtigen Texte (wischen/klicken, lang drücken/Rechtsklick).
- **Platzierung:** Für einige Rechtecke gibt es keine Überlappung, und alles bleibt im Viewport.
- **Schnell-Hilfe:** Der Eintrag erscheint in „Mehr“ und in der Sidebar und startet die Tour.

**Playwright (ui-verification), bei 390 × 844 und 1440 × 900:**
- Frisches Gerät, also `localStorage` leer: Die Tour erscheint, alle 3 Bildschirme werden durchlaufen und jeweils mit Screenshot festgehalten.
- Hauptmenü und Untermenü sind farblich unterschieden.
- Nach „Los geht’s“ ist die Liste ohne Sheet oder Dialog zu sehen, und es gibt keinen Entwurf.
- Ein Reload zeigt keine Tour, auch nicht nach einem Abbruch mitten in der Tour.
- „Überspringen“ auf Bildschirm 1 beendet die Tour. Ein Start über „Mehr → Schnell-Hilfe“ funktioniert.
- Mit leerer Liste fehlt der Hinweis zur Rechnungszeile. Mit `?quick=1` erscheint keine Tour.
- Die Konsole zeigt keine Fehler.

## 8. Dem Umsetzenden überlassen

- Die genaue Platzierung der Texte und die Form der Pfeile, im Rahmen von §6.
- Der Transport des Starts über „Schnell-Hilfe“ (§5).
- Der Mechanismus „kein Entwurf“ in Bildschirm 3 (§3).
- Feinschliff an den Texten (§3), nur kürzer.

## 9. Entscheidungen zur Prüfung durch den Nutzer

- „Einmal“ gilt pro Gerät (`localStorage`), nicht pro Benutzer im Backend (§4).
- Die Tour gilt schon beim Anzeigen als gesehen. Ein Reload mitten in der Tour bringt sie nicht zurück (§4).
- Die Tour startet auch, sobald ein Overlay auf der Liste geschlossen wird, etwa nach dem Speichern über den App-Shortcut. Sie wartet also nicht erst auf das nächste Öffnen der Liste (§4).
- Ohne `localStorage` erscheint keine automatische Tour (§4).
- Ein Tipp auf die abgedunkelte Fläche macht nichts. Zurück gibt es als Link ab Bildschirm 2 (§2).
- Bildschirm 3 öffnet die echte Schnellerfassung, ohne Spuren (§3).
- Der Eintrag „Schnell-Hilfe“ mit Icon `help` steht unter „Mehr“ nach Export (§5).
- Es gibt eine eigene Komponente statt einer Bibliothek (§6).
