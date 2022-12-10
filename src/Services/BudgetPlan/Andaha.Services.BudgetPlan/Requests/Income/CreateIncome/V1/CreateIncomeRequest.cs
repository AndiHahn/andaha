using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.BudgetPlan.Requests.Income.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.BudgetPlan.Requests.Income.CreateIncome.V1;

public record CreateIncomeRequest([property: FromBody] IncomeCreateDto Income) : IHttpRequest;
