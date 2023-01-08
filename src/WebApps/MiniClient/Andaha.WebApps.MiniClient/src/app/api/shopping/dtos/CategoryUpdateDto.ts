import { SubCategoryUpdateDto } from "./SubCategoryUpdateDto";

export interface CategoryUpdateDto {
  id?: string;
  name: string;
  color: string;
  subCategories: SubCategoryUpdateDto[];
}
