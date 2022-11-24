using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.BudgetPlan.Requests.Income.CreateIncome.V1;

public record CreateIncomeRequest(string Name, double Value) : IHttpRequest;
