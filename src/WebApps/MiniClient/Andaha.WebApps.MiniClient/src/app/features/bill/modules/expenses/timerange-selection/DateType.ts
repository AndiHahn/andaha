export enum DateType {
  Month = 'Month',
  Year = 'Year',
  Total = 'Total',
  Custom = 'Custom'
}

export const DateTypeLabelMapping: Record<DateType, string> = {
  [DateType.Month]: "Monat",
  [DateType.Year]: "Jahr",
  [DateType.Total]: "Gesamt",
  [DateType.Custom]: "Benutzerdefiniert"
}

// Kurze Anzeigetexte fuer das Segment (umsetzung.md: Monat | Jahr | Gesamt | Von – Bis); DateTypeLabelMapping bleibt unveraendert
export const DATE_TYPE_SEGMENT_LABELS: Record<DateType, string> = {
  [DateType.Month]: "Monat",
  [DateType.Year]: "Jahr",
  [DateType.Total]: "Gesamt",
  [DateType.Custom]: "Von – Bis"
}
