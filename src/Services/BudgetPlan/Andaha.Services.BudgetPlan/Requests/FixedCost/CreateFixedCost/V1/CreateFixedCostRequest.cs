using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.BudgetPlan.Requests.FixedCost.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.CreateFixedCost.V1;

public record CreateFixedCostRequest([property: FromBody] FixedCostCreateDto FixedCost) : IHttpRequest;
