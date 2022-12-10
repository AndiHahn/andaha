using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.Expense;

internal static class ExpenseEndpointExtensions
{
    internal static WebApplication MapExpenseEndpoint(this WebApplication app)
    {
        var income = app.MapApiGroup("Expense");

        var groupBuilder = income.MapGroup("/api/expense").ApplyApiVersions();

        app.MapGetExpenses(groupBuilder);
        app.MapGetAvailableTimeRange(groupBuilder);

        return app;
    }

    private static WebApplication MapGetExpenses(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetExpenses.V1.GetExpensesQuery>("/")
            .Produces<IEnumerable<Dtos.V1.ExpenseDto>>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return app;
    }

    private static WebApplication MapGetAvailableTimeRange(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetAvailableTimeRange.V1.GetAvailableTimeRangeQuery>("time-range")
            .Produces<Dtos.V1.TimeRangeDto>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return app;
    }
}
