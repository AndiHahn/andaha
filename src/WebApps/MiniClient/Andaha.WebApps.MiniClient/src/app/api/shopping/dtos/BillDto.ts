import { PagedResultDto } from "../../common-dtos/PagedResultDto";
import { BillCategoryDto } from "./BillCategoryDto";

export interface BillDto extends BillDtoBase {
  date: Date;
}

export interface BillDtoRaw extends BillDtoBase {
  date: string;
}

interface BillDtoBase {
  id: string;
  category: BillCategoryDto;
  shopName: string;
  price: number;
  notes?: string;
  isExternal: boolean;
  imageAvailable: boolean;
}

export function mapBillDtoRaw(raw: BillDtoRaw): BillDto {
  return {
    ...raw,
    date: new Date(raw.date)
  }
}

export function mapPagedBillDtoResultRaw(raw: PagedResultDto<BillDtoRaw>): PagedResultDto<BillDto> {
  return {
    ...raw,
    values: raw.values.map(mapBillDtoRaw)
  }
}
