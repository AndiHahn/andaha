using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.BudgetPlan.Requests.Income;

public static class IncomeEndpointExtensions
{
    internal static WebApplication MapIncomeEndpoint(this WebApplication app)
    {
        var income = app.NewVersionedApi("Income");

        var groupBuilder = income.MapGroup("/api/income").ApplyApiVersions();

        app.MapListIncomes(groupBuilder);
        app.MapGetIncomeHistory(groupBuilder);
        app.MapCreateIncome(groupBuilder);
        app.MapUpdateIncome(groupBuilder);
        app.MapDeleteIncome(groupBuilder);

        return app;
    }

    private static WebApplication MapListIncomes(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<ListIncomes.V1.ListIncomesRequest>("/")
            .Produces<List<Dtos.V1.IncomeDto>>();

        return app;
    }

    private static WebApplication MapGetIncomeHistory(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetIncomeHistory.V1.GetIncomeHistoryRequest>("/{id}/history")
            .Produces<List<Dtos.V1.IncomeHistoryDto>>();

        return app;
    }

    private static WebApplication MapCreateIncome(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePost<CreateIncome.V1.CreateIncomeRequest>("/")
            .Produces(StatusCodes.Status204NoContent);

        return app;
    }

    private static WebApplication MapUpdateIncome(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePut<UpdateIncome.V1.UpdateIncomeRequest>("/{id}")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return app;
    }

    private static WebApplication MapDeleteIncome(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<DeleteIncome.V1.DeleteIncomeRequest>("/{id}")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return app;
    }
}
