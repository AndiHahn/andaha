# Redesign MiniClient – Designunterlagen

Helles Redesign der Andaha-App `src/WebApps/Miniclient/Andaha.WebApps.MiniClient` („Haushaltsbuch auf warmem Papier“, Palette **Tinte & Kupfer**). Funktionalität und Seiten bleiben unverändert, nur die Oberfläche ändert sich.

## Inhalt

| Datei | Zweck |
|---|---|
| [`DESIGN.md`](DESIGN.md) | Verbindliches Designsystem: Tokens (Frontmatter), Farben, Typografie, Layout, Komponenten, Do's & Don'ts |
| [`umsetzung.md`](umsetzung.md) | Umsetzungsplan für Angular: Leitplanken, bewusste UI-Änderungen, Screen → Komponenten, Phasen 1–5, Prüfung |
| [`tokens/_andaha-tokens.scss`](tokens/_andaha-tokens.scss) | SCSS-Variablen + CSS Custom Properties (gleiche Namen wie in den Mockups) |
| [`tokens/andaha-theme.scss`](tokens/andaha-theme.scss) | Angular Material 14 Theme (helle Paletten, Typografie) |
| [`mockups/`](mockups/) | Statische HTML-Mockups, im Browser öffnen; Markup und CSS dienen als Vorlage |
| [`screenshots/`](screenshots/) | Gerenderte Soll-Bilder der Mockups (Handy 390 × 844, Desktop 1440 × 900) |

Mockups und Screenshots:

| # | Inhalt |
|---|---|
| 01 | Rechnungen: Liste, Datumfilter (Sheet), Hinzufügen, Details |
| 02 | Statistik (Ring + Legende), Kategorie-Details (Sheet), Navigation (Drawer) |
| 03 | Analyse: Liste, Hochladen, analysierte Rechnung |
| 04 | Haushaltsplan: Übersicht, Fixkosten, Fixkosten bearbeiten (Speichern läuft), Einkommen |
| 05 | Stundenaufzeichnungen: Personen, Person, Arbeitszeiten hinzufügen, Zahlung (Sheet), Statistik |
| 06 | Verbindungen, Kategorien, Kategorie bearbeiten (Drag-Zustand), Export (lädt) |
| 07 | Desktop: Rechnungen mit Sidebar, Tabs und Tabelle, Konto-Menü offen |

Die Beispieldaten in den Mockups (Shops, Beträge, Personen, E-Mails) sind erfunden und dienen nur der Darstellung.

Der interaktive Design-Canvas (dunkle und helle Variante, Palettenumschalter) liegt privat unter https://claude.ai/artifact/HBss198bjAPyGYiFEvyLtt. Maßgeblich für die Umsetzung sind die Dateien hier.

## Mit Claude umsetzen

Eine neue Claude-Code-Session im Repo-Root starten und zum Beispiel so beginnen:

> Setze das Redesign des MiniClient um. Lies zuerst `docs/design/README.md`, `docs/design/DESIGN.md` und `docs/design/umsetzung.md`. Die Funktionalität darf sich nicht ändern. Arbeite Phase für Phase nach `umsetzung.md`, beginne mit Phase 1 und 2. Vergleiche jede Seite bei 390 px und 1440 px mit den Screenshots in `docs/design/screenshots/` und nutze die Mockups in `docs/design/mockups/` als Vorlage für Markup und CSS. Lege vorher einen Branch an und frag nach, bevor du committest.

Tipps:
- Pro Session eine Phase bzw. ein Feature; nach jeder Phase Build, Sichtprüfung und Regressions-Checkliste (`umsetzung.md`, Phase 5).
- Für die Sichtprüfung eignet sich der Playwright-MCP (`agentflow:ui-verification`).
- Wenn der impeccable-Skill die Tokens automatisch laden soll, `DESIGN.md` zusätzlich ins Projekt-Root bzw. ins App-Verzeichnis kopieren (impeccable sucht dort) oder beim Aufruf auf `docs/design/DESIGN.md` verweisen.
