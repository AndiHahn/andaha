import { SubCategoryUpdateDto } from "./SubCategoryUpdateDto";

export interface CategoryUpdateDto {
  id?: string;
  name: string;
  color: string;
  order: number;
  includeToStatistics: boolean;
  subCategories: SubCategoryUpdateDto[];
}
