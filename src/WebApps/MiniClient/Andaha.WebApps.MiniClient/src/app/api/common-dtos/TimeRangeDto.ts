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
 * Verfügbarer Zeitraum oder null für ein Konto ohne Daten: Das Backend liefert dann den leeren
 * Zeitraum (default(DateTime), „0001-01-01T00:00:00“).
 */
export function mapAvailableTimeRangeDtoRaw(raw: TimeRangeDtoRaw): TimeRangeDto | null {
  return raw.startTimeUtc.startsWith('0001-01-01') ? null : mapTimeRangeDtoRaw(raw);
}
