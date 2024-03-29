import { SubCategoryUpdateDto } from "./SubCategoryUpdateDto";

export interface CategoryUpdateDto {
  name: string;
  color: string;
  includeToStatistics: boolean;
  subCategories: SubCategoryUpdateDto[];
}
