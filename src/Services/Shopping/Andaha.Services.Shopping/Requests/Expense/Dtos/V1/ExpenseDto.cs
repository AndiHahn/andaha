namespace Andaha.Services.Shopping.Requests.Expense.Dtos.V1;

public readonly record struct ExpenseDto(string Category, double Costs, IReadOnlyCollection<ExpenseSubCategoryDto> SubCategories);
