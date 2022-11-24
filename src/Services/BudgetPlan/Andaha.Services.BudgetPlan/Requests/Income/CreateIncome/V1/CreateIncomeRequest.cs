using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.BudgetPlan.Requests.Income.CreateIncome.V1;

public record CreateFixedCostRequest(string Name, double Value) : IHttpRequest;
