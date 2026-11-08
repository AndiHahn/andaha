# US-0012 Design: Rechnungsbilder strukturiert ablegen

Stand: 2026-11-08. Entscheidungen der Nutzerin bzw. des Nutzers sind als solche markiert, meine eigenen mit *(meine Entscheidung)*.

## 1. Ziel und Warum

Die Rechnungsbilder sollen per **Synology Cloud Sync** aus Azure Blob Storage als Backup auf das On-Prem-NAS gespiegelt werden (Entscheidung Nutzer). Cloud Sync spiegelt die Ordnerstruktur des Containers 1:1. Deshalb muss die Struktur direkt in Azure entstehen.

Gesucht wird auf dem NAS über **Jahr und Monat sowie den Shopnamen** (Entscheidung Nutzer).

- **Ziel:** Jedes Rechnungsbild liegt unter einem sprechenden Pfad mit Benutzer, Jahr, Monat, Datum, Shop und ID.
- **Nicht-Ziel:** ein eigener Sync-Dienst, ein Export-Endpunkt oder Änderungen am NAS-Upload (Container `nas`, Analyse-Eingang).
- **Anti-Ziel:**
  - Ein Bild geht verloren oder wird unerreichbar.
  - Bilder anderer Benutzer werden unbemerkt mitgespiegelt.

## 2. Ist-Zustand

- Container `images`, Pfad `bills/{name}`. `name` ist `{BillId}-{n}` bzw. `{AnalyzedBillId}-1` und steht ohne Dateiendung in `BillImage.Name` (varchar(200)).
- **Wer schreibt:**
  - `BillAnalysisProcessor`: automatisch angelegte Rechnung und Scan.
  - `FailedAnalysisImageHandler`: Scan nach fehlgeschlagener Analyse.
  - `UploadBillImageCommandHandler`: Foto an Rechnung anhängen. Darüber läuft auch „Als Rechnung übernehmen“, denn die App lädt das Scan-Bild dabei neu hoch.
- **Wer liest oder löscht:** `GetBillImage`, `GetAnalyzedBillImage`, `DeleteBill`, `DeleteBillImage`, `DeleteAnalyzedBill`, `DeleteUserData`.
- Die API gibt Bildnamen nie heraus, Bilder werden über die Rechnungs-ID geladen. Das Namensschema ist deshalb reine Backend-Sache, **kein UI-Anteil**.
- Lokal gibt es `FileSystemImageRepository` mit der gleichen Schnittstelle.

## 3. Pfadschema

Der Container `images` und das Präfix `bills/` bleiben. `BillImage.Name` speichert künftig den Pfad **unterhalb** von `bills/`.

| Art | Pfad unter `bills/` |
|---|---|
| Rechnung | `{UserId}/{yyyy}/{MM}/{yyyy-MM-dd}_{Shop}_{BillId}-{n}.{ext}` |
| Scan „Zu prüfen“ | `{UserId}/offen/{yyyy-MM-dd_HH-mm-ss}_{AnalyzedBillId}-1.{ext}` |

Beispiel: `bills/1717c5d6-…/2026/11/2026-11-06_Billa-Plus_3f2a…-1.jpg`

- **Oberordner pro Benutzer** (Entscheidung Nutzer, Grund Datenschutz): Die App hat mehrere Benutzer. In Cloud Sync wählt man nur den eigenen Ordner `bills/{UserId}` aus. Maßgeblich ist der **Ersteller bzw. Eigentümer** der Rechnung (`Bill.UserId`, `AnalyzedBill.UserId`). Rechnungen verbundener Benutzer liegen in deren Ordnern.
- **Jahr, Monat und Datum** kommen aus dem Rechnungsdatum (`Bill.Date`, reines Datum). Beim Scan ist es der Upload-Zeitpunkt in UTC, weil Datum und Shop dort oft noch unsicher sind (Entscheidung Nutzer: eigener Ordner `offen/`).
- **Shop:** Der Shopname wird zu einem ASCII-Slug *(meine Entscheidung)*:
  - `ä→ae ö→oe ü→ue ß→ss`, andere Akzente ohne Akzent (Unicode-Normalisierung).
  - Erlaubt sind `[A-Za-z0-9-]`. Leerzeichen und Folgen anderer Zeichen werden zu genau einem `-`, Bindestriche am Anfang und Ende entfallen.
  - Höchstens 40 Zeichen. Ist der Name leer, steht dort `Unbekannt`.
  - Die Spalte ist varchar(200), die Länge reicht. Ein vollständiger Pfad hat höchstens etwa 145 Zeichen.
- **ID und Nummer** bleiben im Namen, damit er eindeutig ist und auf die Datenbank zurückführt. `{n}` folgt der bisherigen Logik.
- **Dateiendung** über die ersten Bytes *(meine Entscheidung)*: JPEG `.jpg`, PNG `.png`, WebP `.webp`, HEIC/HEIF `.heic`, PDF `.pdf`, sonst `.bin`. Dazu wird der passende `Content-Type` am Blob gesetzt.
- Eine **eigene Klasse** (z. B. `BillImagePath`) baut die Pfade und hat Unit-Tests.

## 4. Verhalten

1. **Neue Bilder** bekommen direkt den neuen Pfad. Das gilt für alle drei Schreibwege aus §2.
2. **Bearbeiten** (Entscheidung Nutzer: „lass es ändern“): Ändert `UpdateBill` das Datum oder den Shop einer Rechnung, ziehen alle Bilder dieser Rechnung an den neuen Pfad um.
   - Reihenfolge: Blob kopieren, `BillImage.Name` in derselben Speicherung wie die Rechnungsänderung aktualisieren, danach den alten Blob löschen.
   - Scheitert das Löschen, bleibt eine verwaiste Kopie mit Log-Warnung. Es geht nichts verloren.
   - Scheitert das Kopieren, wird die Rechnungsänderung nicht gespeichert (Fehler an den Client).
   - Ändern sich weder Datum noch Shop, passiert nichts.
3. **Übernehmen eines Scans:** Das Bild der neuen Rechnung kommt über §4.1 an den Rechnungspfad. Der Scan samt Bild wird wie heute gelöscht und verschwindet damit auch aus `offen/`.
4. **Bestehende Bilder:** Eine einmalige Migration verschiebt alle Bilder mit altem Namen ohne `/` an ihren neuen Pfad *(meine Entscheidung: als Hintergrunddienst beim Start)*.
   - Sie läuft idempotent und in Stapeln, z. B. 50 Bilder je Durchlauf, und überspringt bereits migrierte Namen.
   - Je Bild: Blob lesen, Endung bestimmen, an den neuen Pfad kopieren, Namen in der Datenbank speichern, alten Blob löschen.
   - Fehlt ein alter Blob, wird das geloggt und das Bild übersprungen, der Datenbankeintrag bleibt.
   - Nach erfolgreichem Lauf gibt es nichts mehr zu tun. Bei späteren Starts genügt eine Prüfung, ob noch Namen ohne `/` existieren.
5. **Lesen und Löschen** benutzen nur noch `BillImage.Name`. Während der Migration lebt das Repository mit beiden Formen, weil der Pfad immer `bills/{Name}` ist. Alte Namen bleiben also lesbar, bis sie migriert sind.
6. Das **Dateisystem-Repository** für die lokale Entwicklung bekommt dieselben Pfade inklusive Unterordnern und die Kopierfunktion.

### 4a. Präzisierungen nach dem Builder-Check *(alle meine Entscheidung)*

- **Bild ersetzen:** Lädt man an eine Rechnung ein neues Bild hoch, wird es an den neuen Pfad geschrieben. Danach wird der Blob des ersetzten Bildes gelöscht, auch wenn der Name anders lautet, etwa wegen einer anderen Endung. Sonst bleiben verwaiste Dateien zurück, die Cloud Sync mitspiegelt. Das Löschen geschieht erst nach erfolgreichem Upload und Speichern. Scheitert es, wird eine Warnung geloggt.
- **`UpdateBill` mit neuem Bild:** Kommt mit der Änderung ein neues Bild, wird das alte nicht verschoben, sondern nach dem Ersetzen gelöscht. Das neue Bild landet direkt am Pfad mit den neuen Daten. Verschoben wird nur, wenn kein neues Bild mitkommt.
- **Wann verschieben:** Ob ein Umzug nötig ist, entscheidet der Vergleich zwischen altem Pfad und dem Pfad nach der Änderung. Zwei Shopnamen mit demselben Slug lösen keinen Umzug aus.
- **Datum:** `Bill.Date` ist ein reines Kalenderdatum (Spaltentyp `date`). `yyyy-MM-dd` wird ohne Zeitzonen-Umrechnung genommen.
- **Benutzerordner:** Er richtet sich nach `Bill.UserId` bzw. `AnalyzedBill.UserId`. Das ist das einzige Eigentümerfeld (`HasCreated` vergleicht genau dieses). Auch wenn ein verbundener Benutzer ein Bild hochlädt, liegt es im Ordner des Eigentümers der Rechnung.
- **Zeitstempel der Scans:** `AnalyzedBill.CreatedAt` in UTC, auch bei der Migration.
- **Migration bei mehreren Instanzen:** Jeder Schritt ist wiederholbar, deshalb ist kein globales Lock nötig.
  - Die Kopie darf ein bereits vorhandenes, identisches Ziel überschreiben.
  - Der Name in der Datenbank wird nur geändert, wenn er noch den alten Wert hat (bedingte Aktualisierung).
  - Das Löschen eines schon fehlenden alten Blobs gilt als Erfolg.
- **Unbekannter Dateityp:** Die Endung wird `.bin`, dazu kommt eine Log-Warnung mit Bildname.

## 5. Schnittstellen

`IImageRepository` bekommt eine Kopierfunktion, zum Beispiel:

```
Task CopyImageAsync(string sourceName, string targetName, CancellationToken ct)
```

In Azure läuft das per Server-seitiger Kopie bzw. Download und Upload innerhalb des Containers. Die Implementierung schlägt dazu in der Azure.Storage.Blobs-Doku über Context7 nach. Upload und Kopie setzen den `Content-Type`.

## 6. Tests

- **Unit:**
  - Pfadbau: Slug-Regeln inklusive Umlauten, Sonderzeichen, leerem Namen und Länge, dazu Datum, Ordner, Endungen und Scan-Pfad.
  - Erkennung der Dateiendung anhand der Bytes.
- **Handler** (SQLite und Fake-Repository wie bisher):
  - Neue Bilder bekommen neue Pfade (Prozessor, Failed-Handler, Upload).
  - `UpdateBill` mit geändertem Datum und Shop: Kopie, neuer Name, alter Blob gelöscht.
  - `UpdateBill` ohne Änderung: nichts passiert.
  - Kopierfehler: keine Speicherung.
- **Migration:** alte Namen werden migriert, ein zweiter Lauf tut nichts, ein fehlender Blob wird übersprungen.
- **Bestehende Tests** für Lesen und Löschen bleiben grün.
- **Keine UI-Prüfung**, das Frontend bleibt unverändert. Stattdessen prüft ein manueller Schritt lokal: Bild hochladen, Rechnung bearbeiten, Ordnerstruktur im lokalen Dateisystem-Repository bzw. Azurite ansehen.

## 7. Bekannte Grenzen und offene Punkte

- **Ordnername:** In Cloud Sync wählt man den Ordner `bills/{UserId}`. Die eigene UserId muss man dafür kennen. Sie ist z. B. in einem bereits gespiegelten Pfad zu sehen. Eine Anzeige in der App gehört nicht zu dieser Story.
- **Ein Bild pro Rechnung:** `UploadBillImage` ersetzt heute das vorhandene Bild. Es entfernt das erste, damit ist `{n}` faktisch immer 1. Diese Regel bleibt *(meine Entscheidung)*.
- **Datenmenge:** Die Migration kostet einmalig Speichertransaktionen in Azure, vernachlässigbar.
- Container `nas` und `analysis` bleiben unverändert.
