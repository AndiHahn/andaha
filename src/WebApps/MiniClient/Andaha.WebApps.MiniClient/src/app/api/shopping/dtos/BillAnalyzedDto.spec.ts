import { mapBillAnalyzedDtoRaw } from './BillAnalyzedDto';

describe('mapBillAnalyzedDtoRaw', () => {
  it('maps date string to Date', () => {
    const mapped = mapBillAnalyzedDtoRaw({ id: 'a', date: '2024-01-02T00:00:00', imageAvailable: false, lineItems: [] });

    expect(mapped.date instanceof Date).toBeTrue();
  });

  it('maps missing date to undefined', () => {
    const mapped = mapBillAnalyzedDtoRaw({ id: 'a', date: null as any, imageAvailable: false, lineItems: [] });

    expect(mapped.date).toBeUndefined();
  });
});
