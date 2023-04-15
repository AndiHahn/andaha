import { SubCategoryCreateDto } from "./SubCategoryCreateDto";

export interface CategoryCreateDto {
  name: string;
  color: string;
  includeToStatistics: boolean;
  subCategories: SubCategoryCreateDto[];
}
