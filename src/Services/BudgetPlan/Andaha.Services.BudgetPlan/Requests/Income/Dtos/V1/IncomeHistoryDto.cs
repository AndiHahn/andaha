using Andaha.Services.BudgetPlan.Core;
using Andaha.Services.BudgetPlan.Infrastructure.EntityConfiguration;
using LinqKit;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Andaha.Services.BudgetPlan.Requests.Income.Dtos.V1;

public readonly record struct IncomeHistoryDto(IncomeDto Income, DateTime ValidFrom, DateTime ValidTo)
{
    public static readonly Expression<Func<Core.Income, IncomeHistoryDto>> MapFromEntity =
        (income) => new IncomeHistoryDto(
            IncomeDto.MapFromEntity.Invoke(income),
            EF.Property<DateTime>(income, TemporalTable.ValidFrom),
            EF.Property<DateTime>(income, TemporalTable.ValidTo));
}
