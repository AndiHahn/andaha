using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost;

public static class FixedCostEndpointExtensions
{
    internal static WebApplication MapFixedCostEndpoint(this WebApplication app)
    {
        var FixedCost = app.NewVersionedApi("FixedCost");

        var groupBuilder = FixedCost.MapGroup("/api/fixedCost").ApplyApiVersions();

        app.MapListFixedCosts(groupBuilder);
        app.MapGetFixedCostHistory(groupBuilder);
        app.MapCreateFixedCost(groupBuilder);
        app.MapUpdateFixedCostFixedCost(groupBuilder);
        app.MapDeleteFixedCost(groupBuilder);

        return app;
    }

    private static WebApplication MapListFixedCosts(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<ListFixedCosts.V1.ListFixedCostsRequest>("/")
            .Produces<List<Dtos.V1.FixedCostDto>>();

        return app;
    }

    private static WebApplication MapGetFixedCostHistory(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetFixedCostHistory.V1.GetFixedCostHistoryRequest>("/{id}/history")
            .Produces<List<Dtos.V1.FixedCostHistoryDto>>();

        return app;
    }

    private static WebApplication MapCreateFixedCost(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePost<CreateFixedCost.V1.CreateFixedCostRequest>("/")
            .Produces(StatusCodes.Status204NoContent);

        return app;
    }

    private static WebApplication MapUpdateFixedCostFixedCost(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePut<UpdateFixedCost.V1.UpdateFixedCostRequest>("/{id}")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return app;
    }

    private static WebApplication MapDeleteFixedCost(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<DeleteFixedCost.V1.DeleteFixedCostRequest>("/{id}")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return app;
    }
}
