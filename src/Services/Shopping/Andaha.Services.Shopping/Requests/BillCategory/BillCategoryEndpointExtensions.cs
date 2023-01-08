using Andaha.CrossCutting.Application.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.BillCategory;

internal static class BillCategoryEndpointExtensions
{
    internal static WebApplication MapBillCategoryEndpoint(this WebApplication app)
    {
        var income = app.MapApiGroup("BillCategory");

        var groupBuilder = income.MapGroup("/api/billcategory").ApplyApiVersions();

        app.MapListCategories(groupBuilder);
        app.MapUpdateCategories(groupBuilder);

        return app;
    }

    private static WebApplication MapListCategories(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<ListBillCategories.V1.ListBillCategoriesQuery>("/")
            .Produces<IEnumerable<Dtos.V1.CategoryDto>>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return app;
    }

    private static WebApplication MapUpdateCategories(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePut<UpdateBillCategories.V1.UpdateBillCategoriesCommand>("/")
            .Produces<IEnumerable<Dtos.V1.CategoryDto>>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return app;
    }
}
