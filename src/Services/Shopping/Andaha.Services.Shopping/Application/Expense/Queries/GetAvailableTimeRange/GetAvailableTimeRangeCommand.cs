using Andaha.Services.Shopping.Dtos.v1_0;
using MediatR;

namespace Andaha.Services.Shopping.Application.Expense.Queries.GetAvailableTimeRange;

public readonly record struct GetAvailableTimeRangeQuery() : IRequest<TimeRangeDto>;
