import { SubCategoryDto } from "./SubCategoryDto";

export interface CategoryDto {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  subCategories: SubCategoryDto[];
}
