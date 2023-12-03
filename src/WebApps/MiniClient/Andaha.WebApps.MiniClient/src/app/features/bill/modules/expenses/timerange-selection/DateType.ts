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
