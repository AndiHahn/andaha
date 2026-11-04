import { QuickTile } from './tiles';
import { fromDayKey, QuickEntryState, toDayKey } from './quick-entry-state';

const tile = (p: Partial<QuickTile> = {}): QuickTile => ({
  key: 't|1', kind: 'template', templateId: '1', title: 'Rewe', subtitle: 'Lebensmittel', categoryId: 'c1', subCategoryId: null,
  shopName: 'Rewe', pinned: true, color: '#111', ...p,
});

describe('QuickEntryState', () => {
  it('starts empty with the keypad open', () => {
    const s = new QuickEntryState();
    expect(s.amountText()).toBe('');
    expect(s.tile()).toBeNull();
    expect(s.shopName()).toBeNull();
    expect(s.keypadOpen()).toBe(true);
    expect(s.amount()).toBeNull();
    expect(s.missing()).toEqual(['amount', 'template']);
    expect(s.canSave()).toBe(false);
    expect(s.hint()).toBe('Betrag eingeben und Vorlage wählen');
  });
  it('hints per missing part', () => {
    const s = new QuickEntryState();
    s.pressKey('5');
    expect(s.hint()).toBe('Vorlage wählen');
    const t = new QuickEntryState();
    t.selectTile(tile());
    expect(t.hint()).toBe('Betrag eingeben');
    const u = new QuickEntryState();
    u.pressKey('5');
    u.selectTile(tile({ shopName: null }));
    expect(u.missing()).toEqual(['shop']);
    expect(u.hint()).toBe('Shop wählen');
  });
  it('can save in either order; selecting the tile last folds the keypad', () => {
    const a = new QuickEntryState();
    a.pressKey('1'); a.pressKey(','); a.pressKey('5');
    expect(a.keypadOpen()).toBe(true);
    a.selectTile(tile());
    expect(a.missing()).toEqual([]);
    expect(a.canSave()).toBe(true);
    expect(a.hint()).toBe('');
    expect(a.keypadOpen()).toBe(false);
    expect(a.amount()).toBe(1.5);
    a.openKeypad();
    expect(a.keypadOpen()).toBe(true);

    const b = new QuickEntryState();
    b.selectTile(tile());
    expect(b.keypadOpen()).toBe(true);
    b.pressKey('9');
    // Tastatur bleibt offen, solange der Betrag eingegeben wird
    expect(b.canSave()).toBe(true);
    expect(b.keypadOpen()).toBe(true);
  });
  it('typing never folds the keypad, also when editing after reopening', () => {
    const s = new QuickEntryState();
    s.selectTile(tile());
    for (const key of ['6', ',', '8', '0'] as const) {
      s.pressKey(key);
    }
    expect(s.amountText()).toBe('6,80');
    expect(s.keypadOpen()).toBe(true);
    s.selectTile(tile({ key: 't|2' }));
    expect(s.keypadOpen()).toBe(false);
    s.openKeypad();
    s.pressKey('del');
    expect(s.keypadOpen()).toBe(true);
  });
  it('selectShop completes a choose-shop tile and collapses the keypad', () => {
    const s = new QuickEntryState();
    s.pressKey('9');
    s.selectTile(tile({ shopName: null }));
    expect(s.keypadOpen()).toBe(true);
    s.selectShop('Aldi');
    expect(s.shopName()).toBe('Aldi');
    expect(s.canSave()).toBe(true);
    expect(s.keypadOpen()).toBe(false);
  });
  it('selecting a tile takes over its fixed shop, or clears the shop', () => {
    const s = new QuickEntryState();
    s.selectTile(tile());
    expect(s.shopName()).toBe('Rewe');
    s.selectTile(tile({ key: 't|2', shopName: null }));
    expect(s.shopName()).toBeNull();
  });
  it('treats an invalid amount as missing', () => {
    const s = new QuickEntryState();
    s.pressKey('0');
    s.selectTile(tile());
    expect(s.missing()).toEqual(['amount']);
    expect(s.canSave()).toBe(false);
  });
  it('"Andere …" needs a shop and a category instead of a tile and keeps the keypad closed', () => {
    const s = new QuickEntryState();
    s.pressKey('4');
    s.selectTile(tile());
    s.selectOther();
    expect(s.other()).toBe(true);
    expect(s.tile()).toBeNull();
    expect(s.shopName()).toBeNull();
    expect(s.keypadOpen()).toBe(false);
    expect(s.missing()).toEqual(['shop', 'category']);
    expect(s.hint()).toBe('Shop wählen');
    s.selectShop('Café Central');
    expect(s.hint()).toBe('Kategorie wählen');
    s.selectCategory('c2', 's2');
    expect(s.canSave()).toBe(true);
    expect(s.categoryId()).toBe('c2');
    expect(s.subCategoryId()).toBe('s2');
    expect(s.keypadOpen()).toBe(false);
  });
  it('"Andere …" without amount and shop asks for both', () => {
    const s = new QuickEntryState();
    s.selectOther();
    expect(s.missing()).toEqual(['amount', 'shop', 'category']);
    expect(s.hint()).toBe('Betrag eingeben');
  });
  it('category and subcategory follow the selected tile', () => {
    const s = new QuickEntryState();
    s.selectTile(tile({ categoryId: 'c9', subCategoryId: 's9' }));
    expect(s.categoryId()).toBe('c9');
    expect(s.subCategoryId()).toBe('s9');
  });
  it('leaving "Andere …" returns to the tiles without a selection', () => {
    const s = new QuickEntryState();
    s.selectOther();
    s.selectShop('X');
    s.selectCategory('c1', null);
    s.leaveOther();
    expect(s.other()).toBe(false);
    expect(s.shopName()).toBeNull();
    expect(s.categoryId()).toBeNull();
    expect(s.keypadOpen()).toBe(true);
  });
  it('selecting a tile leaves "Andere …"', () => {
    const s = new QuickEntryState();
    s.selectOther();
    s.selectCategory('c1', null);
    s.selectTile(tile());
    expect(s.other()).toBe(false);
    expect(s.categoryId()).toBe('c1');
    expect(s.shopName()).toBe('Rewe');
  });
  it('reset clears everything and sets the date to today', () => {
    const s = new QuickEntryState();
    s.pressKey('4');
    s.selectTile(tile());
    s.date.set(new Date(2020, 0, 1));
    s.reset();
    expect(s.amountText()).toBe('');
    expect(s.tile()).toBeNull();
    expect(s.keypadOpen()).toBe(true);
    expect(toDayKey(s.date())).toBe(toDayKey(new Date()));
  });
});

describe('day keys', () => {
  it('round-trips a local calendar day', () => {
    expect(toDayKey(new Date(2026, 10, 3, 23, 59))).toBe('2026-11-03');
    const d = fromDayKey('2026-11-03');
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(10);
    expect(d?.getDate()).toBe(3);
    expect(fromDayKey('kaputt')).toBeNull();
  });
});
