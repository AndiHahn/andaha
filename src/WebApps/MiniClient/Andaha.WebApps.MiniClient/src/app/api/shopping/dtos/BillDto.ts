import { parseLocalDateTime } from "src/app/shared/utils/utils";
import { BillCategoryDto } from "./BillCategoryDto";
import { BillSubCategoryDto } from "./BillSubCategoryDto";
import { BillLineItemDto, MatchedLineItemDto } from "./BillLineItemDto";

export interface BillDto extends BillDtoBase {
  /** Rechnungstag (gespeichert ohne Uhrzeit, als lokale Mitternacht gelesen) */
  date: Date;
  /** Zeitpunkt des Erfassens; fehlt bei lokal (offline) angelegten Rechnungen */
  createdAt?: Date;
}

export interface BillDtoRaw extends BillDtoBase {
  date: string;
  createdAt?: string;
}

interface BillDtoBase {
  id: string;
  category: BillCategoryDto;
  subCategory?: BillSubCategoryDto;
  shopName: string;
  price: number;
  notes?: string;
  isExternal: boolean;
  fromAnalysis: boolean;
  imageAvailable: boolean;
  /** Positionen; nur die Detailabfrage liefert sie, die Liste sendet [] */
  lineItems?: BillLineItemDto[];
  /** Bei einer Suche: die passende Position (sonst null) */
  matchedLineItem?: MatchedLineItemDto | null;
}

export function mapBillDtoRaw(raw: BillDtoRaw): BillDto {
  const { createdAt, ...bill } = raw;
  return {
    ...bill,
    date: parseLocalDateTime(raw.date),
    // CreatedAt ist ein echter UTC-Zeitpunkt (DateTime.UtcNow), anders als das Rechnungsdatum
    ...(createdAt ? { createdAt: new Date(createdAt) } : {})
  }
}
