using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.Expense;

internal static class ExpenseEndpointExtensions
{
    internal static WebApplication MapExpenseEndpoint(this WebApplication app)
    {
        var income = app.NewVersionedApi("Expense");

        var groupBuilder = income.MapGroup("/api/expense").ApplyApiVersions();

        groupBuilder.MapGetExpenses();
        groupBuilder.MapGetAvailableTimeRange();
        groupBuilder.MapExportExpenses();

        return app;
    }

    private static RouteGroupBuilder MapGetExpenses(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetExpenses.V1.GetExpensesQuery>("/")
            .Produces<IEnumerable<Dtos.V1.ExpenseDto>>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapGetAvailableTimeRange(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetAvailableTimeRange.V1.GetAvailableTimeRangeQuery>("time-range")
            .Produces<Dtos.V1.TimeRangeDto>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapExportExpenses(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<ExportExpenses.V1.ExportExpensesRequest>("export")
            .Produces<FileStreamResult>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }
}
