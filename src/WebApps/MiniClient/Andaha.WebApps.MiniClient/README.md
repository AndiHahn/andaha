# Andaha.WebApps.MiniClient

Angular 22 PWA (Standalone Components, Angular Material 22 mit Material-2-Theme). Mit [Angular CLI](https://github.com/angular/angular-cli) erzeugt.

## Voraussetzungen

Node 24 (siehe `engines` in `package.json`). Abhaengigkeiten installieren:

```
npm ci
```

## Development server

`npm start` (oder `ng serve`) startet den Dev-Server auf `http://localhost:4200/`. Der Port 4200 ist fest, da die B2C-App-Registrierung diese Redirect-URL erwartet. Die App laedt bei Aenderungen an den Quelldateien automatisch neu.

## Build

`npm run build:prod` baut die Produktionsversion nach `dist/andaha.web-apps.mini-client/` (flache Ausgabe, ohne `browser`-Unterordner). Die Platzhalter `#{...}#` in den `.js`-Dateien werden erst bei der Bereitstellung in der CD-Pipeline ersetzt.

## Unit-Tests

`npm test` fuehrt die Tests mit [Vitest](https://vitest.dev) im Browser-Modus aus (einmaliger Lauf). Dafuer wird Playwright Chromium benoetigt, einmalig installieren mit:

```
npx playwright install chromium
```

## Code scaffolding

`ng generate component component-name` erzeugt eine neue Komponente. Weitere Schematics: `ng generate directive|pipe|service|class|guard|interface|enum`.

## Further help

Mehr Hilfe zur Angular CLI: `ng help` oder die [Angular CLI Dokumentation](https://angular.dev/tools/cli).
