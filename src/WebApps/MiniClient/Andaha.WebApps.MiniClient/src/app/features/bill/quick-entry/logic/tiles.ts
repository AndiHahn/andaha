import { BillSuggestionDto } from '../../../../api/shopping/dtos/BillSuggestionDto';
import { BillTemplateDto } from '../../../../api/shopping/dtos/BillTemplateDto';
import { CategoryDto } from '../../../../api/shopping/dtos/CategoryDto';

export type QuickTile = {
  key: string;
  kind: 'template' | 'suggestion';
  templateId?: string;
  title: string;
  subtitle: string;
  categoryId: string;
  subCategoryId: string | null;
  shopName: string | null;
  pinned: boolean;
  color: string;
  count?: number;
};

const norm = (value: string | null | undefined): string => (value ?? '').trim().toLowerCase();

export function templateTileKey(templateId: string): string {
  return `t|${templateId}`;
}

export function suggestionTileKey(s: { shopName: string; categoryId: string; subCategoryId?: string | null }): string {
  return `s|${norm(s.shopName)}|${s.categoryId}|${s.subCategoryId ?? ''}`;
}

function resolve(categories: CategoryDto[], categoryId: string, subCategoryId: string | null | undefined) {
  const category = categories.find(c => c.id === categoryId);
  if (!category) {
    return null;
  }
  if (!subCategoryId) {
    return { category, subCategoryName: null };
  }
  const sub = category.subCategories.find(s => s.id === subCategoryId);
  return sub ? { category, subCategoryName: sub.name } : null;
}

export function buildTiles(templates: BillTemplateDto[], suggestions: BillSuggestionDto[], categories: CategoryDto[], max = 6): QuickTile[] {
  const tiles: QuickTile[] = [];

  for (const t of templates) {
    const resolved = resolve(categories, t.categoryId, t.subCategoryId);
    if (!resolved) {
      continue;
    }
    const shopName = t.shopName?.trim() || null;
    const detail = shopName === null ? 'Shop wählen' : resolved.subCategoryName;
    tiles.push({
      key: templateTileKey(t.id),
      kind: 'template',
      templateId: t.id,
      title: t.name?.trim() || shopName || resolved.category.name,
      subtitle: detail ? `${resolved.category.name} · ${detail}` : resolved.category.name,
      categoryId: t.categoryId,
      subCategoryId: t.subCategoryId ?? null,
      shopName,
      pinned: true,
      color: resolved.category.color,
    });
  }

  const covers = (s: BillSuggestionDto) => templates.some(t =>
    t.categoryId === s.categoryId
    && (t.subCategoryId ?? null) === (s.subCategoryId ?? null)
    && (!t.shopName?.trim() || norm(t.shopName) === norm(s.shopName)));

  for (const s of suggestions) {
    const resolved = resolve(categories, s.categoryId, s.subCategoryId);
    if (!resolved || covers(s)) {
      continue;
    }
    const shopName = s.shopName.trim();
    tiles.push({
      key: suggestionTileKey(s),
      kind: 'suggestion',
      title: shopName,
      subtitle: resolved.subCategoryName ? `${resolved.category.name} · ${resolved.subCategoryName}` : resolved.category.name,
      categoryId: s.categoryId,
      subCategoryId: s.subCategoryId ?? null,
      shopName,
      pinned: false,
      color: resolved.category.color,
      count: s.count,
    });
  }

  return tiles.slice(0, max);
}
