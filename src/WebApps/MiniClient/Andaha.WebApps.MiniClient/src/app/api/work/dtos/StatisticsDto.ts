import { Time } from "@angular/common";
import { getHoursFromTimeString, getMinutesFromTimeString } from "../../functions/api-utils";

export interface StatisticsDto extends StatisticsDtoBase{
  totalWorkingTime: Time;
  notPayedHours: Time;
}

export interface StatisticsDtoRaw extends StatisticsDtoBase {
  totalWorkingTime: string;
  notPayedHours: string;
}

interface StatisticsDtoBase {
  payedMoney: number;
}

export function mapStatisticsDtoRaw(raw: StatisticsDtoRaw): StatisticsDto {
  return {
    ...raw,
    totalWorkingTime: {
      hours: getHoursFromTimeString(raw.totalWorkingTime),
      minutes: getMinutesFromTimeString(raw.totalWorkingTime)
    },
    notPayedHours: {
      hours: getHoursFromTimeString(raw.notPayedHours),
      minutes: getMinutesFromTimeString(raw.notPayedHours)
    }
  }
}
