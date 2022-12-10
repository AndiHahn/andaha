using Andaha.Services.BudgetPlan.Core;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.Dtos.V1;

public record FixedCostCreateDto(string Name, double Value, Duration Duration, CostCategory Category);