using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.Person;

internal static class PersonEndpointExtensions
{
    internal static WebApplication MapPersonEndpoint(this WebApplication app)
    {
        var income = app.NewVersionedApi("Person");

        var groupBuilder = income.MapGroup("/api/person").ApplyApiVersions();

        groupBuilder
            .MapCreatePersonRequest()
            .MapListPersonsRequest()
            .MapPayPersonRequest()
            .MapUpdatePersonRequest()
            .MapDeletePersonRequest()
            .MapExportExpenses();

        return app;
    }

    private static RouteGroupBuilder MapCreatePersonRequest(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePost<CreatePerson.V1.CreatePersonRequest>("/")
            .Produces<Dtos.V1.PersonDto>()
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapListPersonsRequest(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<ListPersons.V1.ListPersonsRequest>("/")
            .Produces<Dtos.V1.PersonDto>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapPayPersonRequest(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePost<PayPerson.V1.PayPersonRequest>("{id}/pay")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapUpdatePersonRequest(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePut<UpdatePerson.V1.UpdatePersonRequest>("{id}")
            .Produces<Dtos.V1.PersonDto>()
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapDeletePersonRequest(
       this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<DeletePerson.V1.DeletePersonRequest>("{id}")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapExportExpenses(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<ExportPerson.V1.ExportPersonRequest>("export")
            .Produces<FileStreamResult>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }
}
