using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Work.Requests.UserData.DeleteUserData.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Work.Requests.UserData;

internal static class UserDataEndpointExtensions
{
    internal static WebApplication MapUserDataEndpoint(this WebApplication app)
    {
        var api = app.NewVersionedApi("WorkUserData");

        var groupBuilder = api.MapGroup("/api/person").ApplyApiVersions();

        groupBuilder.MapDeleteUserData();

        return app;
    }

    private static RouteGroupBuilder MapDeleteUserData(
        this RouteGroupBuilder groupBuilder)
    {
        // The literal segment "user-data" takes precedence over DELETE api/person/{id}.
        groupBuilder
            .MediateDelete<DeleteUserDataCommand>("user-data")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .WithDescription("Deletes all work data of the current user (persons with their working entries and payments).");

        return groupBuilder;
    }
}
