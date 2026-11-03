# Andaha MiniClient – Design v2: Navigation und Schnellerfassung

Stand: 2026-11-03. Ergebnis der Abstimmung zu `docs/review.md`, Abschnitte 1 (Navigation) und 2 (Rechnung erfassen). v2 baut auf dem Designsystem aus v1 auf (`docs/design/DESIGN.md`, Palette „Tinte & Kupfer“): Farben, Schrift, Abstände und Bausteine bleiben, neu sind Navigation und der Ablauf zum Erfassen.

**Ausgangslage:** In 97 % der Fälle öffnet man die App nur, um eine Rechnung einzutragen. Alles in v2 richtet sich danach, dass das mit möglichst wenig Tipps geht.

## Inhalt

| Datei | Inhalt |
|---|---|
| [`mockups/01-navigation.html`](mockups/01-navigation.html) | Hauptleiste, Tabs je Bereich, Eingabezeile, Seite „Mehr“ |
| [`mockups/02-schnellerfassung.html`](mockups/02-schnellerfassung.html) | Ablauf a–d (frisch, Bäcker, Wocheneinkauf, Andere) und Sonderfälle e–g (Duplikat, gespeichert, Entwurf) |
| [`mockups/03-vorlagen.html`](mockups/03-vorlagen.html) | Vorschlag anheften, Vorlagen verwalten, Vorlage bearbeiten (Shop beim Erfassen / fester Shop) |
| [`mockups/04-shortcut-desktop.html`](mockups/04-shortcut-desktop.html) | App-Shortcut am Homescreen, Desktop mit Sidebar und Dialog |
| [`screenshots/`](screenshots/) | Gerenderte Soll-Bilder der vier Mockups (Handy 390 × 844, Desktop 1440 × 900) |
| [`varianten/`](varianten/) | Verworfene und frühere Entwürfe aus der Abstimmung, nur zum Nachvollziehen |

Die Mockups sind statisches HTML, Markup und CSS dienen als Vorlage. Beispieldaten sind erfunden.

## Entscheidungen

### Navigation
- **Hauptleiste unten** mit 4 Bereichen: **Rechnungen · Haushalt · Stunden · Mehr**. Der Drawer (Hamburger) entfällt, jeder Bereich ist mit einem Tipp erreichbar.
- **Mehr** enthält: Kategorien, Vorlagen, Verbindungen, Export, darunter AGB · Datenschutzerklärung · Benutzerdaten. Neue Bereiche kommen künftig hierher, die Leiste bleibt bei 4.
- **Analyse ist kein eigener Bereich mehr**, sondern ein Tab unter Rechnungen.
- **Unterseiten als Tabs oben**, Wechsel per Tipp oder Wischen:
  - Rechnungen: Liste | Analyse | Statistik
  - Haushalt: Übersicht | Fixkosten | Einkommen
  - Stunden: Personen | Statistik
- „Hinzufügen“ ist kein Tab mehr. Die bisherigen Hinzufügen-Seiten bleiben als eigene Seiten (Zurück-Pfeil), siehe offene Punkte für Haushalt/Stunden.

### Rechnung erfassen (Variante C aus `varianten/01`)
- Auf **Rechnungen → Liste** sitzt über der Hauptleiste fest eine **Eingabezeile** „Neue Rechnung: Betrag“ mit einem **Kamera-Knopf** daneben. Mehr Einstiege gibt es nicht.
- Tipp in die Eingabezeile öffnet das **Schnell-Sheet** mit eigener Zifferntastatur: Betrag, Kacheln (Vorlagen und Vorschläge), Datum, Speichern.
- **„Alle Felder“** öffnet das bisherige große Formular mit allem schon Eingegebenen (Notizen, Foto, beliebiges Datum).
- Kamera-Knopf → Foto → Analyse → vorbefülltes Formular. Gestaltet wird das in einem eigenen Schritt („Rechnung scannen“); in v2 ist nur der Knopf vorgesehen.

### Vorlagen
- Eine Vorlage hat **Kategorie**, optional **Unterkategorie**, optional einen **Namen** und einen Shop, der entweder **fest** ist (Bäcker) oder **beim Erfassen gewählt** wird (Wocheneinkauf, Tanken).
- Bei „beim Erfassen wählen“ ist der **häufigste Shop dieser Kategorie vorausgewählt**.
- Angeheftete Vorlagen stehen im Sheet zuerst, danach automatische **Vorschläge** aus den häufigsten Kombinationen Shop + Kategorie + Unterkategorie.
- Anlegen auf drei Wegen: langer Druck auf einen Vorschlag („Als Vorlage anheften“ / „Nicht mehr vorschlagen“), Schalter „Als Vorlage merken“ unter „Andere …“, oder Mehr → Vorlagen → „Vorlage hinzufügen“.
- Verwalten unter Mehr → Vorlagen: sortieren per Griff, Tipp öffnet Bearbeiten (inkl. Löschen), darunter Vorschläge mit „Anheften“.
- Vorlagen stehen nur im Sheet, nicht zusätzlich als Chips auf der Startseite (`varianten/02`, Bild 2, verworfen).

### Rückmeldung und Sonderfälle
- Nach dem Speichern: Sheet schließt, neue Zeile ist kurz hervorgehoben, **Snackbar „Gespeichert · Shop Betrag“ ohne Rückgängig**, kurzes Vibrieren.
- **Duplikat-Hinweis**, wenn es am selben Tag schon einen Eintrag mit gleicher Vorlage bzw. gleichem Shop, gleicher Kategorie und gleichem Betrag gibt. Speichern bleibt möglich („Trotzdem speichern“).
- **Entwurf behalten:** Wird das Sheet geschlossen oder zugewischt, bleiben Betrag und Auswahl erhalten und sind beim nächsten Öffnen wieder da („Entwurf wiederhergestellt · Verwerfen“). Kein „Wirklich verwerfen?“-Dialog.
- **App-Shortcut** im Manifest: langer Druck auf das App-Icon → „Rechnung eintragen“ öffnet direkt das Sheet.

### Bewusst nicht im Umfang
- Offline speichern mit Warteschlange: Erfasst wird meist zu Hause mit Netz.
- Vorlagen-Chips auf der Startseite.
- Rückgängig nach dem Speichern.
- „Rechnung scannen“ als Ablauf (eigener Schritt), Statistik-Erweiterungen, Haushaltsplan-Themen aus der Review.

## Komponenten (Ergänzungen zu DESIGN.md)

Alle Werte nutzen die Tokens aus `docs/design/DESIGN.md`. Bei der Umsetzung den Abschnitt „Layout → Mobile“ dort anpassen (Drawer und Bereichsnavigation je Feature entfallen).

**Kopfzeile (Mobile):** 56 px, Titel links mit 16 px Rand, rechts Sync-Icon (nur wenn aktiv) und Konto-Button. Kein Menü-Icon mehr. Detailseiten: Zurück-Pfeil links, keine Tabs.

**Hauptleiste:** wie die bisherige Bereichsnavigation (64 px, Icon 22 + Label 12, aktiv: Text `fg`, Icon `primary`, 28×2-px-Strich oben). Icons wie in v1: Rechnungen (Beleg), Haushalt (Geldbörse), Stunden (Personen), Mehr (drei Punkte). Sichtbar auf allen Hauptseiten der vier Bereiche; auf Detail- und Formularseiten bleibt sie sichtbar, im offenen Sheet liegt sie unter dem Scrim bzw. der Tastatur.

**Tabs:** 46 px hoch, gleich breit verteilt, Text 15/500 `muted`, aktiv 15/600 `fg` mit 2-px-Unterstrich `primary` (16 px eingerückt), Linie `line` unten. Zähler-Badge 20 px, `secondary-soft` / `secondary-text`, 12/600 (z. B. Analyse: Anzahl unbearbeiteter Analysen).

**Eingabezeile (Dock):** Leiste über der Hauptleiste, `bg`, Linie oben, Innenabstand 10/16/12. Feld 52 px (Radius 12, Plus-Icon `primary`, Platzhalter „Neue Rechnung: Betrag“, Suffix €). Daneben Kamera-Knopf 52×52, `raised` mit Innenrand `line-field`, Icon `primary`. Nur auf Rechnungen → Liste.

**Schnell-Sheet:** Bottom Sheet nach DESIGN.md (surface, Radius 20, Griff, Titel „Neue Rechnung“, Schließen). Inhalt mit 12 px Abstand:
- Betrag im Stil `amount` (44/600), Platzhalter „0,00“ in `dim`, Cursor 2 px `primary`.
- Kacheln im 2-Spalten-Raster, 8 px Abstand. Kachel 56 px min., Radius 12, `surface`, Rahmen `line-field`; Titel 15/600 (Name oder Shop), Zeile darunter 12 `muted` mit Kategoriepunkt 7 px: „Kategorie · Unterkategorie“ bzw. „Kategorie · Shop wählen“. Angeheftet: Lesezeichen-Icon 14 px `primary` oben rechts. Ausgewählt: `primary-soft` / `primary-line`, Titel `primary-chip`. Semantik: `radiogroup`.
- „Andere …“: volle Breite, 44 px, gestrichelter Rahmen, Plus-Icon.
- Shop-Auswahl (nur bei Vorlagen ohne festen Shop): Fläche `well`, Radius 12, Label „Shop“ + Hinweis „häufigste zuerst“, Chips 36 px (Filter-Chip-Stil), erster vorausgewählt, letzter „Anderer …“.
- Datumszeile: Kalender-Icon, „Heute, 03.11.2026“, rechts Link „Alle Felder“ (`primary`, 600). Tipp auf das Datum: Heute · Gestern · Datum wählen.
- Speichern: Primär-Button, volle Breite. Gesperrt (Deckkraft .45), solange Betrag oder Vorlage/Shop fehlt; darunter Hinweis 12 `faint` „Betrag eingeben und Vorlage wählen“.

**Zifferntastatur (eigene):** Fläche `#DCD5C9`, Tasten 46 px, `surface`, Radius 8, 22/500, Raster 3 Spalten, 6 px Abstand. Tasten 1–9, Komma, 0, Löschen (Icon). Sichtbar, solange der Betrag aktiv ist; sobald Betrag und Vorlage gewählt sind, klappt sie ein (Tipp auf den Betrag öffnet sie wieder). Keine Systemtastatur für den Betrag.

**Duplikat-Hinweis:** Fläche `secondary-soft`, Text `secondary-text` 13, Radius 10, Icon 18 px; Titel 600 „Heute schon eingetragen“, darunter Shop · Betrag · Uhrzeit. Button-Text wechselt auf „Trotzdem speichern“. `role="status"`.

**Entwurf-Zeile:** 13 `muted`, Stift-Icon `primary`, rechts Link „Verwerfen“.

**Snackbar:** unten über dem Dock, 12 px Rand, min. 48 px, Radius 12, Fläche `fg`, Text `bg` 15/500, Häkchen-Icon in hellem Grün. 4 s sichtbar, `aria-live="polite"`. Kein Aktions-Button.

**Hervorgehobene neue Zeile:** Listenzeile mit `primary-soft` als Hintergrund, blendet nach ca. 2 s aus.

**Mehr-Seite:** Abschnittsköpfe (13/600 `muted`), Zeilen 56 px mit Icon 22 `muted`, Text 16/500, rechts optional Zähler 14 `muted` und Chevron `dim`. Rechtliches als unterstrichene Links 13 `muted` darunter.

**Vorlagen-Liste:** Abschnitt „Angeheftet“ mit Griff (36×44, `dim`) links, Chevron rechts. Abschnitt „Vorschläge“ mit Häufigkeit („5×“, 13 `muted`) und Sekundär-Button klein (36 px, Radius 10) „Anheften“. Unten Aktionsleiste mit Sekundär-Button „Vorlage hinzufügen“.

**Vorlage bearbeiten:** Felder Name (Hinweis „Leer lassen = Shopname“), Shop als Segment „Fester Shop | Beim Erfassen wählen“ (44 px, wie Datumstyp-Segment), bei festem Shop zusätzlich Feld Shopname, Kategorie, Unterkategorie. Aktionsleiste: Löschen icon-only links, Speichern primär.

**Kontextmenü (langer Druck auf Vorschlag):** Popover nach DESIGN.md (Menü-Popover-Schatten), Kopf mit „Vorschlag“ und Kombination, Einträge 48 px: „Als Vorlage anheften“, „Nicht mehr vorschlagen“.

**Desktop (ab 1024 px):** Sidebar wie v1 mit Rechnungen, Haushalt, Stunden, darunter Gruppe „Mehr“ (Kategorien, Vorlagen, Verbindungen, Export), Rechtliches unten. Tabs unter dem Titel wie v1. Eingabezeile steht über der Tabelle neben „Scannen“ und der Suche. Die Schnellerfassung öffnet als zentrierter Dialog (480 px, Radius 16), Betrag als großes Eingabefeld mit normaler Tastatur, keine eigene Zifferntastatur; Aktionen „Abbrechen | Speichern“ rechtsbündig.

## Verhalten

- **Wischen zwischen Tabs:** nur bei klar waagrechter Geste (> 60 px, Winkel < 30°). Startet nicht in den äußeren 24 px des Bildschirms (System-Zurück-Geste), nicht auf Chip-Streifen, Fotos/Pinch-Zoom, Datepickern, Formularen, Sheets und Dialogen. Slide-Animation ca. 200 ms ease-out; bei `prefers-reduced-motion` ohne Animation.
- **Android-Zurück:** schließt zuerst ein offenes Sheet, Dialog oder Kontextmenü, erst dann Navigation zurück.
- **Sheet:** per Wischen nach unten schließbar (Griff ist funktional). Schließen behält den Entwurf.
- **Kacheln:** höchstens 6 Kacheln plus „Andere …“. Reihenfolge: angeheftete Vorlagen in eigener Sortierung, dann Vorschläge nach Häufigkeit. Vorschläge, die eine Vorlage schon abdeckt (gleiche Kategorie/Unterkategorie und Shop fest oder Shop-Auswahl in derselben Kategorie), werden ausgeblendet. Ausgeblendete Vorschläge („Nicht mehr vorschlagen“) erscheinen nicht mehr.
- **Reihenfolge der Eingabe ist frei:** zuerst Betrag oder zuerst Kachel.
- **Betragseingabe:** Komma als Dezimaltrenner, höchstens 2 Nachkommastellen, Betrag > 0.
- **Datum:** Standard heute.
- **Shop-Vorauswahl:** häufigster Shop in der Kategorie der Vorlage, berechnet aus den eigenen Rechnungen.
- **App-Shortcut:** öffnet die App auf Rechnungen → Liste mit offenem Sheet.

## Backend-Bedarf (Einschätzung)

- **Vorlagen:** neue Tabelle und Endpoints: lesen, anlegen, ändern, löschen, Reihenfolge setzen. Felder etwa: Name (optional), ShopName (leer = beim Erfassen wählen), CategoryId, SubCategoryId (optional), SortOrder.
- **Vorschläge:** Endpoint mit den häufigsten Kombinationen Shop + Kategorie + Unterkategorie der letzten 90 Tage inkl. Anzahl, ohne ausgeblendete. Speicher für ausgeblendete Vorschläge.
- **Häufigste Shops je Kategorie:** für die Shop-Auswahl.
- **Duplikat-Prüfung:** über die vorhandene Rechnungsliste mit Datumsfilter oder einen kleinen eigenen Endpoint, das entscheidet die Umsetzung.
- `CreateBill` bleibt unverändert: `ShopName` ist Pflicht, daher hat jede Kachel bzw. Shop-Auswahl immer einen Shop.

## Offene Punkte

- **Hinzufügen in Haushalt und Stunden:** In der Abstimmung war „Hinzufügen als FAB“ gesetzt, gezeichnet ist es noch nicht. Vorschlag: FAB rechts unten auf Fixkosten, Einkommen und Personen, öffnet die bestehenden Anlege-Seiten.
- **Vorschläge aus verbundenen Konten:** Annahme, dass nur eigene Rechnungen zählen.
- **Analyse-Badge:** welche Analysen zählen (z. B. noch nicht übernommene).

## Vorgeschlagene Stories

1. **Navigation:** Hauptleiste, Tabs mit Wischen, Mehr-Seite, Android-Zurück für Sheets, Desktop-Sidebar angepasst.
2. **Schnellerfassung mit Vorlagen:** Eingabezeile, Schnell-Sheet mit eigener Zifferntastatur, Vorlagen und Vorschläge (Backend), Vorlagen-Verwaltung, Snackbar, Vibrieren, Duplikat-Hinweis, Entwurf, App-Shortcut.
3. Danach: „Rechnung scannen“ über den Kamera-Knopf.
