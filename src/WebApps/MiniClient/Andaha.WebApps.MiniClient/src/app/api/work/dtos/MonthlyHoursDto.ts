/** Gearbeitete Stunden (Dezimalzahl) eines lokalen Monats ("yyyy-MM") aus GET api/work-statistics/monthly */
export interface MonthlyHoursDto {
  month: string;
  hours: number;
}
