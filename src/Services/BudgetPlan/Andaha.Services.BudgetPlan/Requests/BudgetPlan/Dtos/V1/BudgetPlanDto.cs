namespace Andaha.Services.BudgetPlan.Requests.BudgetPlan.Dtos.V1;

public readonly record struct BudgetPlanDto(
    double Income,
    IReadOnlyCollection<BudgetPlanFixedCostDto> Expenses);
