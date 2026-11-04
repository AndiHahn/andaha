import { CategoryDto } from '../../../../api/shopping/dtos/CategoryDto';
import { QuickEntryDraft, QuickEntryDraftStore, restoreDraft } from './draft-store';

const DAY = 24 * 60 * 60 * 1000;
const draft = (p: Partial<Omit<QuickEntryDraft, 'savedAt'>> = {}): Omit<QuickEntryDraft, 'savedAt'> =>
  ({ amountText: '12,5', tileKey: 's|Rewe|c1|s1', shopName: 'Rewe', categoryId: 'c1', subCategoryId: 's1', date: '2026-11-04', ...p });

describe('QuickEntryDraftStore', () => {
  let storage: Storage;
  let now: number;
  let store: QuickEntryDraftStore;
  beforeEach(() => {
    storage = window.localStorage;
    storage.clear();
    now = 1_000_000;
    store = new QuickEntryDraftStore(storage, () => now);
  });
  afterEach(() => storage.clear());

  it('saves and loads per user with savedAt', () => {
    store.save('u1', draft());
    expect(storage.getItem('andaha.quickEntryDraft.u1')).not.toBeNull();
    expect(store.load('u1')).toEqual({ ...draft(), savedAt: 1_000_000 });
    expect(store.load('u2')).toBeNull();
  });
  it('clears', () => {
    store.save('u1', draft());
    store.clear('u1');
    expect(store.load('u1')).toBeNull();
    expect(storage.getItem('andaha.quickEntryDraft.u1')).toBeNull();
  });
  it('keeps a draft of exactly 24 h', () => {
    store.save('u1', draft());
    now += DAY;
    expect(store.load('u1')).not.toBeNull();
  });
  it('expires after 24 h + 1 ms and removes the entry', () => {
    store.save('u1', draft());
    now += DAY + 1;
    expect(store.load('u1')).toBeNull();
    expect(storage.getItem('andaha.quickEntryDraft.u1')).toBeNull();
  });
  it('ignores corrupt data', () => {
    storage.setItem('andaha.quickEntryDraft.u1', '{nope');
    expect(store.load('u1')).toBeNull();
  });
  it('does not throw when storage throws', () => {
    const fail = () => { throw new Error('x'); };
    const broken = { getItem: fail, setItem: fail, removeItem: fail } as unknown as Storage;
    const s = new QuickEntryDraftStore(broken, () => 0);
    expect(() => s.save('u', draft())).not.toThrow();
    expect(s.load('u')).toBeNull();
    expect(() => s.clear('u')).not.toThrow();
  });
});

describe('restoreDraft', () => {
  const categories: CategoryDto[] = [
    { id: 'c1', name: 'Lebensmittel', color: '#111', order: 0, includeToStatistics: true, isDefault: false, subCategories: [{ id: 's1', name: 'Obst', order: 0 }] },
  ];
  const full = (p: Partial<QuickEntryDraft> = {}): QuickEntryDraft => ({ ...draft(), savedAt: 5, ...p });

  it('keeps a valid draft unchanged', () => {
    expect(restoreDraft(full(), categories)).toEqual(full());
  });
  it('keeps only amount and date when the category is gone', () => {
    const r = restoreDraft(full({ categoryId: 'gone' }), categories);
    expect(r).toEqual({ amountText: '12,5', date: '2026-11-04', savedAt: 5, tileKey: null, shopName: null, categoryId: null, subCategoryId: null });
  });
  it('keeps only amount and date when the sub category is gone', () => {
    const r = restoreDraft(full({ subCategoryId: 'gone' }), categories);
    expect(r).toMatchObject({ amountText: '12,5', date: '2026-11-04', tileKey: null, shopName: null, categoryId: null, subCategoryId: null });
  });
  it('drops a suggestion tile key whose category is gone', () => {
    const r = restoreDraft(full({ tileKey: 's|Rewe|gone|', categoryId: null, subCategoryId: null }), categories);
    expect(r).toMatchObject({ amountText: '12,5', tileKey: null, shopName: null });
  });
  it('accepts a draft without any selection', () => {
    const d = full({ tileKey: null, shopName: null, categoryId: null, subCategoryId: null });
    expect(restoreDraft(d, categories)).toEqual(d);
  });
});
