import { Time } from "@angular/common";
import { mapPaymentDtoRaw, PaymentDto, PaymentDtoRaw } from "./PaymentDto";
import { getHoursFromTimeString, getMinutesFromTimeString } from "../../functions/api-utils";

export interface PersonDto extends PersonDtoBase {
  totalHours: Time,
  payedHours: Time,
  payments: PaymentDto[]
}

export interface PersonDtoRaw extends PersonDtoBase {
  totalHours: string,
  payedHours: string,
  payments?: PaymentDtoRaw[]
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
    },
    payments: (raw.payments ?? []).map(mapPaymentDtoRaw)
  }
}

export function mapPersonDtoRawList(raw: PersonDtoRaw[]): PersonDto[] {
  return raw.map(rawEntry => mapPersonDtoRaw(rawEntry));
}
