import { parseLocalDateTime } from 'src/app/shared/utils/utils';

export interface TimeRangeDto {
  startTimeUtc: Date;
  endTimeUtc: Date;
}

export interface TimeRangeDtoRaw {
  startTimeUtc: string;
  endTimeUtc: string;
}

export function mapTimeRangeDtoRaw(raw: TimeRangeDtoRaw): TimeRangeDto {
  return {
    startTimeUtc: new Date(raw.startTimeUtc),
    endTimeUtc: new Date(raw.endTimeUtc)
  }
}

/**
 * Verfügbarer Zeitraum (echte UTC-Zeitpunkte, z. B. Arbeitszeiten) oder null für ein Konto ohne Daten:
 * Das Backend liefert dann den leeren Zeitraum (default(DateTime), „0001-01-01T00:00:00“).
 */
export function mapAvailableTimeRangeDtoRaw(raw: TimeRangeDtoRaw): TimeRangeDto | null {
  return isEmptyTimeRange(raw) ? null : mapTimeRangeDtoRaw(raw);
}

/**
 * Verfügbarer Zeitraum der Rechnungen (GET api/expense/time-range) oder null ohne Rechnungen. Rechnungsdaten
 * sind gespeicherte Ortszeit, als UTC markiert: beide Enden wie bei mapBillDtoRaw als Ortszeit lesen.
 * Die Arbeitszeiten (Work) sind echte UTC-Zeitpunkte und nutzen mapAvailableTimeRangeDtoRaw.
 */
export function mapAvailableBillTimeRangeDtoRaw(raw: TimeRangeDtoRaw): TimeRangeDto | null {
  return isEmptyTimeRange(raw)
    ? null
    : { startTimeUtc: parseLocalDateTime(raw.startTimeUtc), endTimeUtc: parseLocalDateTime(raw.endTimeUtc) };
}

function isEmptyTimeRange(raw: TimeRangeDtoRaw): boolean {
  return raw.startTimeUtc.startsWith('0001-01-01');
}
