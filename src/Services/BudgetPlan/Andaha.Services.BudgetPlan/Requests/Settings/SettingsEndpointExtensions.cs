using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.BudgetPlan.Requests.Settings.Dtos.V1;
using Andaha.Services.BudgetPlan.Requests.Settings.GetBudgetPlanSettings.V1;
using Andaha.Services.BudgetPlan.Requests.Settings.UpdateBudgetPlanSettings.V1;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.BudgetPlan.Requests.Settings;

internal static class SettingsEndpointExtensions
{
    internal static WebApplication MapSettingsEndpoint(this WebApplication app)
    {
        var api = app.NewVersionedApi("BudgetPlanSettings");

        var groupBuilder = api.MapGroup("/api/budgetplan").ApplyApiVersions();

        groupBuilder
            .MapGetBudgetPlanSettings()
            .MapUpdateBudgetPlanSettings();

        return app;
    }

    private static RouteGroupBuilder MapGetBudgetPlanSettings(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetBudgetPlanSettingsQuery>("settings")
            .Produces<BudgetPlanSettingsDto>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }

    // The command carries a scalar that is read from the JSON body, so the body is mapped explicitly
    // instead of [AsParameters] (which would bind scalars from the query string).
    private static RouteGroupBuilder MapUpdateBudgetPlanSettings(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MapPut("settings", [Authorize] (IMediator mediator, [FromBody] UpdateBudgetPlanSettingsCommand command)
                => mediator.Send(command))
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest);

        return groupBuilder;
    }
}
