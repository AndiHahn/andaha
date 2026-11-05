import { Time } from '@angular/common';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { getHoursFromTimeString, getMinutesFromTimeString } from 'src/app/api/functions/api-utils';
import { timeToMinutes } from './date-time-functions';

/** Format der bezahlten Stunden „h:mm“ bis „hhhh:mm“; dass der Wert größer als 0 ist, prüft isValidPayedHours */
export const PAYED_HOURS_PATTERN = /^\d{1,4}:[0-5]\d$/;

export interface PaymentPrefill {
  payedHours: string;
  payedMoney: number;
  payedTip: number;
}

/** Offene Stunden der Person (gearbeitet − bezahlt) als Dezimalzahl, nie unter 0 */
export function openHours(person: PersonDto): number {
  return openMinutes(person) / 60;
}

/** Offener Betrag: offene Stunden × Stundensatz, auf Cent gerundet, nie unter 0 */
export function openAmount(person: PersonDto): number {
  return amountForMinutes(openMinutes(person), person.hourlyRate);
}

/** Vorbelegung des Zahlungsdialogs: offene Stunden als „hh:mm“, Betrag dazu, Trinkgeld 0 */
export function paymentPrefill(person: PersonDto): PaymentPrefill {
  return prefill(openMinutes(person), person.hourlyRate);
}

/** Wie paymentPrefill, aus den offenen Stunden (negativ, wenn mehr bezahlt als gearbeitet wurde) und dem Stundensatz */
export function paymentPrefillFor(openTime: Time, hourlyRate: number): PaymentPrefill {
  return prefill(Math.max(0, timeToMinutes(openTime)), hourlyRate);
}

/** Bezahlte Stunden im Format „h:mm“ und größer als 0:00 (das Backend lehnt 0 ab) */
export function isValidPayedHours(value: string | null | undefined): boolean {
  if (!value || !PAYED_HOURS_PATTERN.test(value)) {
    return false;
  }

  return getHoursFromTimeString(value) * 60 + getMinutesFromTimeString(value) > 0;
}

/** Offene Minuten der Person, nie unter 0 */
export function openMinutes(person: PersonDto): number {
  return Math.max(0, timeToMinutes(person.totalHours) - timeToMinutes(person.payedHours));
}

function prefill(minutes: number, hourlyRate: number): PaymentPrefill {
  return {
    payedHours: formatPayedHours(minutes),
    payedMoney: amountForMinutes(minutes, hourlyRate),
    payedTip: 0
  };
}

/** Betrag für eine Dauer in Minuten zum Stundensatz, auf Cent gerundet, nie unter 0 */
export function amountForMinutes(minutes: number, hourlyRate: number): number {
  const amount = Math.round(minutes * hourlyRate / 60 * 100) / 100;
  return Math.max(0, amount);
}

function formatPayedHours(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
