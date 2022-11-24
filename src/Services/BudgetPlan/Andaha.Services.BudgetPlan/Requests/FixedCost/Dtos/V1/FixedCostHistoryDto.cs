using Andaha.Services.BudgetPlan.Infrastructure.EntityConfiguration;
using LinqKit;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.Dtos.V1;

public readonly record struct FixedCostHistoryDto(FixedCostDto FixedCost, DateTime ValidFrom, DateTime ValidTo)
{
    public static readonly Expression<Func<Core.FixedCost, FixedCostHistoryDto>> MapFromEntity =
        (fixedCost) => new FixedCostHistoryDto(
            FixedCostDto.MapFromEntity.Invoke(fixedCost),
            EF.Property<DateTime>(fixedCost, TemporalTable.ValidFrom),
            EF.Property<DateTime>(fixedCost, TemporalTable.ValidTo));
}
