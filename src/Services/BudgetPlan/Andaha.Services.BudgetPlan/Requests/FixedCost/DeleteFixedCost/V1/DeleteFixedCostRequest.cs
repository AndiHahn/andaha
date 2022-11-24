using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.DeleteFixedCost.V1;

public record DeleteFixedCostRequest(Guid Id) : IHttpRequest;
