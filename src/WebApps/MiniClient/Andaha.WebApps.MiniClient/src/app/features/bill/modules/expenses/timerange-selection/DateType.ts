export enum DateType {
  Month = 'Month',
  Year = 'Year',
  Custom = 'Custom'
}

export const DateTypeLabelMapping: Record<DateType, string> = {
  [DateType.Month]: "Monat",
  [DateType.Year]: "Jahr",
  [DateType.Custom]: "Benutzerdefiniert"
}
