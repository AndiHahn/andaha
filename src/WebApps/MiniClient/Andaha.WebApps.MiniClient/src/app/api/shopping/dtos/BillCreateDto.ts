import { BillCategoryDto } from "./BillCategoryDto";
import { BillDto } from "./BillDto";

export interface BillCreateDto {
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
    isExternal: false
  }
}
