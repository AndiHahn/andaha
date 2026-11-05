using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.BudgetPlan.Requests.UserData.DeleteUserData.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.BudgetPlan.Requests.UserData;

internal static class UserDataEndpointExtensions
{
    internal static WebApplication MapUserDataEndpoint(this WebApplication app)
    {
        var api = app.NewVersionedApi("BudgetPlanUserData");

        var groupBuilder = api.MapGroup("/api/budgetplan").ApplyApiVersions();

        groupBuilder.MapDeleteUserData();

        return app;
    }

    private static RouteGroupBuilder MapDeleteUserData(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<DeleteUserDataCommand>("user-data")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .WithDescription("Deletes all budget plan data of the current user (fixed costs, incomes, settings), including the history of the temporal tables.");

        return groupBuilder;
    }
}
