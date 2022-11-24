using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.GetFixedCostHistory.V1;

public record GetFixedCostHistoryRequest(Guid Id) : IHttpRequest;
