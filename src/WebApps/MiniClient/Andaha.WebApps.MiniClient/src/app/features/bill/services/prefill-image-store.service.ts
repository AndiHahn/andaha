import { Injectable } from '@angular/core';
import { generateGuid } from 'src/app/api/functions/api-utils';

/**
 * Übergibt das Foto von Scan, Teilen und „Als Rechnung übernehmen“ im Speicher an das große Formular
 * (`/bill/create`); in den Router-State kommt nur der Schlüssel (`BillCreatePrefill.imageKey`).
 *
 * Ein Blob gehört nicht in `history.state`: Chromium liest den Zustand eines solchen Eintrags nach einer
 * Traversierung (z. B. dem `history.back()` eines geschlossenen Auswahl-Panels) als null, samt
 * `navigationId` und Spur; Zurück und das Verlassen nach dem Speichern gingen dann daneben (Phase 4 F1/F2).
 *
 * Es bleibt nur das zuletzt übergebene Foto. Nach Neuladen ist es weg; das Formular öffnet dann ohne
 * Foto (design.md §9).
 */
@Injectable({ providedIn: 'root' })
export class PrefillImageStore {
  private entry: { key: string; image: File } | null = null;

  /** Legt das Foto ab (ersetzt das vorige) und liefert den Schlüssel für den Router-State */
  put(image: File): string {
    const key = generateGuid();
    this.entry = { key, image };
    return key;
  }

  /** Foto zum Schlüssel; null, wenn unbekannt (neu geladen, inzwischen ersetzt) oder kein Schlüssel */
  get(key: string | undefined): File | null {
    return key !== undefined && this.entry?.key === key ? this.entry.image : null;
  }
}
