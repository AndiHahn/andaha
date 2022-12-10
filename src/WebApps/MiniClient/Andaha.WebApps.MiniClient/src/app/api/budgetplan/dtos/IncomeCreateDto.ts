import { Duration } from "./Duration";

export interface IncomeCreateDto {
  name: string;
  value: number;
  duration: Duration;
}
