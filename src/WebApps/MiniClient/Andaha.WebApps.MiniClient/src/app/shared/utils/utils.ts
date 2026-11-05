import moment from "moment";

export function getRecordOfProperties<T extends object>(object: T): Record<string, any> {
  const record: Record<string, any> = {};

  for (const [key, value] of Object.entries(object)) {
    if (value instanceof Date) {
      record[key] = toLocalDateTimeString(value);
    } else {
      record[key] = value;
    }
  }
  
  return record;
}

/**
 * Rechnungsdatum für das Backend: die lokale Uhrzeit ohne Zonenangabe („2026-11-05T23:30:00.000“).
 * Der Server speichert sie unverändert, so bleibt der gewählte Kalendertag auch zwischen 23 und 24 Uhr.
 */
export function toLocalDateTimeString(date: Date): string {
  return moment(date).format('YYYY-MM-DDTHH:mm:ss.SSS');
}

/**
 * Rechnungsdatum vom Backend: gespeichert ist die lokale Uhrzeit, der Server markiert sie aber als UTC („…Z“).
 * Die Ziffern werden darum als Ortszeit gelesen (Tag und Uhrzeit wie beim Speichern).
 */
export function parseLocalDateTime(value: string): Date {
  return moment.parseZone(value).local(true).toDate();
}
