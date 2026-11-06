import { BillLineItemDto } from 'src/app/api/shopping/dtos/BillLineItemDto';
import { filterLineItems, lineItemsSum, sumDeviates } from './line-items';

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
});
