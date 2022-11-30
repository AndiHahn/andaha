import { CostCategory } from "./CostCategory";
import { Duration } from "./Duration";

export interface FixedCostCreateDto {
  name: string;
  value: number;
  duration: Duration;
  category: CostCategory;
}
