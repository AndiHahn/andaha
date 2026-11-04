import { CategoryDto } from '../../../../api/shopping/dtos/CategoryDto';

export interface QuickEntryDraft {
  amountText: string;
  tileKey: string | null;
  shopName: string | null;
  categoryId: string | null;
  subCategoryId: string | null;
  date: string;
  savedAt: number;
}

const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const keyOf = (userId: string) => `andaha.quickEntryDraft.${userId}`;

export class QuickEntryDraftStore {
  constructor(private readonly storage: Storage, private readonly now: () => number) {}

  load(userId: string): QuickEntryDraft | null {
    try {
      const raw = this.storage.getItem(keyOf(userId));
      if (!raw) {
        return null;
      }
      const draft = JSON.parse(raw) as QuickEntryDraft;
      if (typeof draft?.savedAt !== 'number' || this.now() - draft.savedAt > MAX_AGE_MS) {
        this.clear(userId);
        return null;
      }
      return draft;
    } catch {
      return null;
    }
  }

  save(userId: string, draft: Omit<QuickEntryDraft, 'savedAt'>): void {
    try {
      this.storage.setItem(keyOf(userId), JSON.stringify({ ...draft, savedAt: this.now() }));
    } catch {
      // Speicher voll oder gesperrt: der Entwurf ist nur eine Komfortfunktion
    }
  }

  clear(userId: string): void {
    try {
      this.storage.removeItem(keyOf(userId));
    } catch {
      // siehe save
    }
  }
}

// Verweist der Entwurf auf eine geloeschte Kategorie/Unterkategorie, bleiben nur Betrag und Datum.
// Ob eine Vorlagen-Kachel (Schluessel t|id) noch existiert, prueft der Aufrufer gegen buildTiles.
export function restoreDraft(draft: QuickEntryDraft, categories: CategoryDto[]): QuickEntryDraft {
  const onlyAmountAndDate: QuickEntryDraft = {
    amountText: draft.amountText, date: draft.date, savedAt: draft.savedAt,
    tileKey: null, shopName: null, categoryId: null, subCategoryId: null,
  };
  const findCategory = (id: string) => categories.find(c => c.id === id);

  if (draft.categoryId) {
    const category = findCategory(draft.categoryId);
    if (!category) {
      return onlyAmountAndDate;
    }
    if (draft.subCategoryId && !category.subCategories.some(s => s.id === draft.subCategoryId)) {
      return onlyAmountAndDate;
    }
  } else if (draft.subCategoryId) {
    return onlyAmountAndDate;
  }

  if (draft.tileKey?.startsWith('s|')) {
    const [, , categoryId, subCategoryId] = draft.tileKey.split('|');
    const category = findCategory(categoryId);
    if (!category || (subCategoryId && !category.subCategories.some(s => s.id === subCategoryId))) {
      return onlyAmountAndDate;
    }
  }

  return { ...draft };
}
