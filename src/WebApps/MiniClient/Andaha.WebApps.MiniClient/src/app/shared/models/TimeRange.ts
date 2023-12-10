import { TimeRangeDto } from "src/app/api/common-dtos/TimeRangeDto";
import { DateType } from "src/app/features/bill/modules/expenses/timerange-selection/DateType";

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  dateType?: DateType;
}

export function mapTimeRangeDto(timeRange: TimeRangeDto): TimeRange {
  return {
    startDate: timeRange.startTimeUtc,
    endDate: timeRange.endTimeUtc
  }
}
