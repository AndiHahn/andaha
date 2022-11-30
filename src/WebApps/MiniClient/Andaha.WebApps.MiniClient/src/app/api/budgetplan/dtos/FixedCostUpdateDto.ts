import { CostCategory } from "./CostCategory";
import { Duration } from "./Duration";

export interface FixedCostUpdateDto {
  name: string;
  value: number;
  duration: Duration;
  category: CostCategory;
}
