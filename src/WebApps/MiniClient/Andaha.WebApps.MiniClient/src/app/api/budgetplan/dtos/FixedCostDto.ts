import { CostCategory } from "./CostCategory";
import { Duration } from "./Duration";

export interface FixedCostDto {
  id: string;
  name: string;
  value: number;
  duration: Duration;
  category: CostCategory;
}
