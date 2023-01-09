import { ExpenseSubCategoryDto } from "./ExpenseSubCategoryDto";

export interface ExpenseDto {
  category: string;
  costs: number;
  subCategories: ExpenseSubCategoryDto[];
}
