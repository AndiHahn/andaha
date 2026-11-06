import { BillLineItemDto } from 'src/app/api/shopping/dtos/BillLineItemDto';
import { filterLineItems, lineItemsSum, parseLineItemPrice, parseLineItemQuantity, sanitizeDrafts, sumDeviates } from './line-items';

const item = (description: string, totalPrice?: number | null): BillLineItemDto => ({ id: description, description, totalPrice });

describe('line-items', () => {
  it('lineItemsSum skips null prices and subtracts discounts', () => {
    expect(lineItemsSum([item('Milch', 1.49), item('Brot', null), item('Rabatt', -0.5), item('Käse', 0.1)])).toBe(1.09);
    expect(lineItemsSum([])).toBe(0);
  });

  it('sumDeviates: 0.01 tolerated, 0.02 deviates', () => {
    expect(sumDeviates([item('a', 9.99)], 10)).toBe(false);
    expect(sumDeviates([item('a', 9.98)], 10)).toBe(true);
    expect(sumDeviates([item('a', 10.02)], 10)).toBe(true);
  });

  it('sumDeviates is false without any priced item', () => {
    expect(sumDeviates([item('a', null)], 10)).toBe(false);
    expect(sumDeviates([], 10)).toBe(false);
  });

  it('filterLineItems ignores case and trims, keeps all items', () => {
    const result = filterLineItems([item('Bio Milch'), item('Brot')], '  MILCH ');
    expect(result.map(r => r.match)).toEqual([true, false]);
    expect(filterLineItems([item('Brot')], '   ')).toEqual([{ item: item('Brot'), match: false }]);
  });

  // dieselben Regeln wie LineItemSanitizer im Backend (design.md §5.1)
  it('sanitizeDrafts trims, drops empty, truncates to 200, quantity <= 0 to null, keeps prices and order', () => {
    const long = 'x'.repeat(205);
    const result = sanitizeDrafts([
      { description: '  Milch ', quantity: 2, unitPrice: 1.49, totalPrice: 2.98 },
      { description: '   ', quantity: 1, totalPrice: 5 },
      { totalPrice: 1 },
      { description: 'Rabatt', quantity: 0, unitPrice: -1, totalPrice: -1 },
      { description: 'Pfand', quantity: -3, totalPrice: -0.25 },
      { description: long, quantity: null, unitPrice: null, totalPrice: null }
    ]);

    expect(result).toEqual([
      { description: 'Milch', quantity: 2, unitPrice: 1.49, totalPrice: 2.98 },
      { description: 'Rabatt', quantity: null, unitPrice: -1, totalPrice: -1 },
      { description: 'Pfand', quantity: null, unitPrice: null, totalPrice: -0.25 },
      { description: 'x'.repeat(200), quantity: null, unitPrice: null, totalPrice: null }
    ]);
  });

  it('parseLineItemPrice: comma or dot, negative and zero allowed, empty is null, garbage invalid', () => {
    expect(parseLineItemPrice('3,4')).toBe(3.4);
    expect(parseLineItemPrice(' -1,50 ')).toBe(-1.5);
    expect(parseLineItemPrice('−2.5')).toBe(-2.5);
    expect(parseLineItemPrice('0')).toBe(0);
    expect(parseLineItemPrice('-0,00')).toBe(0);
    expect(parseLineItemPrice('')).toBeNull();
    expect(parseLineItemPrice('1,2,3')).toBeUndefined();
    expect(parseLineItemPrice('1,234')).toBeUndefined();
    expect(parseLineItemPrice('-')).toBeUndefined();
  });

  it('parseLineItemQuantity: whole number >= 1, empty is null, others invalid', () => {
    expect(parseLineItemQuantity('3')).toBe(3);
    expect(parseLineItemQuantity(' ')).toBeNull();
    expect(parseLineItemQuantity('0')).toBeUndefined();
    expect(parseLineItemQuantity('-1')).toBeUndefined();
    expect(parseLineItemQuantity('1,5')).toBeUndefined();
    expect(parseLineItemQuantity('99999999999')).toBeUndefined();
  });
});
