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
}

export function mapBillAnalyzedDtoRaw(raw: BillAnalyzedDtoRaw): BillAnalyzedDto {
  return {
    ...raw,
    date: raw.date ? new Date(raw.date) : undefined
  }
}

export function mapPagedBillAnalyzedDtoResultRaw(raw: PagedResultDto<BillAnalyzedDtoRaw>): PagedResultDto<BillAnalyzedDto> {
  return {
    ...raw,
    values: raw.values.map(mapBillAnalyzedDtoRaw)
  }
}
