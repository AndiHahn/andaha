import { BillCategoryDto } from "./BillCategoryDto";
import { BillDto } from "./BillDto";

export interface BillCreateDto extends BillCreateDtoBase {
  image?: File;
}

export interface BillCreateCacheItem extends BillCreateDtoBase {
  image?: string;
}

interface BillCreateDtoBase {
  id: string;
  categoryId: string;
  shopName: string;
  price: number;
  date: Date;
  notes?: string;
}

export function billCreateDtoToBillDto(bill: BillCreateDto, category: BillCategoryDto): BillDto {
  return {
    id: bill.id,
    shopName: bill.shopName,
    category: category,
    date: bill.date,
    price: bill.price,
    notes: bill.notes,
    isExternal: false,
    imageAvailable: bill.image != undefined
  }
}
