import { QuickTile } from './tiles';
import { QuickEntryState } from './quick-entry-state';

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
  it('can save and collapses the keypad when nothing is missing, in either order', () => {
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
    expect(b.keypadOpen()).toBe(false);
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
});
