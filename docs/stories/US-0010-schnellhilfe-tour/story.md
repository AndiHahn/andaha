# US-0010: Schnell-Hilfe – geführte Tour durch die neue Bedienung

| Field | Value |
|-------|-------|
| ID | US-0010 |
| Status | In Progress <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-07 |
| Design Doc | [design.md](./design.md) |
| Plan | [plan.md](./plan.md) |

## Description

Als Nutzer:in, die die alte MiniClient-App gut kennt, möchte ich nach dem Update eine kurze geführte Tour sehen. Danach kann ich sofort wieder Rechnungen eintragen und finde mich in der neuen Menüführung zurecht.

Mit US-0007 bis US-0009 hat sich die Bedienung stark geändert:
- Die Leiste unten ersetzt das ☰-Menü.
- Tabs wechselt man per Wischen.
- Neue Rechnungen trägt man über die Eingabezeile mit Vorlagen ein.
- Fotos werden automatisch als Rechnung angelegt, Unklares landet unter „Scans“.
- Ein langer Druck auf eine Rechnung öffnet ein Menü.

Neue Benutzer:innen sehen dieselbe Tour.

Die Tour zeigt mit Pfeilen und kurzen Texten direkt auf die echte App (Variante C aus dem Brainstorming). Hauptmenü und Untermenü sind farblich klar unterschieden.

## Acceptance Criteria

**Ablauf**

- [ ] AC1: Die Tour erscheint auf jedem Gerät einmal von selbst, wenn die Rechnungsliste zum ersten Mal zu sehen ist. Sie gilt schon beim Anzeigen als gesehen und erscheint auf diesem Gerät danach nicht mehr von selbst, auch nicht nach einem Reload mitten in der Tour.
- [ ] AC2: Ist auf der Liste schon etwas offen (Schnellerfassung über App-Shortcut, Share Target, Sheet, Dialog), wartet die Tour, bis die Liste ohne Overlay zu sehen ist. Das kann auch direkt nach dem Schließen dieses Overlays sein.
- [ ] AC3: Die Tour hat 3 Bildschirme mit „Weiter“, „Zurück“ (ab Bildschirm 2) und „Überspringen“. Der letzte Knopf heißt „Los geht’s“. Überspringen, Abschließen, Escape und die Zurück-Taste bzw. -Geste beenden die Tour.
- [ ] AC4: Die Tour verändert keine Daten. Die Schnellerfassung, die Bildschirm 3 öffnet, schließt am Ende wieder, ohne zu speichern und ohne Entwurf.

**Inhalt**

- [ ] AC5: Bildschirm 1 „Menüs“ hebt das Hauptmenü (Leiste unten bzw. Sidebar) in Kupfer und das Untermenü (Tabs) in Blau hervor. Beide sind beschriftet, und je ein Pfeil zeigt von der Beschriftung auf das Element. Der Hinweis auf „Mehr“ nennt Kategorien, Vorlagen und Export. Mobil zeigt ein Hinweis das Wischen zwischen Tabs.
- [ ] AC6: Bildschirm 2 „Eintragen“ hebt Eingabezeile, Kamera-Knopf und eine Rechnungszeile hervor:
  - Eingabezeile: „Betrag tippen, Vorlage wählen, fertig“.
  - Kamera: „Eindeutige Fotos werden automatisch angelegt, Unklares unter Scans“.
  - Rechnungszeile: „Lang drücken: Duplizieren oder Löschen“, am Desktop „Rechtsklick“.
- [ ] AC7: Bildschirm 3 „Vorlagen“ öffnet die Schnellerfassung im Hintergrund und zeigt auf die Kacheln. Erklärt werden Vorlagen, das Anheften eines Vorschlags per langem Druck und die Verwaltung unter „Mehr → Vorlagen“. Ohne Kacheln zeigt der Text, dass hier künftig Vorlagen und Vorschläge erscheinen.
- [ ] AC8: Am Desktop (≥ 1024 px) zeigen die Pfeile auf die Sidebar und die Tabs unter dem Titel. Der Wisch-Hinweis entfällt, beim Untermenü steht „zum Wechseln klicken“. Statt „lang drücken“ steht „Rechtsklick“.
- [ ] AC9: Fehlt ein Ziel-Element, entfällt nur dessen Hinweis, und die Tour läuft weiter. Bei Größenänderung oder Drehen sitzen die Pfeile wieder richtig.

**Wieder aufrufen**

- [ ] AC10: Unter „Mehr“ (mobil) und in der Sidebar-Gruppe „Mehr“ (Desktop) gibt es den Eintrag „Schnell-Hilfe“. Er öffnet die Rechnungsliste und startet die Tour.

**Qualität**

- [ ] AC11: Die Tour ist zugänglich:
  - Sie ist als Dialog ausgezeichnet, der Fokus liegt auf dem Hauptknopf, und alle Texte sind für Screenreader in Reihenfolge lesbar.
  - Touch-Ziele sind ≥ 44 px, Kontraste nach `DESIGN.md`.
  - Bei `prefers-reduced-motion` gibt es keine Animation.
- [ ] AC12: Frontend-Tests decken ab: Speicherung „gesehen“, Startbedingungen, alle Wege zum Beenden, fehlende Ziele, Desktop- und Mobil-Texte, kein Speichern bzw. kein Entwurf in Bildschirm 3, und den Eintrag „Schnell-Hilfe“. Build und Tests sind grün.
- [ ] AC13: Die UI-Prüfung mit Playwright bei 390 px und 1440 px ist grün. Geprüft werden alle 3 Bildschirme, das Überspringen und der Neustart über „Mehr“.

## Technical Notes

- Nur Frontend (`src/WebApps/MiniClient/Andaha.WebApps.MiniClient`), das Backend bleibt unverändert. „Gesehen“ steht pro Gerät in `localStorage`.
- Betroffen:
  - Rechnungsliste (`bill-list`), Eingabezeile (`quick-entry-dock`), `quick-entry.service` und die Kacheln (`quick-tiles`).
  - Hauptleiste (`bottom-bar`), Tabs (`area-tabs`), Sidebar (`app.component.html`), Seite „Mehr“ (`more-page`, `nav-areas.ts`).
  - Das Verhalten der Zurück-Taste (`core/overlay`).
- Mockups aus dem Brainstorming: `.superpowers/brainstorm/537-1794038250/content/tour-stil-v2.html`, Variante C.

## Out of Scope

- Speicherung „gesehen“ im Backend bzw. geräteübergreifend
- Eigene Touren für Haushalt, Stunden oder Einstellungen
- Ein Changelog bzw. „Was ist neu“ für künftige Updates
- Mehrsprachigkeit

## UI Verification

2026-11-07: **PASSED** (Playwright MCP, 390 × 844 and 1440 × 900, local Monolith with LocalDB and the Angular dev server, Chromium). Screenshots are in [`ui-testing/`](./ui-testing/).

- **Auto-start:** With the „gesehen“ flag removed, the tour starts once the list has loaded. It is a dialog (`role="dialog"`, `aria-modal`, titled per screen), with focus on „Weiter“. All buttons are 44 px high.
- **Screen 1 „Menüs“:** Hauptmenü is copper (#B8692F), Untermenü is blue (#2E4FA8).
  - Mobile shows the swipe hint (`m-1-menus.png`).
  - Desktop shows the sidebar and the copy „zum Wechseln klicken“, without the swipe hint (`d-1-menus.png`).
- **Screen 2 „Eintragen“:** The entry line, camera and bill-row notes are shown. Mobile says „Lang drücken“, desktop says „Rechtsklick“ (`m-2-eintragen.png`, `d-2-eintragen.png`).
- **Screen 3 „Vorlagen“:** The quick entry opens behind the tour (sheet on mobile, dialog on desktop), with notes on the tiles, „Andere …“ and „Verwalten unter Mehr → Vorlagen“ (`m-3-vorlagen.png`, `d-3-vorlagen.png`).
  - Tab keeps focus inside the tour.
  - A quick Zurück → Weiter reopens the quick entry.
- **Ending the tour:** „Los geht’s“, Überspringen, Escape and Back on screen 3 (one step back closes the tour and the quick entry; the app stays on `/bill/list`) each end the tour. Afterwards no overlay is left and no draft key exists (`m-4-done.png`, `d-4-done.png`).
- **Reload:** A reload after finishing, and a reload in the middle of screen 2, show no tour again.
- **Restart:** Restarting via „Mehr → Schnell-Hilfe“ on mobile navigates to the list and starts the tour (`m-5-entry.png`, `m-5-restart.png`). The desktop sidebar entry starts it on the open list without navigation.
- **`?quick=1`:** There is no tour while the quick entry is open. It starts after the quick entry closes (AC2).
- **Resize:** Resizing 1440 → 1000 → 1440 px during screen 1 puts the holes exactly on the sidebar and tabs again (`d-6-resized.png`).
- **Console:** 0 errors, 0 warnings.
- **Fixed during verification:** Over a real, full list, white note text on the veil alone was hard to read, because the list text showed through. Notes now get a soft dark backing with no hard edge, in the colour of the top chips.
- **Not covered:**
  - The empty-list case was not reachable with the test data; unit tests cover it.
  - iOS/WebKit rendering of the veil needs a real device, because Playwright ran in Chromium only.

## AI Usage

See [ai-usage.md](./ai-usage.md).
