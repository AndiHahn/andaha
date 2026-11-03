import { Time } from "@angular/common";
import { getHoursFromTimeString, getMinutesFromTimeString } from "../../functions/api-utils";

export interface PaymentDto extends PaymentDtoBase {
  payedAt: Date,
  payedHours: Time
}

export interface PaymentDtoRaw extends PaymentDtoBase {
  payedAt: string,
  payedHours: string
}

interface PaymentDtoBase {
  id: string,
  payedMoney: number,
  payedTip: number,
  notes?: string
}

export function mapPaymentDtoRaw(raw: PaymentDtoRaw): PaymentDto {
  return {
    ...raw,
    payedAt: new Date(raw.payedAt),
    payedHours: {
      hours: getHoursFromTimeString(raw.payedHours),
      minutes: getMinutesFromTimeString(raw.payedHours)
    }
  }
}
