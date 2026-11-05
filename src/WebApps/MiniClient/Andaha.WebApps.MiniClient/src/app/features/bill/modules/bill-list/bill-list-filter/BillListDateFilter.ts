import { formatDate } from '@angular/common';

export interface BillListDateFilter {
  fromDate?: Date;
  untilDate?: Date;
}

/**
 * Text des Datums-Chips: ganzer Monat als „November 2026“ (wie die Statistik ihn setzt),
 * sonst „01.01.–31.12.2026“, über den Jahreswechsel mit beiden Jahren, offen mit „ab“ bzw. „bis“.
 */
export function dateFilterLabel(filter: BillListDateFilter): string {
  const { fromDate: from, untilDate: until } = filter;
  if (from && until) {
    if (isFullMonth(from, until)) {
      return formatDate(from, 'LLLL yyyy', 'de');
    }
    const fromFormat = from.getFullYear() === until.getFullYear() ? 'dd.MM.' : 'dd.MM.yyyy';
    return `${formatDate(from, fromFormat, 'de')}–${formatDate(until, 'dd.MM.yyyy', 'de')}`;
  }
  if (from) {
    return `ab ${formatDate(from, 'dd.MM.yyyy', 'de')}`;
  }
  if (until) {
    return `bis ${formatDate(until, 'dd.MM.yyyy', 'de')}`;
  }
  return '';
}

/** vom Ersten bis zum Letzten desselben Monats (Uhrzeit egal) */
function isFullMonth(from: Date, until: Date): boolean {
  const lastDay = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
  return from.getDate() === 1
    && until.getFullYear() === from.getFullYear()
    && until.getMonth() === from.getMonth()
    && until.getDate() === lastDay;
}
