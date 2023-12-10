import { Time } from "@angular/common";
import { getHoursFromTimeString, getMinutesFromTimeString } from "../../functions/api-utils";

export interface FullStatisticsDto extends FullStatisticsDtoBase {
  totalWorkingTime: Time,
  notPayedHours: Time,
}

export interface FullStatisticsDtoRaw extends FullStatisticsDtoBase {
  totalWorkingTime: string,
  notPayedHours: string,
}

interface FullStatisticsDtoBase {
  payedMoney: number,
  notPayedMoney: number
}

export function mapFullStatisticsDtoRaw(raw: FullStatisticsDtoRaw): FullStatisticsDto {
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
