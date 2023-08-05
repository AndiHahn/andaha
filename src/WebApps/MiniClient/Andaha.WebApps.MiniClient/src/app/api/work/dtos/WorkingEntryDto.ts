import { Time } from "@angular/common";
import { getHoursFromTimeString, getMinutesFromTimeString } from "../../functions/api-utils";

export interface WorkingEntryDto extends WorkingEntryDtoBase {
  from: Date,
  until: Date,
  break: Time,
}

export interface WorkingEntryDtoRaw extends WorkingEntryDtoBase {
  from: string,
  until: string,
  break: string,
}

interface WorkingEntryDtoBase {
  id: string,
  notes?: string
}

export function mapWorkingEntryDtoRaw(raw: WorkingEntryDtoRaw): WorkingEntryDto {
  return {
    ...raw,
    from: new Date(raw.from),
    until: new Date(raw.until),
    break: {
      hours: getHoursFromTimeString(raw.break),
      minutes: getMinutesFromTimeString(raw.break)
    }
  }
}

export function mapWorkingEntryDtoRawList(raw: WorkingEntryDtoRaw[]): WorkingEntryDto[] {
  return raw.map(rawEntry => mapWorkingEntryDtoRaw(rawEntry));
}
