using Andaha.CrossCutting.Application.Requests;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;

namespace Andaha.Services.Shopping.Requests.Bill;

internal static class BillEndpointExtensions
{
    internal static WebApplication MapBillEndpoint(this WebApplication app)
    {
        var income = app.MapApiGroup("Bill");

        var groupBuilder = income.MapGroup("/api/bill").ApplyApiVersions();

        app.MapSearchBills(groupBuilder);
        app.MapGetById(groupBuilder);
        app.MapCreateBill(groupBuilder);
        app.MapUpdateBill(groupBuilder);
        app.MapDeleteBill(groupBuilder);
        app.MapUploadImage(groupBuilder);
        app.MapDownloadImage(groupBuilder);
        app.MapDeleteImage(groupBuilder);

        return app;
    }

    private static WebApplication MapSearchBills(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<SearchBills.V1.SearchBillsQuery>("/")
            .Produces<PagedResultDto<Dtos.V1.BillDto>>()
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return app;
    }

    private static WebApplication MapGetById(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetBillById.V1.GetBillByIdQuery>("{id}")
            .Produces<Dtos.V1.BillDto>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }

    private static WebApplication MapCreateBill(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MapPost("/", [Authorize] async (IMediator mediator, HttpContext httpContext, CancellationToken cancellationToken) =>
            {
                Guid? id = null;

                if (Guid.TryParse(httpContext.Request.Form["Id"], out var parsedId))
                {
                    id = parsedId;
                }

                var priceParameter = httpContext.Request.Form[nameof(UpdateBill.V1.UpdateBillCommand.Price)];
                var parsedPrice = priceParameter.First()!.ToDouble();

                var command = new CreateBill.V1.CreateBillCommand(
                    id,
                    Guid.Parse(httpContext.Request.Form[nameof(CreateBill.V1.CreateBillCommand.CategoryId)]!),
                    httpContext.Request.Form[nameof(CreateBill.V1.CreateBillCommand.ShopName)]!,
                    parsedPrice,
                    DateTime.Parse(httpContext.Request.Form[nameof(CreateBill.V1.CreateBillCommand.Date)]!),
                    httpContext.Request.Form[nameof(CreateBill.V1.CreateBillCommand.Notes)],
                    httpContext.Request.Form.Files.FirstOrDefault());

                return await mediator.Send(command, cancellationToken);
            })
            .Accepts<CreateBill.V1.CreateBillCommand>("multipart/form-data")
            .Produces<Dtos.V1.BillDto>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }

    private static WebApplication MapUpdateBill(
       this WebApplication app,
       RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MapPut("{id}", [Authorize] async (IMediator mediator, HttpContext httpContext, CancellationToken cancellationToken, Guid id) =>
            {
                var priceParameter = httpContext.Request.Form[nameof(UpdateBill.V1.UpdateBillCommand.Price)];
                var parsedPrice = priceParameter.First()!.ToDouble();

                var command = new UpdateBill.V1.UpdateBillCommand(
                    id,
                    Guid.Parse(httpContext.Request.Form[nameof(UpdateBill.V1.UpdateBillCommand.CategoryId)]!),
                    httpContext.Request.Form[nameof(UpdateBill.V1.UpdateBillCommand.ShopName)]!,
                    parsedPrice,
                    DateTime.Parse(httpContext.Request.Form[nameof(UpdateBill.V1.UpdateBillCommand.Date)]!),
                    httpContext.Request.Form[nameof(UpdateBill.V1.UpdateBillCommand.Notes)],
                    httpContext.Request.Form.Files.FirstOrDefault());

                return await mediator.Send(command, cancellationToken);
            })
            .Accepts<UpdateBill.V1.UpdateBillCommand>("multipart/form-data")
            .Produces<Dtos.V1.BillDto>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }

    private static WebApplication MapDeleteBill(
       this WebApplication app,
       RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<DeleteBill.V1.DeleteBillCommand>("{id}")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }

    private static WebApplication MapUploadImage(
      this WebApplication app,
      RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePost<UploadBillImage.V1.UploadBillImageCommand>("{id}/image")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }

    private static WebApplication MapDownloadImage(
      this WebApplication app,
      RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetBillImage.V1.GetBillImageQuery>("{id}/image")
            .Produces<FileStreamResult>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }

    private static WebApplication MapDeleteImage(
      this WebApplication app,
      RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<DeleteBillImage.V1.DeleteBillImageCommand>("{id}/image")
            .Produces<FileStreamResult>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }
}
