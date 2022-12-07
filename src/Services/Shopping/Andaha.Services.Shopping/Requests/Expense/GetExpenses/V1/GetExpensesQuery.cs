using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.Shopping.Requests.Expense.GetExpenses.V1;

public record GetExpensesQuery(DateTime StartTime, DateTime EndTime) : IHttpRequest;
