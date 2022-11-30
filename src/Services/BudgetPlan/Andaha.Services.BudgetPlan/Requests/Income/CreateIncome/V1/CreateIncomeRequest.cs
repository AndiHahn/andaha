using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.BudgetPlan.Core;

namespace Andaha.Services.BudgetPlan.Requests.Income.CreateIncome.V1;

public record CreateIncomeRequest(string Name, double Value, Duration Duration) : IHttpRequest;
