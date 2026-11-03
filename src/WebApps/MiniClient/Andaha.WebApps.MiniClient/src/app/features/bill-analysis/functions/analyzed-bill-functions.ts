import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { SubCategoryDto } from 'src/app/api/shopping/dtos/SubCategoryDto';

export function resolveAnalyzedCategory(
  categories: CategoryDto[],
  categoryId?: string,
  subCategoryId?: string
): { category?: CategoryDto; subCategory?: SubCategoryDto } {
  const category = categoryId ? categories.find(c => c.id === categoryId) : undefined;
  const subCategory = category && subCategoryId
    ? category.subCategories?.find(s => s.id === subCategoryId)
    : undefined;
  return { category, subCategory };
}

export function confidencePercent(confidence?: number | null): number | null {
  if (confidence === null || confidence === undefined || Number.isNaN(confidence)) {
    return null;
  }
  return Math.round(confidence * 100);
}
