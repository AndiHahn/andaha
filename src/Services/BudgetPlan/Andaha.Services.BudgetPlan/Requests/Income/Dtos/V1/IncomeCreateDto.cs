using Andaha.Services.BudgetPlan.Core;

namespace Andaha.Services.BudgetPlan.Requests.Income.Dtos.V1;

public record IncomeCreateDto(string Name, double Value, Duration Duration);
