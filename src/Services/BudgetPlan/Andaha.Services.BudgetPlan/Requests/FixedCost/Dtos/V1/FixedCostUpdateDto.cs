using Andaha.Services.BudgetPlan.Core;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.Dtos.V1;

public record FixedCostUpdateDto(string? Name, double? Value, CostCategory Category);
