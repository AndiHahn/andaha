import { parseLocalDateTime } from "src/app/shared/utils/utils";
import { PagedResultDto } from "../../common-dtos/PagedResultDto";

export interface BillAnalyzedDto extends BillAnalyzedDtoBase {
  date?: Date;
}

export interface BillAnalyzedDtoRaw extends BillAnalyzedDtoBase {
  date?: string | null;
}

export interface AnalyzedBillLineItemDto {
  description?: string;
  totalPrice?: number;
  quantity?: number;
  unitPrice?: number;
}

interface BillAnalyzedDtoBase {
  id: string;
  categoryId?: string;
  subCategoryId?: string;
  shopName?: string;
  price?: number;
  confidence?: number | null;
  totalAmountConfidence?: number | null;
  imageAvailable: boolean;
  lineItems: AnalyzedBillLineItemDto[];
  /** Bild-ID des Uploads, aus dem die Analyse entstand (Zuordnung im Tab Scans) */
  sourceUploadId?: string | null;
  /** Gründe (Enum-Namen), warum die Analyse nicht automatisch zur Rechnung wurde */
  notCreatedReasons?: string[];
}

export function mapBillAnalyzedDtoRaw(raw: BillAnalyzedDtoRaw): BillAnalyzedDto {
  return {
    ...raw,
    // Rechnungsdatum der Analyse: gespeicherter Kalendertag als Ortszeit wie bei mapBillDtoRaw
    date: raw.date ? parseLocalDateTime(raw.date) : undefined
  }
}

export function mapPagedBillAnalyzedDtoResultRaw(raw: PagedResultDto<BillAnalyzedDtoRaw>): PagedResultDto<BillAnalyzedDto> {
  return {
    ...raw,
    values: raw.values.map(mapBillAnalyzedDtoRaw)
  }
}
