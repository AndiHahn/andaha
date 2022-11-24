using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.BudgetPlan.Requests.Income.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.UpdateFixedCost.V1;

public record UpdateFixedCostRequest(Guid Id, [property: FromBody] FixedCostUpdateDto FixedCost) : IHttpRequest;
