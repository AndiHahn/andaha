using Andaha.CrossCutting.Application.Requests;
using Andaha.Services.Shopping.Requests.BillTemplate.CreateBillTemplate.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.DeleteBillTemplate.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.Dtos.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.GetBillSuggestions.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.HideBillSuggestion.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.ListBillTemplates.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.UpdateBillTemplate.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.UpdateBillTemplateOrder.V1;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.BillTemplate;

internal static class BillTemplateEndpointExtensions
{
    internal static WebApplication MapBillTemplateEndpoint(this WebApplication app)
    {
        var api = app.NewVersionedApi("BillTemplate");

        var groupBuilder = api.MapGroup("/api/bill-template").ApplyApiVersions();

        groupBuilder
            .MapListBillTemplates()
            .MapGetBillSuggestions()
            .MapHideBillSuggestion()
            .MapCreateBillTemplate()
            .MapUpdateBillTemplateOrder()
            .MapUpdateBillTemplate()
            .MapDeleteBillTemplate();

        return app;
    }

    private static RouteGroupBuilder MapListBillTemplates(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<ListBillTemplatesQuery>("/")
            .Produces<IEnumerable<BillTemplateDto>>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapGetBillSuggestions(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetBillSuggestionsQuery>("suggestions")
            .Produces<IEnumerable<BillSuggestionDto>>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapHideBillSuggestion(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MapPost("hidden-suggestions", [Authorize] (IMediator mediator, [FromBody] HideBillSuggestionCommand command)
                => mediator.Send(command))
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest);

        return groupBuilder;
    }

    // The commands carry scalar fields that are read from the JSON body, so create/update/order map
    // the body explicitly instead of [AsParameters] (which would bind scalars from the query string).
    private static RouteGroupBuilder MapCreateBillTemplate(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MapPost("/", [Authorize] (IMediator mediator, [FromBody] CreateBillTemplateCommand command)
                => mediator.Send(command))
            .Produces<BillTemplateDto>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapUpdateBillTemplateOrder(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MapPut("order", [Authorize] (IMediator mediator, [FromBody] UpdateBillTemplateOrderCommand command)
                => mediator.Send(command))
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapUpdateBillTemplate(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MapPut("{id:guid}", [Authorize] (IMediator mediator, Guid id, [FromBody] UpdateBillTemplateCommand command)
                => mediator.Send(command with { Id = id }))
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }

    private static RouteGroupBuilder MapDeleteBillTemplate(
        this RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<DeleteBillTemplateCommand>("{id}")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return groupBuilder;
    }
}
