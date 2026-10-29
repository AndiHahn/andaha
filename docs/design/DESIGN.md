---
name: Andaha MiniClient
description: Haushaltsbuch-App für Rechnungen, Haushaltsplan und Stundenaufzeichnungen – helles, warmes Papier mit Tintenblau.
colors:
  bg: "#F8F4EC"
  surface: "#FFFDF8"
  raised: "#EFE8DC"
  well: "#F0EADF"
  side: "#F1EBE1"
  active: "#ECE3D4"
  line: "#E0D8CA"
  line-row: "#EAE3D7"
  line-field: "#D6CDBD"
  fg: "#1E1913"
  fg2: "#3B332A"
  muted: "#685F52"
  faint: "#72685B"
  dim: "#A0968A"
  primary: "#2E4FA8"
  on-primary: "#FFFFFF"
  primary-soft: "#E3E9F8"
  primary-line: "#9DB0E0"
  primary-chip: "#24418F"
  secondary: "#B8692F"
  secondary-soft: "#F6E4D3"
  secondary-text: "#9A5220"
  positive: "#2E7443"
  positive-bg: "#DFEEDB"
  negative: "#B63A3A"
  negative-bg: "#F7DEDA"
  negative-line: "#E8C3BE"
  negative-bar: "#D27466"
  scrim: "rgba(40, 30, 18, .38)"
typography:
  amount:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  page-title-desktop:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  figure:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  row:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.35
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
  hint:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  tag: "6px"
  field: "10px"
  button: "12px"
  chip: "20px"
  sheet: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  topbar:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    typography: "{typography.title}"
    height: "56px"
  bottom-nav:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.faint}"
    height: "64px"
  bottom-nav-active:
    textColor: "{colors.fg}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.button}"
    height: "52px"
    padding: "0 20px"
  button-secondary:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.fg}"
    rounded: "{rounded.button}"
    height: "52px"
    padding: "0 20px"
  button-delete:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.negative}"
    rounded: "{rounded.button}"
    height: "52px"
    padding: "0 20px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.field}"
    height: "48px"
    padding: "0 12px 0 14px"
  chip:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg2}"
    rounded: "{rounded.chip}"
    height: "40px"
    padding: "0 14px"
  chip-selected:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-chip}"
  tag-open:
    backgroundColor: "{colors.secondary-soft}"
    textColor: "{colors.secondary-text}"
    rounded: "{rounded.tag}"
    height: "24px"
    padding: "0 8px"
  list-row:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    typography: "{typography.row}"
    padding: "12px 16px"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.sheet}"
  segmented:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.button}"
    height: "44px"
  segmented-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
---

# Andaha MiniClient – Design

Verbindliche Gestaltung für die Umsetzung des Redesigns. Zum Nachschlagen sind die HTML-Mockups unter `mockups/` die Referenz, die Screenshots unter `screenshots/` zeigen das Soll-Bild. Werte stehen maschinenlesbar oben im Frontmatter und als SCSS in `tokens/`.

## Overview

**Ein Haushaltsbuch auf warmem Papier.** Andaha wird überwiegend am Handy benutzt: Rechnung eintippen, Stunden erfassen, schnell nachsehen, wie viel diesen Monat ausgegeben wurde. Das Design ist ein ruhiges Werkzeug (Modus *Operate*): Die Aufgabe steht im Vordergrund, die Marke zeigt sich in Details.

Die Signatur kommt aus dem Kassabuch:
- **Beträge als Hauptdarsteller:** immer Tabellenziffern (`font-variant-numeric: tabular-nums`), rechtsbündig, Komma als Dezimaltrenner, Euro-Zeichen kleiner und leiser.
- **Haarlinien statt Karten:** Listen sind Zeilen mit 1-px-Trennlinien, keine Material-Cards mit Schatten.
- **Ein Akzent, sparsam:** Tintenblau nur für die Hauptaktion, die aktive Navigation, Auswahl und Fokus. Kupfer markiert ausschließlich „offen / ausstehend“.
- **Warm statt grau:** alle Neutraltöne sind leicht braun getönt; reines Weiß gibt es nur bei Belegfotos.

Mobile first (390 px Referenzbreite), ab 1024 px eine Desktop-Variante mit fester Sidebar und Tabs.

## Colors

| Rolle | Token | Wert | Verwendung |
|---|---|---|---|
| Grund | `bg` | #F8F4EC | App-Hintergrund, Kopf- und Navigationsleiste |
| Fläche | `surface` | #FFFDF8 | Eingabefelder, Bottom Sheets, Menüs, Segment aktiv |
| Erhöht | `raised` | #EFE8DC | Sekundär-Buttons, Icon-Kacheln |
| Mulde | `well` | #F0EADF | Upload-Fläche, Bildbereich |
| Aktiv | `active` | #ECE3D4 | aktiver Eintrag im Drawer/in der Sidebar |
| Linie | `line` | #E0D8CA | Trennung von Bereichen (unter Kopf, über Navigation, Abschnittsköpfe) |
| Zeilenlinie | `line-row` | #EAE3D7 | zwischen Listenzeilen |
| Feldrahmen | `line-field` | #D6CDBD | Rahmen von Feldern, Chips, Sekundär-Buttons |
| Text | `fg` | #1E1913 | Fließtext, Werte |
| Text leise | `muted` | #685F52 | Labels, Metadaten, Abschnittsköpfe (5,7:1) |
| Hinweis | `faint` | #72685B | Platzhalter, Hinweise, inaktive Navigation (4,8:1) |
| Deko | `dim` | #A0968A | Chevrons, Drag-Griff, Deaktiviertes – nie für lesbaren Text |
| Primär | `primary` | #2E4FA8 | Primär-Button, aktive Nav (Icon + 2-px-Strich), Fokus, Sync-Icon |
| Chip aktiv | `primary-soft` / `primary-line` / `primary-chip` | #E3E9F8 / #9DB0E0 / #24418F | ausgewählte Filter-Chips |
| Sekundär | `secondary-text` auf `secondary-soft` | #9A5220 auf #F6E4D3 | „Zahlung offen“, offene Stunden/Beträge, „ausstehend“ |
| Plus | `positive` | #2E7443 | Überschuss, „aktiv“, Anfrage annehmen |
| Minus | `negative` | #B63A3A | Löschen, Fehler, „abgelehnt“, Anfrage ablehnen |

**Kategorie-Farben** sind Nutzerdaten (`category.color`) und werden nur als 8-px-Punkt bzw. 20-px-Musterfeld gezeigt, nie als Flächenfüllung hinter Text. Musterfelder bekommen einen 1-px-Innenring (`rgba(0,0,0,.12)`), damit Weiß sichtbar bleibt.

**Akzent sparsam:** pro Screen genau ein gefüllter Primär-Button. Weitere Aktionen sind Sekundär (`raised`) oder Löschen (Outline in `negative`).

## Typography

Eine Familie: **Hanken Grotesk** (Google Fonts, 400/500/600/700). Sie ersetzt Roboto. Zahlen überall mit `tabular-nums`.

| Stil | Größe / Gewicht | Einsatz |
|---|---|---|
| amount | 44 / 600, -0.025em | Betrag in Detailansichten, Überschuss, Summe im Sheet |
| page-title-desktop | 28 / 600 | Seitentitel auf Desktop |
| heading | 26 / 600 | Shopname in Detailansicht |
| figure | 22–30 / 600 | Kennzahlen (Arbeitszeit netto, Stunden-Statistik) |
| title | 18 / 600 | Titel in Kopfzeile und Sheets |
| row | 16 / 500 | Hauptzeile in Listen, Buttons (600) |
| body | 15 / 400, Zeilenhöhe 1.5 | Notizen, Fließtext |
| label | 13 / 500, `muted` | Feld-Labels, Abschnittsköpfe, Metadaten |
| hint | 12 / 400, `faint` | Hinweise unter Feldern, Monatskürzel in Datumsspalte |

Euro-Zeichen: gleiche Zeile, kleiner (14 px bei Zeilenbeträgen, 22 px bei `amount`) und in `muted`.

Formate: Beträge `1.298,60 €`, Datum `28.10.2026`, Zeiten `48 h 30 min` (überall gleich, nie „48 h 30“), Uhrzeit `08:00 – 12:30` mit Halbgeviertstrich.

## Layout

**Mobile (bis 1023 px):**
- Kopfzeile 56 px: Menü-Icon (bzw. Zurück-Pfeil auf Detailseiten), Seitentitel, rechts optional Sync-Icon (nur wenn aktiv) und Konto-Button.
- Inhalt scrollt dazwischen; Seitenrand 16 px.
- Bereichsnavigation unten 64 px (wie heute pro Feature: Rechnungen, Analyse, Haushaltsplan, Stunden, Einstellungen). Icon 22 px + Label 12 px. Aktiv: Text `fg`, Icon `primary`, 28×2-px-Strich in `primary` an der Oberkante.
- **Aktionsleiste** direkt über der Bereichsnavigation (12 px Innenabstand, Linie oben): Primär-Button füllt die Breite; zwei Aktionen nebeneinander (`Abbrechen | Speichern`, `Bearbeiten | Löschen`), passen sie nicht, untereinander (Primär oben).
- Hauptnavigation als Drawer (304 px) von links mit Scrim.

**Desktop (ab 1024 px):**
- Sidebar 248 px fest sichtbar (`mat-sidenav mode="side" opened`), Hintergrund `side`, Rechtliches unten.
- Kopf: Seitentitel 28 px links, rechts Sync-Status, Benutzername und Konto-Button.
- Bereichsnavigation wird zu Tabs unter dem Titel (2-px-Unterstrich in `primary`).
- Inhalt max. 1120 px breit, 40 px Seitenrand. Listen dürfen zur Tabelle werden (Rechnungen: Datum | Shop | Kategorie | Herkunft | Preis).
- Aktionsleiste: Buttons nicht über die volle Breite, sondern rechtsbündig am Formularende.

**Abstände:** 4/8/12/16/20/24 px. Formularfelder 16 px untereinander, Label 6 px über dem Feld. Abschnittskopf 20 px oben, 8 px unten.

## Elevation & Depth

Flach. Tiefe entsteht durch Linien und Flächenhelligkeit, nicht durch Schatten.

Schatten nur bei Ebenen, die über dem Inhalt liegen:
- Bottom Sheet: `0 -12px 40px rgba(60,40,20,.18)`
- Menü-Popover: `0 0 0 1px #D6CDBD, 0 16px 40px -8px rgba(60,40,20,.22)`
- gezogenes Element (Drag & Drop): `0 10px 24px -8px rgba(60,40,20,.22)`
- aktives Segment: `0 1px 2px rgba(60,40,20,.14)`

Scrim hinter Sheets und Drawer: `rgba(40,30,18,.38)`.

## Shapes

- Felder 10 px, Buttons 12 px, Sheets 20 px (nur oben), Chips als Pill (Radius = Höhe/2), Tags 6 px, Musterfelder 6 px.
- Belegfotos/Thumbnails 4–6 px, leicht gedreht (±2°) nur in der Upload-Vorschau.
- Icons: Linien-Icons, 1,75 px Strich, 22 px (Navigation, Kopf), 20 px (Buttons, Felder), 15–16 px (in Zeilen und Chips). Umsetzung mit **Material Symbols Outlined, Gewicht 300, FILL 0** (siehe `umsetzung.md`). Keine Emoji, keine gefüllten Icons.

## Components

**Listenzeile:** min. 60 px (zweizeilige Rechnungszeile 64 px), Padding 12×16, Linie unten `line-row`. Links optional Datumsspalte (34 px: Tag 17/600, Monatskürzel 12 `muted`), Mitte Titel (16/500, einzeilig mit Ellipsis) und Metazeile (13 `muted`: Kategoriepunkt · Kategorie · Unterkategorie, danach 15-px-Icons für „aus Analyse“ / „verbunden“), rechts Betrag (16/600, rechtsbündig). Ganze Zeile ist der Link.

**Abschnittskopf:** 13/600 `muted`, Linie unten `line`. Gruppiert Listen (z. B. Fixkosten nach Kategorie).

**Wertezeile (Key–Value):** Label links `muted` 15, Wert rechts 15/500–600. Für Detailansichten im Lesemodus und Summenlisten.

**Feld:** Label über dem Feld (13/500 `muted`), Feld 48 px, `surface`, Rahmen `line-field`, Radius 10. Fokus: Rahmen `primary` + 3-px-Ring `rgba(46,79,168,.2)`. Suffix (€, h) rechts in `muted`. Select: gleiches Feld mit Chevron. Datum: Kalender-Icon rechts. Fehler: Rahmen `negative`, Text 12 px `negative` darunter. Hinweis 12 px `faint` darunter.

**Buttons:** 52 px hoch, 16/600, Icon 20 px links vom Text.
- Primär: `primary` / Weiß.
- Sekundär: `raised` mit 1-px-Innenrand `line-field`.
- Löschen: transparent, Text und Innenrand `negative` / `negative-line`. Icon-only (52×52) mit `aria-label`, wenn Platz knapp ist.
- Speichern läuft: Button deaktiviert, Spinner (18 px) statt Icon, Text „Speichert …“.

**Chips (Kategoriefilter):** 40 px, Pill, Rahmen `line-field`, Text 14/500 `fg2`; ausgewählt: `primary-soft` / `primary-line` / `primary-chip` mit Häkchen. Eine Zeile, horizontal scrollbar. Datumsfilter-Chip: `surface`, Text „Von 01.10.2026“ + 32-px-Entfernen-Button.

**Tag „Zahlung offen“:** 24 px, `secondary-soft` / `secondary-text`, 12/600, Uhr-Icon 14 px.

**Status-Text:** Punkt (7 px) + 13/600 in `positive` („aktiv“), `secondary-text` („ausstehend“), `negative` („abgelehnt“).

**Segment (Datumstyp):** 4 Optionen Monat | Jahr | Gesamt | Von – Bis, Container `surface` mit Rahmen, aktives Segment heller mit kleinem Schatten, 14/500.

**Ringdiagramm (Ausgaben):** Donut, Strichstärke 10 % des Durchmessers, 3-px-Lücken zwischen Segmenten, Summe in der Mitte (24/600, Label „Summe“ 12 `muted`). Darunter Legende als Zeilen: Punkt, Kategorie, Anteil in % (`muted`), Betrag, Chevron; Tipp öffnet die Kategorie-Details.

**Kennzahl-Zeile (Person):** dreispaltiges Raster Gesamt | Bezahlt | Offen mit senkrechten Haarlinien; Wert 18/600, „Offen“ in `secondary-text`.

**Bottom Sheet (alle bisherigen Vollbild-Dialoge auf Mobile):** `surface`, Radius 20 oben, Griff 36×4 `grab`, Titel 18/600 links, Schließen-Icon rechts, Inhalt 16 px Rand, Primär-Button unten. Auf Desktop als zentrierter Dialog (max. 480 px, Radius 16).

**Drawer:** 304 px, `surface`. Kopf: „Andaha“ 24/700, darunter Benutzername 14 `muted` + Sync-Icon. Einträge 52 px, Icon + Text 15/500; aktiv `active` + Icon `primary`. Unten Links AGB · Datenschutzerklärung · Benutzerdaten (13, unterstrichen, `muted`).

**Leer- und Ladezustände:** Leertext 14 `faint`, 16 px eingerückt, direkt im Abschnitt („Keine Ausgaben.“). Laden: 3-px-Fortschrittsbalken unter der Kopfzeile nur beim initialen Laden von Listen; beim Speichern im Button.

## Do's and Don'ts

**Do**
- Beträge immer mit Tabellenziffern und rechtsbündig.
- Pro Screen genau eine gefüllte Primäraktion.
- Linien statt Karten; Abschnittsköpfe statt Container.
- Texte in der Produktsprache übernehmen (Labels, Meldungen bleiben wie im Code).
- Touch-Ziele mindestens 44 × 44 px; sichtbarer Fokus mit Ring.

**Don't**
- Keine Material-Cards mit Schatten für Listeneinträge, keine verschachtelten Container.
- Kein Pink/Material-Default-Blau; kein reines Schwarz oder Weiß als Fläche.
- Kupfer nicht als Button-Füllung (zu wenig Kontrast mit Weiß); Kupfer nur für „offen/ausstehend“.
- Kategoriefarben nicht als Hintergrund hinter Text (bisherige farbige Chips entfallen).
- Keine Vollbreiten-Buttons mit Radius 0 und keine gestapelten Vollbild-Buttons (`floating-button`) mehr.
- Keine Funktion entfernen oder hinzufügen; nur Darstellung ändern.
