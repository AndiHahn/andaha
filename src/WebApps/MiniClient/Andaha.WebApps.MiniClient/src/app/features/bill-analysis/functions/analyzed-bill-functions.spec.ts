import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { confidencePercent, resolveAnalyzedCategory } from './analyzed-bill-functions';

describe('analyzed-bill-functions', () => {
  const categories: CategoryDto[] = [
    {
      id: 'c1', name: 'Lebensmittel', color: 'green', order: 0, includeToStatistics: true, isDefault: false,
      subCategories: [{ id: 's1', name: 'Obst', order: 0 }]
    },
    { id: 'c2', name: 'Drogerie', color: 'blue', order: 1, includeToStatistics: true, isDefault: false, subCategories: [] }
  ];

  it('resolves category and subcategory by id', () => {
    const result = resolveAnalyzedCategory(categories, 'c1', 's1');
    expect(result.category?.name).toBe('Lebensmittel');
    expect(result.subCategory?.name).toBe('Obst');
  });

  it('returns undefined category for unknown id', () => {
    const result = resolveAnalyzedCategory(categories, 'unknown', 'x');
    expect(result.category).toBeUndefined();
    expect(result.subCategory).toBeUndefined();
    expect(resolveAnalyzedCategory(categories).category).toBeUndefined();
  });

  it('confidencePercent rounds 0.874 to 87', () => {
    expect(confidencePercent(0.874)).toBe(87);
  });

  it('confidencePercent returns null for null, undefined and NaN', () => {
    expect(confidencePercent(null)).toBeNull();
    expect(confidencePercent(undefined)).toBeNull();
    expect(confidencePercent(NaN)).toBeNull();
  });
});
