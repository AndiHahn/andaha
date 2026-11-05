import { TimeRange } from 'src/app/shared/models/TimeRange';

export type ExportRangePreset = 'this-month' | 'this-year' | 'last-year' | 'all';

/** Zeitraum (inklusive Start- und Endtag) einer Schnellwahl; „Alles“ ist der verfügbare Zeitraum der Ausgaben. */
export function exportRangePreset(preset: ExportRangePreset, today: Date, available: TimeRange): { start: Date; end: Date } {
  const year = today.getFullYear();

  switch (preset) {
    case 'this-month':
      return { start: new Date(year, today.getMonth(), 1), end: new Date(year, today.getMonth() + 1, 0) };
    case 'this-year':
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
    case 'last-year':
      return { start: new Date(year - 1, 0, 1), end: new Date(year - 1, 11, 31) };
    case 'all':
      return { start: available.startDate, end: available.endDate };
  }
}
