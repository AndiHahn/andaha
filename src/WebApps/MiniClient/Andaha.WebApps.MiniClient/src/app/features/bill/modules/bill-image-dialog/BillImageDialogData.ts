import { Observable } from 'rxjs';

/** Pinch-Zoom-Dialog eines Rechnungsfotos: Rechnung oder analysierte Rechnung (AC34) */
export interface BillImageDialogData {
  /** Lädt das Foto */
  image: Observable<Blob>;
  /** Löscht das Foto; ohne: kein „Löschen“-Knopf */
  delete?: () => Observable<void>;
}
