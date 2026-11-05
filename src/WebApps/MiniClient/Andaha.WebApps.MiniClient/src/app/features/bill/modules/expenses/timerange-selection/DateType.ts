export enum DateType {
  Month = 'Month',
  Year = 'Year',
  Total = 'Total',
  Custom = 'Custom'
}

// Kurze Anzeigetexte fuer das Segment (umsetzung.md: Monat | Jahr | Gesamt | Von – Bis)
export const DATE_TYPE_SEGMENT_LABELS: Record<DateType, string> = {
  [DateType.Month]: "Monat",
  [DateType.Year]: "Jahr",
  [DateType.Total]: "Gesamt",
  [DateType.Custom]: "Von – Bis"
}
