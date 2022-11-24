using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.BudgetPlan.Requests.Income.DeleteIncome.V1;

public record DeleteIncomeRequest(Guid Id) : IHttpRequest;
