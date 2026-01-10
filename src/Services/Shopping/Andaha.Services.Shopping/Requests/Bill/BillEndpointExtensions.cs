using Andaha.CrossCutting.Application.Requests;
using Andaha.CrossCutting.Application.Result;
using Andaha.Services.Shopping.Common;
using Dapr;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Andaha.Services.Shopping.Requests.Bill;

internal static class BillEndpointExtensions
{
    internal static WebApplication MapBillEndpoint(this WebApplication app)
    {
        var bill = app.NewVersionedApi("Bill");

        var groupBuilder = bill.MapGroup("/api/bill").ApplyApiVersions();

        app.MapSearchBills(groupBuilder);
        app.MapGetById(groupBuilder);
        app.MapAnalyzeBill(groupBuilder);
        app.MapCreateBill(groupBuilder);
        app.MapUpdateBill(groupBuilder);
        app.MapDeleteBill(groupBuilder);
        app.MapUploadImage(groupBuilder);
        app.MapDownloadImage(groupBuilder);
        app.MapDeleteImage(groupBuilder);
        app.MapUploadForAnalysis(groupBuilder);
        app.MapGetAnalyzedBills(groupBuilder);
        app.MapAnalyzeBillSubscription(groupBuilder);

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

    private static WebApplication MapAnalyzeBill(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MapPost("/analyze", [Authorize] async (IMediator mediator, IFormFile file, CancellationToken cancellationToken) =>
            {
                //var file = httpContext.Request.Form.Files.FirstOrDefault();

                await using var stream = file.OpenReadStream();

                var command = new AnalyzeBill.V1.AnalyzeBillCommand(stream);

                return await mediator.Send(command, cancellationToken);
            })
            .Accepts<IFormFile>("multipart/form-data")
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

                Guid? subCategoryId = null;

                if (Guid.TryParse(httpContext.Request.Form[nameof(CreateBill.V1.CreateBillCommand.SubCategoryId)], out var parsedSubCategoryId))
                {
                    subCategoryId = parsedSubCategoryId;
                }

                var priceParameter = httpContext.Request.Form[nameof(CreateBill.V1.CreateBillCommand.Price)];
                var parsedPrice = priceParameter.First()!.ToDouble();

                var command = new CreateBill.V1.CreateBillCommand(
                    id,
                    Guid.Parse(httpContext.Request.Form[nameof(CreateBill.V1.CreateBillCommand.CategoryId)]!),
                    subCategoryId,
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

                Guid? subCategoryId = null;

                if (Guid.TryParse(httpContext.Request.Form[nameof(UpdateBill.V1.UpdateBillCommand.SubCategoryId)], out var parsedSubCategoryId))
                {
                    subCategoryId = parsedSubCategoryId;
                }

                var command = new UpdateBill.V1.UpdateBillCommand(
                    id,
                    Guid.Parse(httpContext.Request.Form[nameof(UpdateBill.V1.UpdateBillCommand.CategoryId)]!),
                    subCategoryId,
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

    private static WebApplication MapUploadForAnalysis(
    this WebApplication app,
    RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePost<UploadForAnalysis.V1.UploadBillForAnalysisCommand>("$upload-for-analysis")
            .Accepts<IFormFile>("multipart/form-data")
            .Produces(StatusCodes.Status202Accepted)
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .WithDescription("Upload an invoice image for asynchronous analysis.");

        return app;
    }

    private static WebApplication MapGetAnalyzedBills(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetAnalyzedBills.V1.GetAnalyzedBillsQuery>("analyzed")
            .Produces<IEnumerable<Dtos.V1.AnalyzedBillDto>>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .WithDescription("Returns analyzed bills for the current user.");

        return app;
    }

    private static WebApplication MapAnalyzeBillSubscription(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        app.MapPost(
            "$analyze-bill",
            [Topic("pubsub", "AnalyzeBillMessageV1")]
            async (IMediator mediator, Contracts.AnalyzeBillMessageV1 message) =>
            {
                await mediator.Send(message);

                return Results.Ok();
            })
            .Produces(StatusCodes.Status200OK);

        return app;
    }
}
