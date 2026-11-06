import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { duplicatePrefill } from './duplicate-prefill';

describe('duplicatePrefill', () => {
  const bill: BillDto = {
    id: 'b1',
    category: { id: 'c1', name: 'Lebensmittel', color: '#3B7D4F', order: 0 },
    subCategory: { id: 's1', name: 'Gebäck', order: 0 },
    shopName: 'Bäckerei Ströck',
    price: 6.4,
    notes: 'Frühstück',
    date: new Date(2026, 9, 3, 12, 0),
    isExternal: false,
    fromAnalysis: false,
    imageAvailable: true
  };

  it('takes price, shop, category, sub category and notes, dates it today and leaves out the photo', () => {
    const prefill = duplicatePrefill(bill, new Date(2026, 10, 5, 0, 30));

    expect(prefill).toEqual({
      price: 6.4,
      shopName: 'Bäckerei Ströck',
      categoryId: 'c1',
      subCategoryId: 's1',
      notes: 'Frühstück',
      date: '2026-11-05'
    });
    expect(prefill.imageKey).toBeUndefined();
  });

  // design.md §5.2 [Entscheidung]: „Duplizieren“ übernimmt keine Positionen
  it('duplicate does not copy line items', () => {
    const prefill = duplicatePrefill(
      { ...bill, lineItems: [{ id: 'l1', description: 'Milch', quantity: 2, unitPrice: 1.49, totalPrice: 2.98 }] },
      new Date(2026, 10, 5));

    expect(prefill.lineItems).toBeUndefined();
  });

  it('sets no sub category when the bill has none', () => {
    const prefill = duplicatePrefill({ ...bill, subCategory: undefined, notes: undefined }, new Date(2026, 10, 5));

    expect(prefill.subCategoryId).toBeNull();
    expect(prefill.notes).toBeUndefined();
  });
});
