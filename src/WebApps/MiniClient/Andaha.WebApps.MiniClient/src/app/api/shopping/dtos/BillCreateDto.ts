import { BillDto } from "./BillDto";
import { BillCategoryDto } from "./BillCategoryDto";
import { BillSubCategoryDto } from "./BillSubCategoryDto";

export interface BillCreateDto extends BillCreateDtoBase {
  image?: File;
}

export interface BillCreateCacheItem extends BillCreateDtoBase {
  image?: string;
}

interface BillCreateDtoBase {
  id: string;
  categoryId: string;
  subCategoryId?: string;
  shopName: string;
  price: number;
  date: Date;
  notes?: string;
}

export function billCreateDtoToBillDto(bill: BillCreateDto, category: BillCategoryDto, subCategory: BillSubCategoryDto): BillDto {
  return {
    id: bill.id,
    shopName: bill.shopName,
    category: category,
    subCategory: subCategory,
    date: bill.date,
    price: bill.price,
    notes: bill.notes,
    isExternal: false,
    imageAvailable: bill.image != undefined
  }
}
