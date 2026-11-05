import { dateFilterLabel } from './BillListDateFilter';

describe('dateFilterLabel', () => {
  it('names a full month like the statistics ("November 2026")', () => {
    expect(dateFilterLabel({ fromDate: new Date(2026, 10, 1), untilDate: new Date(2026, 10, 30) })).toBe('November 2026');
    expect(dateFilterLabel({ fromDate: new Date(2026, 1, 1), untilDate: new Date(2026, 1, 28, 23, 59, 59) })).toBe('Februar 2026');
  });

  it('shows a range within one year with the year once', () => {
    expect(dateFilterLabel({ fromDate: new Date(2026, 0, 1), untilDate: new Date(2026, 11, 31) })).toBe('01.01.–31.12.2026');
  });

  it('shows both years for a range across the turn of the year', () => {
    expect(dateFilterLabel({ fromDate: new Date(2025, 11, 15), untilDate: new Date(2026, 0, 15) })).toBe('15.12.2025–15.01.2026');
  });

  it('shows open ranges with "ab" and "bis"', () => {
    expect(dateFilterLabel({ fromDate: new Date(2026, 0, 1) })).toBe('ab 01.01.2026');
    expect(dateFilterLabel({ untilDate: new Date(2026, 11, 31) })).toBe('bis 31.12.2026');
  });

  it('is empty without a date filter', () => {
    expect(dateFilterLabel({})).toBe('');
  });
});
