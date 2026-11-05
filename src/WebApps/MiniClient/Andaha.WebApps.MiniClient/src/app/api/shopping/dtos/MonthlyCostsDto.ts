/** Ausgaben eines Monats ("yyyy-MM") aus GET api/expense/monthly */
export interface MonthlyCostsDto {
  month: string;
  costs: number;
}
