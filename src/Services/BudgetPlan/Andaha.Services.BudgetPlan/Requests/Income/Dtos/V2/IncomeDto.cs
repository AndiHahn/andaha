using Andaha.Services.BudgetPlan.Core;
using System.Linq.Expressions;

namespace Andaha.Services.BudgetPlan.Requests.Income.Dtos.V2;

public readonly record struct IncomeDto(Guid Id, string Name, double Value)
{
    public static readonly Expression<Func<Core.Income, IncomeDto>> MapFromEntity =
        (income) => new IncomeDto(income.Id, income.Name, income.Value);
}
