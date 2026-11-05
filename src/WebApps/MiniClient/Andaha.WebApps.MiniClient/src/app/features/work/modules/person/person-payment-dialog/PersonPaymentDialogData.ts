import { Time } from "@angular/common";
import { PaymentDto } from "src/app/api/work/dtos/PaymentDto";

export interface PersonPaymentDialogData {
  personId: string;
  /** offene Stunden (gearbeitet − bezahlt); negativ, wenn mehr bezahlt als gearbeitet wurde */
  openHours: Time;
  /** Stundensatz für den vorbelegten Betrag */
  hourlyRate: number;
  /** zu bearbeitende Zahlung; ohne wird eine neue angelegt */
  payment?: PaymentDto;
}
