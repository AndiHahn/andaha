import { BillDto } from '../../../../api/shopping/dtos/BillDto';
import { findDuplicate } from './duplicate';

const bill = (p: Partial<BillDto> = {}): BillDto => ({
  id: 'b1', category: { id: 'x1', name: 'Lebensmittel', color: '#000000', order: 0 },
  subCategory: { id: 'y1', name: 'Obst', order: 0 }, shopName: 'Rewe', price: 12.5,
  date: new Date(2026, 10, 4, 14, 30), isExternal: false, fromAnalysis: false, imageAvailable: false, ...p,
});
const candidate = { shopName: 'Rewe', price: 12.5, date: new Date(2026, 10, 4, 9, 0), categoryName: 'Lebensmittel', subCategoryName: 'Obst' as string | null };

describe('findDuplicate', () => {
  it('finds the same bill', () => {
    const b = bill();
    expect(findDuplicate(candidate, [bill({ id: 'other', price: 1 }), b])).toBe(b);
  });
  it('matches a partner bill with a different category id but the same name', () => {
    const partner = bill({ isExternal: true, category: { id: 'zz', name: 'lebensmittel ', color: '#fff', order: 3 }, subCategory: { id: 'zy', name: ' OBST', order: 1 } });
    expect(findDuplicate(candidate, [partner])).toBe(partner);
  });
  it('compares shop trimmed and case-insensitive', () => {
    expect(findDuplicate({ ...candidate, shopName: '  REWE ' }, [bill()])).toBeDefined();
  });
  it('compares price in cents', () => {
    expect(findDuplicate({ ...candidate, price: 12.499999 }, [bill()])).toBeDefined();
    expect(findDuplicate({ ...candidate, price: 12.51 }, [bill()])).toBeUndefined();
  });
  it('does not match another calendar day', () => {
    expect(findDuplicate({ ...candidate, date: new Date(2026, 10, 5, 0, 5) }, [bill()])).toBeUndefined();
    expect(findDuplicate({ ...candidate, date: new Date(2026, 10, 3, 23, 59) }, [bill()])).toBeUndefined();
  });
  it('does not match another category or sub category', () => {
    expect(findDuplicate({ ...candidate, categoryName: 'Auto' }, [bill()])).toBeUndefined();
    expect(findDuplicate({ ...candidate, subCategoryName: 'Gemuese' }, [bill()])).toBeUndefined();
    expect(findDuplicate({ ...candidate, subCategoryName: null }, [bill()])).toBeUndefined();
  });
  it('treats missing sub categories on both sides as equal', () => {
    expect(findDuplicate({ ...candidate, subCategoryName: null }, [bill({ subCategory: undefined })])).toBeDefined();
    expect(findDuplicate(candidate, [bill({ subCategory: undefined })])).toBeUndefined();
  });
  it('does not match a different shop', () => {
    expect(findDuplicate({ ...candidate, shopName: 'Aldi' }, [bill()])).toBeUndefined();
  });
});
