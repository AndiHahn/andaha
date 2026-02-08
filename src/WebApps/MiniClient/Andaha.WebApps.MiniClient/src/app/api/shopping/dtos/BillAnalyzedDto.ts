import { PagedResultDto } from "../../common-dtos/PagedResultDto";
import { BillCategoryDto } from "./BillCategoryDto";
import { BillSubCategoryDto } from "./BillSubCategoryDto";

export interface BillAnalyzedDto extends BillAnalyzedDtoBase {
  date: Date;
}

export interface BillAnalyzedDtoRaw extends BillAnalyzedDtoBase {
  date: string;
}

interface BillAnalyzedDtoBase {
  id: string;
  category: BillCategoryDto;
  subCategory?: BillSubCategoryDto;
  shopName: string;
  price: number;
  notes?: string;
  analysisConfidence: number;
  imageAvailable: boolean;
}

export interface BillAnalyzedResponseDto extends BillAnalyzedResponseBase {
  date: Date;
}

export interface BillAnalyzedResponseDtoRaw extends BillAnalyzedResponseBase {
  date: string;
}

interface BillAnalyzedResponseBase {
  id: string;
  categoryId: string;
  subCategoryId?: string;
  shopName: string;
  price: number;
  notes?: string;
  analysisConfidence: number;
}

export function mapBillAnalyzedDtoRaw(raw: BillAnalyzedDtoRaw): BillAnalyzedDto {
  return {
    ...raw,
    date: new Date(raw.date)
  }
}

export function mapPagedBillAnalyzedDtoResultRaw(raw: PagedResultDto<BillAnalyzedDtoRaw>): PagedResultDto<BillAnalyzedDto> {
  return {
    ...raw,
    values: raw.values.map(mapBillAnalyzedDtoRaw)
  }
}

export function mapBillAnalyzedResponseDtoRaw(raw: BillAnalyzedResponseDtoRaw): BillAnalyzedResponseDto {
  return {
    ...raw,
    date: new Date(raw.date)
  }
}
