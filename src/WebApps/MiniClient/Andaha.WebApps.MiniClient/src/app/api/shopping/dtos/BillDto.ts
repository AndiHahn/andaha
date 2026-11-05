import { parseLocalDateTime } from "src/app/shared/utils/utils";
import { BillCategoryDto } from "./BillCategoryDto";
import { BillSubCategoryDto } from "./BillSubCategoryDto";

export interface BillDto extends BillDtoBase {
  date: Date;
}

export interface BillDtoRaw extends BillDtoBase {
  date: string;
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
}

export function mapBillDtoRaw(raw: BillDtoRaw): BillDto {
  return {
    ...raw,
    date: parseLocalDateTime(raw.date)
  }
}
