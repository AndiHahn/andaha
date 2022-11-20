using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.BudgetPlan.Requests.Income.GetIncomeHistory.V1;

public record GetIncomeHistoryRequest(Guid Id) : IHttpRequest;
