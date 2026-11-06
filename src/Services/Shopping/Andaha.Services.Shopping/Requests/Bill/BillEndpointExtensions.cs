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
        app.MapGetShopStats(groupBuilder);
        app.MapGetById(groupBuilder);
        app.MapCreateBill(groupBuilder);
        app.MapUpdateBill(groupBuilder);
        app.MapDeleteBill(groupBuilder);
        app.MapUploadImage(groupBuilder);
        app.MapDownloadImage(groupBuilder);
        app.MapDeleteImage(groupBuilder);
        app.MapUploadForAnalysis(groupBuilder);
        app.MapAnalyzeNasImage(groupBuilder);
        app.MapGetAnalyzedBills(groupBuilder);
        app.MapGetPendingAnalyses(groupBuilder);
        app.MapGetTodayAutoCreatedBills(groupBuilder);
        app.MapGetAnalyzedBillImage(groupBuilder);
        app.MapDeleteAnalyzedBill(groupBuilder);
        app.MapAnalyzeBillSubscription(groupBuilder);

        return app;
    }

    private static WebApplication MapSearchBills(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<SearchBills.V1.SearchBillsQuery>("/")
            .Produces<Dtos.V1.BillSearchResultDto>()
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized);

        return app;
    }

    private static WebApplication MapGetShopStats(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetShopStats.V1.GetShopStatsQuery>("shop-stats")
            .Produces<IEnumerable<Dtos.V1.ShopStatDto>>()
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
            .MapPost("/", CreateBillFromFormAsync)
            .DisableAntiforgery()
            .Accepts<CreateBill.V1.CreateBillCommand>("multipart/form-data")
            .Produces<Dtos.V1.BillDto>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }

    [Authorize]
    internal static async Task<Microsoft.AspNetCore.Http.IResult> CreateBillFromFormAsync(IMediator mediator, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var form = httpContext.Request.Form;

        if (!LineItems.LineItemsFormField.TryRead(form, out var lineItems))
        {
            return LineItems.LineItemsFormField.InvalidResult();
        }

        Guid? id = null;

        if (Guid.TryParse(form["Id"], out var parsedId))
        {
            id = parsedId;
        }

        Guid? subCategoryId = null;

        if (Guid.TryParse(form[nameof(CreateBill.V1.CreateBillCommand.SubCategoryId)], out var parsedSubCategoryId))
        {
            subCategoryId = parsedSubCategoryId;
        }

        var priceParameter = form[nameof(CreateBill.V1.CreateBillCommand.Price)];
        var parsedPrice = priceParameter.First()!.ToDouble();

        var command = new CreateBill.V1.CreateBillCommand(
            id,
            Guid.Parse(form[nameof(CreateBill.V1.CreateBillCommand.CategoryId)]!),
            subCategoryId,
            form[nameof(CreateBill.V1.CreateBillCommand.ShopName)]!,
            parsedPrice,
            BillFormDate.Parse(form[nameof(CreateBill.V1.CreateBillCommand.Date)]!),
            form[nameof(CreateBill.V1.CreateBillCommand.Notes)],
            form.Files.FirstOrDefault(),
            lineItems);

        return await mediator.Send(command, cancellationToken);
    }

    private static WebApplication MapUpdateBill(
       this WebApplication app,
       RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MapPut("{id}", UpdateBillFromFormAsync)
            .Accepts<UpdateBill.V1.UpdateBillCommand>("multipart/form-data")
            .Produces<Dtos.V1.BillDto>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        return app;
    }

    [Authorize]
    internal static async Task<Microsoft.AspNetCore.Http.IResult> UpdateBillFromFormAsync(IMediator mediator, HttpContext httpContext, CancellationToken cancellationToken, Guid id)
    {
        var form = httpContext.Request.Form;

        // Missing field: the stored line items stay unchanged; [] removes them.
        if (!LineItems.LineItemsFormField.TryRead(form, out var lineItems))
        {
            return LineItems.LineItemsFormField.InvalidResult();
        }

        var priceParameter = form[nameof(UpdateBill.V1.UpdateBillCommand.Price)];
        var parsedPrice = priceParameter.First()!.ToDouble();

        Guid? subCategoryId = null;

        if (Guid.TryParse(form[nameof(UpdateBill.V1.UpdateBillCommand.SubCategoryId)], out var parsedSubCategoryId))
        {
            subCategoryId = parsedSubCategoryId;
        }

        var command = new UpdateBill.V1.UpdateBillCommand(
            id,
            Guid.Parse(form[nameof(UpdateBill.V1.UpdateBillCommand.CategoryId)]!),
            subCategoryId,
            form[nameof(UpdateBill.V1.UpdateBillCommand.ShopName)]!,
            parsedPrice,
            BillFormDate.Parse(form[nameof(UpdateBill.V1.UpdateBillCommand.Date)]!),
            form[nameof(UpdateBill.V1.UpdateBillCommand.Notes)],
            form.Files.FirstOrDefault(),
            lineItems);

        return await mediator.Send(command, cancellationToken);
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
            .DisableAntiforgery()
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
            .MediatePost<UploadForAnalysis.V1.UploadBillForAnalysisCommand>("upload-for-analysis")
            .DisableAntiforgery()
            .Accepts<IFormFile>("multipart/form-data")
            .Produces<UploadForAnalysis.V1.UploadBillForAnalysisResponse>(StatusCodes.Status202Accepted)
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status409Conflict)
            .WithDescription("Upload an invoice image for asynchronous analysis. An optional form field 'id' (GUID) makes retries idempotent.");

        return app;
    }

    private static WebApplication MapAnalyzeNasImage(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediatePost<AnalyzeBill.V2.AnalyzeNasImage>("analyze-nas")
            .DisableAntiforgery()
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

    private static WebApplication MapGetPendingAnalyses(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetPendingAnalyses.V1.GetPendingAnalysesQuery>("analyzed/pending")
            .Produces<IEnumerable<Dtos.V1.PendingAnalysisDto>>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .WithDescription("Returns the current user's app uploads that are not analyzed yet, oldest first.");

        return app;
    }

    private static WebApplication MapGetTodayAutoCreatedBills(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetTodayAutoCreatedBills.V1.GetTodayAutoCreatedBillsQuery>("analyzed/today")
            .Produces<IEnumerable<Dtos.V1.AutoCreatedBillDto>>()
            .Produces<ValidationProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .WithDescription("Returns the current user's bills created automatically by the analysis on the local day (tz), newest first.");

        return app;
    }

    private static WebApplication MapGetAnalyzedBillImage(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateGet<GetAnalyzedBillImage.V1.GetAnalyzedBillImageQuery>("analyzed/{id}/image")
            .Produces<FileStreamResult>()
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
            .WithDescription("Returns the image of an analyzed bill of the current user.");

        return app;
    }

    private static WebApplication MapDeleteAnalyzedBill(
        this WebApplication app,
        RouteGroupBuilder groupBuilder)
    {
        groupBuilder
            .MediateDelete<DeleteAnalyzedBill.V1.DeleteAnalyzedBillCommand>("analyzed/{id}")
            .Produces(StatusCodes.Status204NoContent)
            .Produces<ProblemDetails>(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound)
            .WithDescription("Discards an analyzed bill of the current user including its line items and image.");

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
