import { BillCategoryDto } from "./BillCategoryDto";

export interface BillDto {
  id: string;
  createdByUserId: string;
  category: BillCategoryDto;
  shopName: string;
  price: number;
  date: Date;
  notes?: string;
}
