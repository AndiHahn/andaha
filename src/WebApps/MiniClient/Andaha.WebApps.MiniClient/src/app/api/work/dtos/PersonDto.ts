import { Time } from "@angular/common";
import { getHoursFromTimeString, getMinutesFromTimeString } from "../../functions/api-utils";

export interface PersonDto extends PersonDtoBase {
  lastPayed: Date,
  totalHours: Time,
  payedHours: Time
}

export interface PersonDtoRaw extends PersonDtoBase {
  lastPayed: string,
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
    lastPayed: new Date(raw.lastPayed),
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
