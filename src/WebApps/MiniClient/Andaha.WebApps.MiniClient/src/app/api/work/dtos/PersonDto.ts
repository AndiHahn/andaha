import { Time } from "@angular/common";
import { getHoursFromTimeString, getMinutesFromTimeString } from "../../functions/api-utils";

export interface PersonDto extends PersonDtoBase {
  totalHours: Time,
  payedHours: Time
}

export interface PersonDtoRaw extends PersonDtoBase {
  totalHours: string,
  payedHours: string
}

interface PersonDtoBase {
  id: string,
  name: string,
  hourlyRate: number,
  notes?: string,
}

export function mapPersonDtoRaw(raw: PersonDtoRaw): PersonDto {
  return {
    ...raw,
    totalHours: {
      hours: getHoursFromTimeString(raw.totalHours),
      minutes: getMinutesFromTimeString(raw.totalHours)
    },
    payedHours: {
      hours: getHoursFromTimeString(raw.payedHours),
      minutes: getMinutesFromTimeString(raw.payedHours)
    }
  }
}

export function mapPersonDtoRawList(raw: PersonDtoRaw[]): PersonDto[] {
  return raw.map(rawEntry => mapPersonDtoRaw(rawEntry));
}
