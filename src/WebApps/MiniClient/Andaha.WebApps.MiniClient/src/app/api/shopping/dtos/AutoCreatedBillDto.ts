import { parseLocalDateTime } from 'src/app/shared/utils/utils';

/** Heute von der Analyse automatisch angelegte Rechnung (`fromAutoAnalysis`) */
export interface AutoCreatedBillDto extends AutoCreatedBillDtoBase {
  /** Rechnungstag (gespeichert ohne Uhrzeit, als lokale Mitternacht gelesen) */
  date: Date;
  createdAt: Date;
}

export interface AutoCreatedBillDtoRaw extends AutoCreatedBillDtoBase {
  date: string;
  createdAt: string;
}

interface AutoCreatedBillDtoBase {
  billId: string;
  /** Bild-ID des Uploads, aus dem die Rechnung entstand */
  sourceUploadId?: string | null;
  shopName: string;
  price: number;
}

export function mapAutoCreatedBillDtoRaw(raw: AutoCreatedBillDtoRaw): AutoCreatedBillDto {
  return {
    ...raw,
    date: parseLocalDateTime(raw.date),
    // CreatedAt ist ein echter UTC-Zeitpunkt, anders als das Rechnungsdatum (wie mapBillDtoRaw)
    createdAt: new Date(raw.createdAt)
  };
}
