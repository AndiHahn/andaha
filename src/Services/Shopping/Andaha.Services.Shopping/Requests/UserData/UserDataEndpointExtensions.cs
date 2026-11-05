using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Shopping.Requests.UserData.DeleteUserData.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.UserData;

internal static class UserDataEndpointExtensions
{
    internal static WebApplication MapUserDataEndpoint(this WebApplication app)
    {
        var api = app.NewVersionedApi("UserData");

        var groupBuilder = api.MapGroup("/api/bill").ApplyApiVersions();

        groupBuilder.MapDeleteUserData();

        return app;
    }

    // "user-data" is a literal segment, which takes precedence over the parameter in DELETE api/bill/{id}.
    private static RouteGroupBuilder MapDeleteUserData(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<DeleteUserDataCommand>("user-data")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .WithDescription("Deletes all shopping data of the current user, including bill images and pending analysis uploads.");

        return groupBuilder;
    }
}
