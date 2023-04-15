using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.BillCategory;

internal static class BillCategoryEndpointExtensions
{
    internal static WebApplication MapBillCategoryEndpoint(this WebApplication app)
    {
        var income = app.MapApiGroup("BillCategory");

        var groupBuilder = income.MapGroup("/api/billcategory").ApplyApiVersions();

        groupBuilder
            .MapListCategories()
            .MapCreateCategory()
            .MapUpdateCategory()
            .MapDeleteCategory()
            .MapUpdateCategoryOrders();

        return app;
    }

    private static RouteGroupBuilder MapListCategories(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<ListBillCategories.V1.ListBillCategoriesQuery>("/")
            .Produces<IEnumerable<Dtos.V1.CategoryDto>>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapCreateCategory(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePost<CreateBillCategory.V1.CreateBillCategoryCommand>("/")
            .Produces<BillCategoryDto>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapUpdateCategory(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePut<UpdateBillCategory.V1.UpdateBillCategoryCommand>("{id}")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapDeleteCategory(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<DeleteBillCategory.V1.DeleteBillCategoryCommand>("{id}")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapUpdateCategoryOrders(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePut<UpdateOrder.V1.UpdateOrderCommand>("orders")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }
}
