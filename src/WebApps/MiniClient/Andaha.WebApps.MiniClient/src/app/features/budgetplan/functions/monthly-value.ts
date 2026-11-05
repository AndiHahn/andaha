import { Duration } from 'src/app/api/budgetplan/dtos/Duration';

/** Monate je Intervall; das Backend rechnet genauso (`GetMonthlyValue`) */
const MONTHS_PER_DURATION: Record<Duration, number> = {
  [Duration.Monthly]: 1,
  [Duration.QuarterYear]: 3,
  [Duration.HalfYear]: 6,
  [Duration.Year]: 12
};

/** Betrag je Intervall auf einen Monat umgerechnet */
export function monthlyValue(value: number, duration: Duration): number {
  return value / MONTHS_PER_DURATION[duration];
}
