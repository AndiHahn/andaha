import { Duration } from 'src/app/api/budgetplan/dtos/Duration';
import { monthlyValue } from './monthly-value';

describe('monthlyValue', () => {
  it('divides by the months of the interval', () => {
    expect(monthlyValue(100, Duration.Monthly)).toBe(100);
    expect(monthlyValue(360, Duration.QuarterYear)).toBe(120);
    expect(monthlyValue(120, Duration.HalfYear)).toBe(20);
    expect(monthlyValue(240, Duration.Year)).toBe(20);
  });
});
