# Andaha.WebApps.MiniClient

Angular 22 PWA (Standalone Components, Angular Material 22 mit Material-2-Theme). Mit [Angular CLI](https://github.com/angular/angular-cli) erzeugt.

## Voraussetzungen

Node 24 (ab 24.15). Laut `engines` in `package.json` laufen auch Node 22.22.3+ und Node 26+. Abhängigkeiten installieren:

```
npm ci
```

## Development server

`npm start` (oder `ng serve`) startet den Dev-Server auf `http://localhost:4200/`. Der Port 4200 ist fest, da die B2C-App-Registrierung diese Redirect-URL erwartet. Die App lädt bei Änderungen an den Quelldateien automatisch neu.

## Build

`npm run build:prod` baut die Produktionsversion nach `dist/andaha.web-apps.mini-client/` (flache Ausgabe, ohne `browser`-Unterordner). Die Platzhalter `#{...}#` in den `.js`-Dateien werden erst bei der Bereitstellung in der CD-Pipeline ersetzt.

## Unit-Tests

`npm test` führt die Tests mit [Vitest](https://vitest.dev) im Browser-Modus aus (einmaliger Lauf). Dafür wird Playwright Chromium benötigt, einmalig installieren mit:

```
npx playwright install chromium
```

## Code scaffolding

`ng generate component component-name` erzeugt eine neue Komponente. Weitere Schematics: `ng generate directive|pipe|service|class|guard|interface|enum`.

## Further help

Mehr Hilfe zur Angular CLI: `ng help` oder die [Angular CLI Dokumentation](https://angular.dev/tools/cli).
