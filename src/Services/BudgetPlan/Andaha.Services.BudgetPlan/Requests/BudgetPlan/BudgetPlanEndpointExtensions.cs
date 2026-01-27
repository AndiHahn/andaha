using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.BudgetPlan.Requests.BudgetPlan;

public static class BudgetPlanEndpointExtensions
{
    internal static WebApplication MapBudgetPlanEndpoint(this WebApplication app)
    {
        var budgetPlan = app.NewVersionedApi("BudgetPlan");

        var groupBuilder = budgetPlan.MapGroup("/api/budgetplan").ApplyApiVersions();

        app.MapGetBudgetPlan(groupBuilder);

        return app;
    }

    private static WebApplication MapGetBudgetPlan(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetBudgetPlan.V1.GetBudgetPlanRequest>("/")
            .Produces<Dtos.V1.BudgetPlanDto>();

        return app;
    }
}
