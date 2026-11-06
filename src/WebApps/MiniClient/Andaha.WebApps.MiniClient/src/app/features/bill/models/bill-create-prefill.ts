import { LineItemDraft } from '../functions/line-items';

/**
 * Vorbelegung des großen Formulars (`/bill/create`), übergeben als Router-State
 * (`router.navigate(['/bill/create'], { state: { prefill } })`): aus „Alle Felder“ der
 * Schnellerfassung, aus dem Scan und aus „Als Rechnung übernehmen“. Nur serialisierbare Werte, kein Blob.
 */
export interface BillCreatePrefill {
  price?: number;
  shopName?: string;
  categoryId?: string;
  subCategoryId?: string | null;
  /** Kalendertag `YYYY-MM-DD` */
  date?: string;
  notes?: string;
  /**
   * Schlüssel des Fotos im `PrefillImageStore`. Das Foto selbst steht nicht im Router-State: ein Blob in
   * `history.state` liest Chromium nach einer Traversierung als null (Phase 4 F1/F2, design.md §9).
   */
  imageKey?: string;
  /** „Als Rechnung übernehmen“: Formular speichert direkt beim Server und löscht danach diesen Analyse-Eintrag */
  analyzedBillId?: string;
  /** Aus „Alle Felder“ der Schnellerfassung: nach dem Speichern wird deren Entwurf verworfen */
  fromQuickEntry?: boolean;
  /** Positionen der Analyse, bereinigt wie im Backend (design.md §5.2); „Duplizieren“ setzt sie nie */
  lineItems?: LineItemDraft[];
}

/** „Als Rechnung übernehmen“ ohne Netz (design.md §5.2), im Formular und in der Analyse-Detailansicht */
export const TAKE_OVER_OFFLINE = 'Zum Übernehmen wird eine Verbindung gebraucht';
