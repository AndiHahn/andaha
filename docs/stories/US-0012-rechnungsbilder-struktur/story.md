# US-0012: Rechnungsbilder strukturiert ablegen (Backup aufs NAS)

| Field | Value |
|-------|-------|
| ID | US-0012 |
| Status | In Review <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-08 |
| Design Doc | [design.md](./design.md) |
| Plan | [plan.md](./plan.md) |

## Description

Als Nutzer möchte ich die hochgeladenen Rechnungsbilder per Synology Cloud Sync als Backup auf mein On-Prem-NAS spiegeln. Dazu sollen sie im Azure Storage nicht mehr flach mit einer ID benannt sein. Stattdessen liegen sie strukturiert pro Benutzer, Jahr und Monat, mit Datum, Shopname und ID im Dateinamen.

Heute liegen alle Bilder im Container `images` unter `bills/{id}-{n}`, ohne Dateiendung.

## Acceptance Criteria

- [x] AC1: Neue Rechnungsbilder liegen unter `bills/{UserId}/{yyyy}/{MM}/{yyyy-MM-dd}_{Shop}_{BillId}-{n}.{ext}`. Das gilt für automatisch angelegte Rechnungen, angehängte Fotos und übernommene Scans. `UserId` ist der Eigentümer der Rechnung.
- [x] AC2: Neue Scan-Bilder („Zu prüfen“) liegen unter `bills/{UserId}/offen/{yyyy-MM-dd_HH-mm-ss}_{AnalyzedBillId}-1.{ext}`. Der Zeitstempel ist der Anlage-Zeitpunkt in UTC. Wird der Scan übernommen oder verworfen, ist das Bild dort weg.
- [x] AC3: Der Shopname im Pfad ist ein ASCII-Slug: Umlaute ersetzt, nur `[A-Za-z0-9-]`, höchstens 40 Zeichen, `Unbekannt` falls leer.
- [x] AC4: Die Dateiendung richtet sich nach dem Inhalt (`.jpg`, `.png`, `.webp`, `.heic`, `.pdf`, sonst `.bin` mit Log-Warnung), passend dazu der `Content-Type` des Blobs.
- [x] AC5: Ändert man Datum oder Shop einer Rechnung so, dass sich der Pfad ändert, zieht das Bild an den neuen Pfad um. Danach gibt es keine Kopie mehr am alten Pfad. Scheitert das Kopieren, wird die Änderung nicht gespeichert.
- [x] AC6: Ersetzt man das Bild einer Rechnung, wird das alte Bild gelöscht. Kommt mit einer Änderung ein neues Bild, landet es direkt am neuen Pfad.
- [x] AC7: Bestehende Bilder mit altem Namen werden beim Start einmalig an ihren neuen Pfad verschoben. Das geht in Stapeln, ist wiederholbar und auch mit mehreren Instanzen sicher. Fehlende alte Blobs werden geloggt und übersprungen.
- [x] AC8: Lesen und Löschen funktionieren für alte und neue Namen, App und API bleiben unverändert.
- [x] AC9: Backend-Tests decken den Pfadbau, die Typerkennung, alle Schreibwege, den Umzug, das Ersetzen und die Migration ab. Build und Tests sind grün.

## Technical Notes

- Nur Backend: Shopping-Service, `IImageRepository` (Azure und Dateisystem), `BillImage.Name` (varchar(200), speichert den Pfad unterhalb von `bills/`).
- Keine Datenbank-Migration, das Schema bleibt unverändert.
- In Synology Cloud Sync wählt jeder Benutzer nur seinen Ordner `bills/{UserId}`.

## Out of Scope

- Eigener Sync-Dienst oder Export-Endpunkt
- Anzeige der UserId in der App
- Container `nas` und `analysis`
- Mehrere Bilder pro Rechnung

## Bekannte Grenzen und Folgearbeiten

- Ändert jemand während der einmaligen Migration gleichzeitig Datum oder Shop einer Rechnung, kann deren Bild im alten Monatsordner landen. Das korrigiert sich bei der nächsten Änderung.
- `BillImage`-Zeilen bereits ersetzter oder gelöschter Bilder bleiben in der Datenbank zurück, mit leeren Fremdschlüsseln. Das war schon vorher so. Die Migration lässt sie aus und meldet ihre Zahl einmal pro Lauf. Ihr Aufräumen und ein Sweep über `bills/{UserId}/` beim Löschen eines Kontos wären eine eigene Story.

## UI Verification

Entfällt, weil sich das Frontend nicht ändert. Stattdessen wurde am 2026-11-08 Folgendes geprüft:

**Azure gegen Azurite:** 8 neue Integrationstests mit `AzuriteFact`, die echt laufen, für Upload mit Content-Type, Upload nur falls nicht vorhanden, Kopie, Löschen, 404 und Migration. Dabei liefen alle 15 Azure-Tests und waren grün. Die Shopping-Suite hat 311 grüne Tests, keiner wurde übersprungen.

**Lokal:** Monolith mit dem Dateisystem-Repository, Angular-Dev-Server und Playwright.
- **Migration:** Die Migration hat beim Start die 5 verknüpften Bilder nach `{UserId}/2026/11/…` bzw. `{UserId}/offen/…` verschoben, mit `.jpg`/`.png`. 25 unverknüpfte alte Einträge hat sie einmalig gemeldet und nicht angefasst.
- **Anzeige:** Das migrierte Rechnungsfoto lädt in der App (HTTP 200).
- **Umzug:** Datum 04.11. → 15.10. und Shop „Baseline Markt (Foto)“ → „Baseline Märkt“ führten zu `…/2026/10/2026-10-15_Baseline-Maerkt_…-1.jpg`. Das Foto lädt weiter. Der Umzug zurück hat ebenfalls funktioniert.
- 0 Konsolenfehler.

## AI Usage

See [ai-usage.md](./ai-usage.md).
