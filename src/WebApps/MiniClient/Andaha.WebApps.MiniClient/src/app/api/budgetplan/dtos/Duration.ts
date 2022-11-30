export enum Duration {
  Monthly = 'Monthly',
  QuarterYear = 'QuarterYear',
  HalfYear = 'HalfYear',
  Year = 'Year'
}

export const DurationLabel = new Map<string, string>([
  [Duration.Monthly, 'monatlich'],
  [Duration.QuarterYear, 'vierteljährlich'],
  [Duration.HalfYear, 'halbjährlich'],
  [Duration.Year, 'jährlich']
]);
