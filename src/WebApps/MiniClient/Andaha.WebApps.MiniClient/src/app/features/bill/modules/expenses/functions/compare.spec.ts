import { DateType } from '../timerange-selection/DateType';
import { formatPercentChange, percentChange, previousRange } from './compare';

describe('compare', () => {
  describe('percentChange', () => {
    it('more spending gives a positive whole percentage', () => {
      expect(percentChange(112, 100)).toBe(12);
    });

    it('less spending gives a negative whole percentage', () => {
      expect(percentChange(88, 100)).toBe(-12);
    });

    it('previous 0 gives null', () => {
      expect(percentChange(5, 0)).toBeNull();
    });

    it('rounds to whole percent', () => {
      expect(percentChange(100.4, 100)).toBe(0);
      expect(percentChange(133.33, 100)).toBe(33);
    });
  });

  describe('formatPercentChange', () => {
    it('formats sign, typographic minus and unit', () => {
      expect(formatPercentChange(12)).toBe('+12 %');
      expect(formatPercentChange(-14)).toBe('−14 %');
      expect(formatPercentChange(0)).toBe('0 %');
    });
  });

  describe('previousRange', () => {
    it('january gives december of the previous year', () => {
      const result = previousRange({ startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 31), dateType: DateType.Month });

      expect(result).toEqual({ startDate: new Date(2025, 11, 1), endDate: new Date(2025, 11, 31), dateType: DateType.Month });
    });

    it('month gives the previous month with its last day', () => {
      const result = previousRange({ startDate: new Date(2026, 2, 1), endDate: new Date(2026, 2, 31), dateType: DateType.Month });

      expect(result).toEqual({ startDate: new Date(2026, 1, 1), endDate: new Date(2026, 1, 28), dateType: DateType.Month });
    });

    it('year gives the previous year', () => {
      const result = previousRange({ startDate: new Date(2026, 0, 1), endDate: new Date(2026, 11, 31), dateType: DateType.Year });

      expect(result).toEqual({ startDate: new Date(2025, 0, 1), endDate: new Date(2025, 11, 31), dateType: DateType.Year });
    });

    it('total and custom give null', () => {
      expect(previousRange({ startDate: new Date(2024, 0, 1), endDate: new Date(2026, 10, 5), dateType: DateType.Total })).toBeNull();
      expect(previousRange({ startDate: new Date(2026, 0, 3), endDate: new Date(2026, 0, 9), dateType: DateType.Custom })).toBeNull();
    });
  });
});
