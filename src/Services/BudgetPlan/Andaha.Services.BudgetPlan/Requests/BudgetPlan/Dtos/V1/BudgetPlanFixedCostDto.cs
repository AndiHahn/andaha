using Andaha.Services.BudgetPlan.Core;

namespace Andaha.Services.BudgetPlan.Requests.BudgetPlan.Dtos.V1;

public readonly record struct BudgetPlanFixedCostDto(CostCategory Category, double Value);
