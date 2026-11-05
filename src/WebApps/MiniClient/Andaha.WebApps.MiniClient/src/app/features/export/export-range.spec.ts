import { exportRangePreset } from './export-range';

describe('exportRangePreset', () => {
  const available = { startDate: new Date(2023, 4, 12), endDate: new Date(2026, 10, 5) };
  const today = new Date(2026, 10, 5);

  it('this-month covers the whole current month', () => {
    expect(exportRangePreset('this-month', today, available)).toEqual({ start: new Date(2026, 10, 1), end: new Date(2026, 10, 30) });
  });

  it('this-month handles February in a leap year', () => {
    expect(exportRangePreset('this-month', new Date(2028, 1, 10), available).end).toEqual(new Date(2028, 1, 29));
  });

  it('this-year covers January to December', () => {
    expect(exportRangePreset('this-year', today, available)).toEqual({ start: new Date(2026, 0, 1), end: new Date(2026, 11, 31) });
  });

  it('last-year covers the previous calendar year', () => {
    expect(exportRangePreset('last-year', today, available)).toEqual({ start: new Date(2025, 0, 1), end: new Date(2025, 11, 31) });
  });

  it('all uses the available range', () => {
    expect(exportRangePreset('all', today, available)).toEqual({ start: available.startDate, end: available.endDate });
  });

  it('switches the year on New Year', () => {
    const newYear = new Date(2027, 0, 1);

    expect(exportRangePreset('this-year', newYear, available).start).toEqual(new Date(2027, 0, 1));
    expect(exportRangePreset('last-year', newYear, available).end).toEqual(new Date(2026, 11, 31));
    expect(exportRangePreset('this-month', newYear, available)).toEqual({ start: new Date(2027, 0, 1), end: new Date(2027, 0, 31) });
  });

  it('works on the last day of the year', () => {
    const newYearsEve = new Date(2026, 11, 31);

    expect(exportRangePreset('this-year', newYearsEve, available).end).toEqual(new Date(2026, 11, 31));
    expect(exportRangePreset('last-year', newYearsEve, available).start).toEqual(new Date(2025, 0, 1));
  });
});
