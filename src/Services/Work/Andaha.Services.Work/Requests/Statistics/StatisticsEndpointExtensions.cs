using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.Statistics;

internal static class StatisticsEndpointExtensions
{
    internal static WebApplication MapStatisticsEndpoint(this WebApplication app)
    {
        var income = app.MapApiGroup("Work-Statistics");

        var groupBuilder = income.MapGroup("/api/work-statistics").ApplyApiVersions();

        groupBuilder
            .MapGetAvailableTimeRange()
            .MapGetStatisticsRequest();

        return app;
    }

    private static RouteGroupBuilder MapGetAvailableTimeRange(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetAvailableTimeRange.V1.GetAvailableTimeRangeRequest>("time-range")
            .Produces<Dtos.V1.TimeRangeDto>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapGetStatisticsRequest(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePost<GetStatistics.V1.GetStatisticsRequest>("/")
            .Produces<Dtos.V1.StatisticsDto>()
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }
}
