/**
 * Vorbelegung des großen Formulars (`/bill/create`), übergeben als Router-State
 * (`router.navigate(['/bill/create'], { state: { prefill } })`): aus „Alle Felder“ der
 * Schnellerfassung, aus dem Scan und aus „Als Rechnung übernehmen“.
 */
export interface BillCreatePrefill {
  price?: number;
  shopName?: string;
  categoryId?: string;
  subCategoryId?: string | null;
  /** Kalendertag `YYYY-MM-DD` */
  date?: string;
  notes?: string;
  image?: File;
  analyzedBillId?: string;
  notice?: 'analysis-failed';
}
