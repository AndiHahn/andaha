using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.BudgetPlan.Core;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.CreateFixedCost.V1;

public record CreateFixedCostRequest(string Name, double Value, Duration Duration, CostCategory Category) : IHttpRequest;
