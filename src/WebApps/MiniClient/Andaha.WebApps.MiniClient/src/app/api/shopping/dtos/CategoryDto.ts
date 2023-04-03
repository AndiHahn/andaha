import { SubCategoryDto } from "./SubCategoryDto";

export interface CategoryDto {
  id: string;
  name: string;
  color: string;
  order: number;
  includeToStatistics: boolean;
  isDefault: boolean;
  subCategories: SubCategoryDto[];
}
