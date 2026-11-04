import { CategoryDto } from '../../../../api/shopping/dtos/CategoryDto';
import { BillSuggestionDto } from '../../../../api/shopping/dtos/BillSuggestionDto';
import { BillTemplateDto } from '../../../../api/shopping/dtos/BillTemplateDto';
import { buildTiles, isSuggestionCovered } from './tiles';

const categories: CategoryDto[] = [
  { id: 'c1', name: 'Lebensmittel', color: '#111111', order: 0, includeToStatistics: true, isDefault: false,
    subCategories: [{ id: 's1', name: 'Obst', order: 0 }] },
  { id: 'c2', name: 'Drogerie', color: '#222222', order: 1, includeToStatistics: true, isDefault: false, subCategories: [] },
  { id: 'c3', name: 'Auto', color: '#333333', order: 2, includeToStatistics: true, isDefault: false, subCategories: [] },
];

const tpl = (id: string, p: Partial<BillTemplateDto> = {}): BillTemplateDto =>
  ({ id, name: null, shopName: null, categoryId: 'c1', subCategoryId: null, sortOrder: 0, ...p });
const sug = (shopName: string, p: Partial<BillSuggestionDto> = {}): BillSuggestionDto =>
  ({ shopName, categoryId: 'c1', subCategoryId: null, count: 3, ...p });

describe('buildTiles', () => {
  it('orders pinned templates first, then suggestions, max 6', () => {
    const templates = [tpl('a', { name: 'A' }), tpl('b', { name: 'B', categoryId: 'c2' }), tpl('c', { name: 'C', categoryId: 'c3' }), tpl('d', { name: 'D', shopName: 'X', categoryId: 'c2' })];
    const suggestions = [sug('S1', { subCategoryId: 's1' }), sug('S2', { subCategoryId: 's1' }), sug('S3', { subCategoryId: 's1' }), sug('S4', { subCategoryId: 's1' }), sug('S5', { subCategoryId: 's1' })];
    const tiles = buildTiles(templates, suggestions, categories);
    expect(tiles.length).toBe(6);
    expect(tiles.map(t => t.kind)).toEqual(['template', 'template', 'template', 'template', 'suggestion', 'suggestion']);
    expect(tiles.slice(0, 4).map(t => t.title)).toEqual(['A', 'B', 'C', 'D']);
    expect(tiles.slice(4).map(t => t.title)).toEqual(['S1', 'S2']);
    expect(new Set(tiles.map(t => t.key)).size).toBe(6);
  });

  it('honours max parameter', () => {
    expect(buildTiles([tpl('a'), tpl('b')], [], categories, 1).length).toBe(1);
  });

  it('drops a suggestion covered by a template with the same fixed shop', () => {
    const tiles = buildTiles([tpl('a', { shopName: 'Rewe' })], [sug(' rewe '), sug('Aldi')], categories);
    expect(tiles.map(t => t.title)).toEqual(['Rewe', 'Aldi']);
  });

  it('keeps a suggestion with a different shop or sub category', () => {
    const tiles = buildTiles([tpl('a', { shopName: 'Rewe' })], [sug('Rewe', { subCategoryId: 's1' }), sug('Rewe', { categoryId: 'c2' })], categories);
    expect(tiles.length).toBe(3);
  });

  it('drops a suggestion covered by a choose-shop template in the same category and sub category', () => {
    const tiles = buildTiles([tpl('a', { name: 'Einkauf' })], [sug('Rewe'), sug('Dm', { categoryId: 'c2' }), sug('Obst', { subCategoryId: 's1' })], categories);
    expect(tiles.map(t => t.title)).toEqual(['Einkauf', 'Dm', 'Obst']);
  });

  it('builds title and subtitle', () => {
    const [a, b, c, d] = buildTiles(
      [tpl('a', { name: 'Wocheneinkauf', shopName: 'Rewe', subCategoryId: 's1' }), tpl('b', { shopName: 'Aldi' }), tpl('c', { categoryId: 'c2' })],
      [sug('Lidl', { categoryId: 'c3' })], categories);
    expect(a).toMatchObject({ title: 'Wocheneinkauf', subtitle: 'Lebensmittel · Obst', shopName: 'Rewe', pinned: true, kind: 
'template', templateId: 'a', color: '#111111' });
    expect(b).toMatchObject({ title: 'Aldi', subtitle: 'Lebensmittel', shopName: 'Aldi' });
    expect(c).toMatchObject({ title: 'Drogerie', subtitle: 'Drogerie · Shop wählen', shopName: null });
    expect(d).toMatchObject({ title: 'Lidl', subtitle: 'Auto', shopName: 'Lidl', pinned: false, kind: 'suggestion', count: 3, color: '#333333' });
    expect(d.templateId).toBeUndefined();
  });

  it('silently drops tiles referencing unknown categories or sub categories', () => {
    const tiles = buildTiles(
      [tpl('a', { categoryId: 'gone' }), tpl('b', { subCategoryId: 'gone-sub' }), tpl('c', { name: 'Ok' })],
      [sug('X', { categoryId: 'gone' }), sug('Y', { subCategoryId: 'gone-sub' }), sug('Z', { categoryId: 'c3' })], categories);
    expect(tiles.map(t => t.title)).toEqual(['Ok', 'Z']);
  });

  it('returns an empty list without input', () => {
    expect(buildTiles([], [], categories)).toEqual([]);
  });
});

describe('isSuggestionCovered', () => {
  const s = { shopName: 'Billa', categoryId: 'c1', subCategoryId: null, count: 3 };
  const t = (shopName: string | null, subCategoryId: string | null = null) =>
    ({ id: 't', name: null, shopName, categoryId: 'c1', subCategoryId, sortOrder: 0 });

  it('is covered by a choose-shop or same-shop template in the same category', () => {
    expect(isSuggestionCovered(s, [t(null)])).toBe(true);
    expect(isSuggestionCovered(s, [t(' billa ')])).toBe(true);
  });

  it('is not covered by another shop or subcategory', () => {
    expect(isSuggestionCovered(s, [t('Spar')])).toBe(false);
    expect(isSuggestionCovered(s, [t(null, 's1')])).toBe(false);
  });
});
