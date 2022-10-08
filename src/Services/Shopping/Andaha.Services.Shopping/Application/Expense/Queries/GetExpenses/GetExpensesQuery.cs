using Andaha.Services.Shopping.Dtos.v1_0;
using MediatR;

namespace Andaha.Services.Shopping.Application.Expense.Queries.GetExpenses;

public readonly record struct GetExpensesQuery(DateTime StartTime, DateTime EndTime) : IRequest<IReadOnlyCollection<ExpenseDto>>;
