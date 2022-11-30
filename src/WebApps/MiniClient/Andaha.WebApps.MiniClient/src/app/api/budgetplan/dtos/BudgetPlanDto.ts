import { BudgetPlanFixedCostDto } from "./BudgetPlanFixedCostDto";

export interface BudgetPlanDto {
  income: number;
  expenses: BudgetPlanFixedCostDto[];
}
