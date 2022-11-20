namespace Andaha.Services.BudgetPlan.Requests.Income;

public static class IncomeEndpointExtensions
{
    internal static WebApplication MapIncomeEndpoint(this WebApplication app)
    {
        var income = app.MapApiGroup("Income");

        var groupBuilder = income.MapGroup("/api/income").ApplyApiVersions();

        app.MapListIncomes(groupBuilder);
        app.MapGetIncomeHistory(groupBuilder);
        app.MapCreateIncome(groupBuilder);
        app.MapUpdateIncomeIncome(groupBuilder);

        return app;
    }

    private static WebApplication MapListIncomes(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<ListIncomes.V1.ListIncomesRequest>("/")
            .Produces<List<Dtos.V1.IncomeDto>>()
            .MapToApiVersion(1.0);

        groupBuilder
            .MediateGet<ListIncomes.V2.ListIncomesRequest>("/")
            .Produces<List<Dtos.V2.IncomeDto>>()
            .MapToApiVersion(2.0);

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

    private static WebApplication MapUpdateIncomeIncome(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePut<UpdateIncome.V1.UpdateIncomeRequest>("/{id}")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return app;
    }
}
