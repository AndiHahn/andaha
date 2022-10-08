import { TimeRangeDto } from "src/app/api/shopping/dtos/TimeRangeDto";

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export function mapTimeRangeDto(timeRange: TimeRangeDto): TimeRange {
  return {
    startDate: timeRange.startTimeUtc,
    endDate: timeRange.endTimeUtc
  }
}
