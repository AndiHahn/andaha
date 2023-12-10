import { Time } from "@angular/common";
import { getHoursFromTimeString, getMinutesFromTimeString } from "../../functions/api-utils";

export interface StatisticsDto extends StatisticsDtoBase {
  totalWorkingTime: Time;
}

export interface StatisticsDtoRaw extends StatisticsDtoBase {
  totalWorkingTime: string;
}

interface StatisticsDtoBase {
  extrapolatedMoneyToPay: number;
}

export function mapStatisticsDtoRaw(raw: StatisticsDtoRaw): StatisticsDto {
  return {
    ...raw,
    totalWorkingTime: {
      hours: getHoursFromTimeString(raw.totalWorkingTime),
      minutes: getMinutesFromTimeString(raw.totalWorkingTime)
    },
  }
}
