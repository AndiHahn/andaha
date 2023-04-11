import { SubCategoryUpdateDto } from "./SubCategoryUpdateDto";

export interface CategoryCreateDto {
  name: string;
  color: string;
  includeToStatistics: boolean;
  subCategories: SubCategoryUpdateDto[];
}
