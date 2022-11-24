using Andaha.Services.BudgetPlan.Core;
using System.Linq.Expressions;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.Dtos.V1;

public readonly record struct FixedCostDto(Guid Id, string Name, double Value, Duration Duration, CostCategory Category)
{
    public static readonly Expression<Func<Core.FixedCost, FixedCostDto>> MapFromEntity =
        (fixedCost) => new FixedCostDto(fixedCost.Id, fixedCost.Name, fixedCost.Value, fixedCost.Duration, fixedCost.Category);
}
