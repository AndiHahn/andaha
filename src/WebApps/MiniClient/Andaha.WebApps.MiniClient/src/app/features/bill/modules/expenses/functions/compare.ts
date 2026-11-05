import { TimeRange } from 'src/app/shared/models/TimeRange';
import { DateType } from '../timerange-selection/DateType';

/**
 * Veränderung von `previous` zu `current` in ganzen Prozent.
 * `null`, wenn es keinen Vorwert gibt (`previous` 0), angezeigt als „neu“.
 */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) {
    return null;
  }

  // + 0 macht aus -0 eine 0
  return Math.round((current - previous) / previous * 100) + 0;
}

/** „+12 %“, „−14 %“ (typografisches Minus) bzw. „0 %“ */
export function formatPercentChange(change: number): string {
  if (change > 0) {
    return `+${change} %`;
  }
  if (change < 0) {
    return `−${Math.abs(change)} %`;
  }
  return '0 %';
}

/** Vergleichszeitraum: Vormonat bzw. Vorjahr, für Gesamt und Benutzerdefiniert `null` */
export function previousRange(range: TimeRange): TimeRange | null {
  const year = range.startDate.getFullYear();
  const month = range.startDate.getMonth();

  if (range.dateType === DateType.Month) {
    return { startDate: new Date(year, month - 1, 1), endDate: new Date(year, month, 0), dateType: DateType.Month };
  }

  if (range.dateType === DateType.Year) {
    return { startDate: new Date(year - 1, 0, 1), endDate: new Date(year - 1, 11, 31), dateType: DateType.Year };
  }

  return null;
}
