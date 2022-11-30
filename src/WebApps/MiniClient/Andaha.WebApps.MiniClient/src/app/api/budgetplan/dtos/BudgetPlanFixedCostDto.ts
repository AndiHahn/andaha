import { CostCategory } from "./CostCategory";

export interface BudgetPlanFixedCostDto {
  category: CostCategory;
  value: number;
}
