# US-0007: Neue Navigation, Schnellerfassung mit Vorlagen und Rechnung scannen

| Field | Value |
|-------|-------|
| ID | US-0007 |
| Status | In Review <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-03 |
| Design Doc | [design.md](./design.md) |

## Description

Als Nutzer:in der MiniClient-PWA am Handy möchte ich die App öffnen, eine Rechnung mit wenigen Tipps eintragen und fertig sein. In 97 % der Fälle ist das der einzige Grund, die App zu öffnen. Dafür bekommt die App eine neue Navigation, eine Schnellerfassung mit Vorlagen und einen Scan-Ablauf. Die Analyse wird Teil der Rechnungen.

Grundlage:
- UI-Design v2: [`docs/design/v2/README.md`](../../design/v2/README.md), Mockups und Screenshots unter `docs/design/v2/`. Das Design ist mit dem Nutzer abgestimmt und verbindlich.
- Review: [`docs/review.md`](../../review.md), Abschnitte 1 (Navigation), 2 (Rechnung erfassen), 4 (Analyse) sowie aus 8 App-Shortcuts, Share Target und haptisches Feedback.

Setzt US-0006 (Angular 22) voraus.

## Acceptance Criteria

**Navigation (Review 1, Design v2 `01-navigation`)**

- [x] AC1: Unten gibt es eine Leiste mit **Rechnungen · Haushalt · Stunden · Mehr**. Der Drawer entfällt, jeder Bereich ist mit einem Tipp erreichbar. Die Kopfzeile hat kein Menü-Icon mehr.
- [x] AC2: „Mehr“ zeigt Kategorien, Vorlagen, Verbindungen, Export und darunter AGB · Datenschutzerklärung · Benutzerdaten.
- [x] AC3: Unterseiten sind Tabs oben: Rechnungen = Liste | Analyse | Statistik, Haushalt = Übersicht | Fixkosten | Einkommen, Stunden = Personen | Statistik. Der Analyse-Tab zeigt die Zahl offener Analysen als Badge. Jeder Tab hat eine eigene URL (Deep Link, Reload, Zurück funktionieren).
- [x] AC4: Wischen nach links/rechts wechselt den Tab mit Slide-Animation. Es löst nur bei klar waagrechter Geste aus (> 60 px, Winkel < 30°) und nicht in den äußeren 24 px am Rand. Nicht auf Chip-Streifen, Fotos/Pinch-Zoom, Datepickern, Formularen, Sheets und Dialogen. Bei `prefers-reduced-motion` gibt es keine Animation.
- [x] AC5: „Hinzufügen“ ist kein Tab mehr. Fixkosten, Einkommen und Personen haben einen FAB rechts unten, der die bestehende Anlege-Seite öffnet.
- [x] AC6: Bottom Sheets lassen sich am Griff nach unten wegwischen. Die Android-Zurück-Taste und die Zurück-Geste schließen zuerst ein offenes Sheet, einen Dialog oder ein Menü, erst dann wird zurücknavigiert.
- [x] AC7: Ab 1024 px gibt es statt der Leiste die Sidebar (Rechnungen, Haushalt, Stunden, Gruppe „Mehr“, Rechtliches unten) und Tabs unter dem Titel, wie in `04-shortcut-desktop`.

**Schnellerfassung (Design v2 `02-schnellerfassung`)**

- [x] AC8: Auf Rechnungen → Liste steht über der Leiste die Eingabezeile „Neue Rechnung: Betrag“ mit einem Kamera-Knopf daneben.
- [x] AC9: Ein Tipp in die Eingabezeile öffnet das Schnell-Sheet mit eigener Zifferntastatur. Die Systemtastatur erscheint nicht. Der Betrag wird mit Komma eingegeben, höchstens 2 Nachkommastellen, Wert > 0.
- [x] AC10: Das Sheet zeigt höchstens 6 Kacheln plus „Andere …“: zuerst angeheftete Vorlagen in ihrer Reihenfolge, dann Vorschläge (häufigste Kombinationen Shop + Kategorie + Unterkategorie der letzten 90 Tage, nur eigene Rechnungen). Vorschläge, die eine Vorlage abdeckt oder die ausgeblendet wurden, erscheinen nicht.
- [x] AC11: Betrag und Kachel lassen sich in beliebiger Reihenfolge wählen. Sind beide gesetzt, klappt die Tastatur ein. Ein Tipp auf den Betrag öffnet sie wieder. Speichern ist gesperrt, solange Betrag, Vorlage oder Shop fehlt, und ein Hinweis nennt, was fehlt.
- [x] AC12: Bei einer Vorlage ohne festen Shop erscheint eine Shop-Auswahl mit den in dieser Kategorie häufigsten Shops. Der häufigste ist vorausgewählt, „Anderer …“ erlaubt freie Eingabe.
- [x] AC13: „Andere …“ zeigt Shopname (mit Vorschlägen aus bisherigen Shops), Kategorie, Unterkategorie und den Schalter „Als Vorlage merken“. Ist er an, wird beim Speichern zusätzlich eine Vorlage angelegt.
- [x] AC14: Das Datum steht auf heute. Ein Tipp bietet Heute · Gestern · Datum wählen.
- [x] AC15: „Alle Felder“ öffnet das große Formular mit allen schon eingegebenen Werten.
- [x] AC16: Nach dem Speichern schließt das Sheet. Die neue Zeile ist kurz hervorgehoben, die Snackbar zeigt „Gespeichert · Shop Betrag“ (ohne Rückgängig), und das Gerät vibriert kurz, wo unterstützt.
- [x] AC17: Gibt es am selben Tag schon eine Rechnung mit gleichem Shop, gleicher Kategorie/Unterkategorie und gleichem Betrag, zeigt das Sheet „Heute schon eingetragen“. Der Button heißt dann „Trotzdem speichern“.
- [x] AC18: Wird das Sheet ohne Speichern geschlossen oder weggewischt, bleiben Betrag und Auswahl als Entwurf erhalten. Beim nächsten Öffnen steht „Entwurf wiederhergestellt · Verwerfen“.
- [x] AC19: Ab 1024 px öffnet die Schnellerfassung als zentrierter Dialog mit normaler Tastatureingabe.

**Vorlagen (Design v2 `03-vorlagen`)**

- [x] AC20: Eine Vorlage hat einen optionalen Namen, Kategorie, optional Unterkategorie und einen Shop, der fest ist oder beim Erfassen gewählt wird. Ohne Namen steht der Shopname auf der Kachel.
- [x] AC21: Ein langer Druck auf einen Vorschlag im Sheet bietet „Als Vorlage anheften“ und „Nicht mehr vorschlagen“.
- [x] AC22: Unter Mehr → Vorlagen lassen sich Vorlagen sortieren (Griff), anlegen, bearbeiten und löschen. Darunter stehen Vorschläge mit Häufigkeit und „Anheften“.
- [x] AC23: Vorlagen, Reihenfolge und ausgeblendete Vorschläge werden im Backend pro Benutzer gespeichert und sind auf allen Geräten gleich.

**Großes Formular und Foto (Review 2)**

- [x] AC24: Im großen Formular steht der Preis oben mit Autofokus. Er öffnet die Dezimaltastatur (`inputmode="decimal"`, Komma erlaubt).
- [x] AC25: Der Shopname vervollständigt aus bisherigen Shops. Nach der Auswahl werden die zuletzt für diesen Shop verwendete Kategorie und Unterkategorie vorbelegt.
- [x] AC26: Das Datum hat die Schnellwahl Heute · Gestern · Datum wählen.
- [x] AC27: Nach dem Speichern gibt es dieselbe Rückmeldung wie in AC16 (Snackbar ohne Rückgängig, Vibrieren), danach geht es zurück zur Liste.
- [x] AC28: Fotos werden mit der nativen Kamera bzw. Galerie aufgenommen (`<input type="file" accept="image/*" capture="environment">`). `ngx-webcam` und der Dialog mit Radio-Umschalter entfallen.
- [x] AC29: Jedes Foto (Rechnung, Analyse, Scan, Offline-Cache) wird vor Upload und Speicherung auf JPEG verkleinert: lange Kante höchstens 1600 px, Qualität 0,8.

**Rechnung scannen (Review 2)**

- [x] AC30: Der Kamera-Knopf neben der Eingabezeile führt durch: Foto → Analyse (mit Ladezustand) → großes Formular, vorbefüllt mit Shop, Datum, Betrag, Kategorie, Unterkategorie → prüfen → Speichern. Das Foto wird mitgespeichert.
- [x] AC31: Schlägt die Analyse fehl oder dauert sie zu lange, öffnet das Formular mit dem Foto und leeren Feldern, und ein Hinweis erklärt das.

**Analyse (Review 4)**

- [x] AC32: Die Detailansicht einer analysierten Rechnung zeigt die Positionen (LineItems).
- [x] AC33: Analysierte Rechnungen haben „Als Rechnung übernehmen“ (öffnet das große Formular vorbefüllt, nach dem Speichern verschwindet der Analyse-Eintrag) und „Verwerfen“ (mit Rückfrage, neuer Backend-Endpoint, löscht Eintrag und Foto).
- [x] AC34: Das Foto einer analysierten Rechnung lässt sich wie bei normalen Rechnungen per Pinch zoomen.
- [x] AC35: `AnalyzeBillWorker` markiert ein Bild erst nach erfolgreicher Analyse als verarbeitet. Schlägt sie fehl, wird es erneut versucht, mit einer Obergrenze. `FileSystemAnalysisImageRepository.MarkAsProcessedAsync` markiert tatsächlich. Ein Bild wird nicht mehr jede Minute erneut verschickt.
- [x] AC36: Die Analyse-Liste hat echte Paginierung (Backend wertet die Seitenparameter aus, Gesamtzahl stimmt) oder keinen Paginator. Die Entscheidung steht im Design.

**PWA (Review 8)**

- [x] AC37: Das Manifest hat den App-Shortcut „Rechnung eintragen“. Er öffnet Rechnungen → Liste mit offenem Schnell-Sheet.
- [x] AC38: Die App ist Share Target für Bilder. Ein aus der Galerie geteiltes Foto startet den Scan-Ablauf aus AC30.

**Allgemein**

- [x] AC39: Backend-Tests decken Vorlagen, Vorschläge, häufigste Shops, „Analyse verwerfen“, die Worker-Logik und die Paginierung ab. Frontend-Unit-Tests decken Betragseingabe, Kachel-Auswahl/-Regeln, Entwurf, Duplikat-Erkennung und Wischgeste ab. Builds und Tests sind grün.
- [x] AC40: Die UI-Prüfung mit Playwright bei 390 px und 1440 px stimmt mit den Screenshots unter `docs/design/v2/screenshots/` überein.
- [x] AC41: `docs/design/DESIGN.md` beschreibt die neue Navigation (Leiste, Tabs, Dock, Sheet) statt Drawer und Bereichsnavigation je Feature.

## UI Verification

- 2026-11-05, **PASSED.** Abschlussprüfung bei 390 px und 1440 px gegen alle sichtbaren ACs, design.md §9 und die v2-Screens (`ui-testing/phase4/`). Erster Lauf: 46 PASS, 2 FAIL (F1 Scan → Speichern hinterlässt einen doppelten Listeneintrag, F2 Übernahme → Speichern verlässt das Formular nicht sauber). Ursache: Chromium verliert den History-State eines Eintrags mit Blob. Behoben in fdec28d (Foto über `PrefillImageStore` im Speicher), Nachprüfung F1/F2 samt Regression grün (`ui-testing/phase4/recheck-*`). Nicht im Browser prüfbar und durch Unit-/Backend-Tests abgedeckt: Sheet am Griff wegwischen, Löschen von Person/Einkommen/Kategorie mit Zurück, Kategorie-Vorbelegung nach Shopwahl (AC25), Positionen und KI-Vorbelegung (keine KI lokal), Worker-Wiederholung (AC35); echtes Wischen/Zoomen, Share-POST des Service Workers und App-Shortcut nur auf dem Gerät. Konsole: nur die bekannten NG0100 der Statistik-Seiten (US-0008). Beobachtungen ohne Bezug zu den ACs stehen in US-0008 (Technical Notes).

## Technical Notes

- Bestehende Endpoints: `CreateBill` verlangt `ShopName` (nicht leer), `CategoryId`, `Price > 0`. Synchrone Analyse `bill/analyze`, asynchrone `upload-for-analysis` (US-0005).
- Neue Backend-Teile (Shopping-Service): Vorlagen (CRUD + Reihenfolge), Vorschläge, ausgeblendete Vorschläge, häufigste Shops je Kategorie, Analyse verwerfen, ggf. Paginierung.
- Bildverkleinerung gibt es teilweise schon (`shared/utils/image-utils.ts`, US-0005).
- Bibliotheks-APIs per Context7 nachschlagen.
- Offene Punkte aus US-0006 (Foto-Dialog, wird hier ersetzt): kein Ladezustand während der Bildverkleinerung (`uploading` ungenutzt), Umschalten der Option während der Verkleinerung setzt das Bild unter der anderen Option. `compressImage` lässt ein JPEG innerhalb der Kantenlänge unverändert; ein kleines JPEG mit EXIF-Drehung behält dann das EXIF-Tag statt gedrehter Pixel (für AC29 prüfen).

## Out of Scope

- Offline-Warteschlange für die Schnellerfassung (Bestand aus US-0005 bleibt)
- Rückgängig nach Speichern oder Löschen
- Vorlagen-Chips auf der Startseite
- Übrige Review-Punkte (Liste/Statistik, Haushalt, Stunden, Einstellungen, Export, Allgemeines): US-0008

## AI Usage

Siehe [ai-usage.md](./ai-usage.md). Erfasst ist die Session ab der Wiederaufnahme (Tasks 1–12, Reviews, UI-Prüfung). Brainstorming, Planung und die abgestürzte Session davor sind nicht enthalten, weil ihre Transkripte für die Auswertung gesperrt sind.
