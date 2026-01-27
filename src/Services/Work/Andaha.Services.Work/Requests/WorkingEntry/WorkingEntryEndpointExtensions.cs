using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.WorkingEntry;

public static class WorkingEntryEndpointExtensions
{
    internal static WebApplication MapWorkingEntryEndpoint(this WebApplication app)
    {
        var income = app.NewVersionedApi("WorkingEntry");

        var groupBuilder = income.MapGroup("/api/working-entry").ApplyApiVersions();

        groupBuilder
            .MapCreateWorkingEntryRequest()
            .MapCreateWorkingEntriesRequest()
            .MapUpdatePersonRequest()
            .MapListWorkingEntriesRequest()
            .MapDeleteWorkingEntryRequest();

        return app;
    }

    private static RouteGroupBuilder MapCreateWorkingEntryRequest(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePost<CreateWorkingEntry.V1.CreateWorkingEntryRequest>("/")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapCreateWorkingEntriesRequest(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePost<CreateWorkingEntries.V1.CreateWorkingEntriesRequest>("/bulk")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapUpdatePersonRequest(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePut<UpdateWorkingEntry.V1.UpdateWorkingEntryRequest>("{id}")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status403Forbidden)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapListWorkingEntriesRequest(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<ListWorkingEntries.V1.ListWorkingEntriesRequest>("/{personId}")
            .Produces<IEnumerable<Dtos.V1.WorkingEntryDto>>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status403Forbidden);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapDeleteWorkingEntryRequest(
       this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<DeleteWorkingEntry.V1.DeleteWorkingEntryRequest>("{id}")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }
}
