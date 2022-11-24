using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.BudgetPlan.Requests.Income.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.BudgetPlan.Requests.Income.UpdateIncome.V1;

public record UpdateIncomeRequest(Guid Id, [property: FromBody] FixedCostUpdateDto Income) : IHttpRequest;
