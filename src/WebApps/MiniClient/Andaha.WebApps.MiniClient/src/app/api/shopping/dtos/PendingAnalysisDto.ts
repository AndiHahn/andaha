export type PendingAnalysisState = 'queued' | 'analyzing';

/** Hochgeladenes Bild, dessen Analyse noch läuft (`analyzing` = Claim aktiv) */
export interface PendingAnalysisDto extends PendingAnalysisDtoBase {
  uploadedAt: Date;
}

export interface PendingAnalysisDtoRaw extends PendingAnalysisDtoBase {
  uploadedAt: string;
}

interface PendingAnalysisDtoBase {
  /** Bild-ID; dieselbe ID liefert der Upload und später `sourceUploadId` */
  id: string;
  state: PendingAnalysisState;
}

export function mapPendingAnalysisDtoRaw(raw: PendingAnalysisDtoRaw): PendingAnalysisDto {
  return {
    ...raw,
    uploadedAt: new Date(raw.uploadedAt)
  };
}
