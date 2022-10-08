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
