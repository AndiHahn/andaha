using Andaha.Services.Shopping.Contracts;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification.Models;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.AnalyzeBill.V1;

internal class AnalyzeBillMessageHandler(
    IImageRepository imageRepository,
    IAnalysisImageRepository analysisImageRepository,
    IInvoiceAnalysisService invoiceAnalysisService,
    ICategoryClassificationService categoryClassificationService,
    ShoppingDbContext dbContext,
    ILogger<AnalyzeBillMessageHandler> logger) : IRequestHandler<AnalyzeBillMessageV1, IResult>
{
    private const int thumbnailPixelSize = 60;

    public async Task<IResult> Handle(AnalyzeBillMessageV1 request, CancellationToken cancellationToken)
    {
        var file = await analysisImageRepository.GetImageAsync(request.ImageName.ToString(), cancellationToken);

        if (file.Image is null)
        {
            return Results.NotFound();
        }

        var analysisResult = await invoiceAnalysisService.AnalyzeAsync(file.Image, cancellationToken);

        var classificationResult = await GetCategoryClassification(file, analysisResult, cancellationToken);

        var totalAmount = analysisResult.TotalAmount;
        var lineItemsAmount = analysisResult.LineItems.Sum(lineItem => lineItem.TotalPrice);
        var isTotalAmountReasonable = totalAmount is not null && lineItemsAmount == totalAmount;

        logger.LogInformation("Total amount: {TotalAmount}, line items total amount: {LineItemsAmount}, is total amount reasonable: {IsTotalAmountReasonable}, confidence: {C}, totalAmountConfidence: {tAC}",
            totalAmount, lineItemsAmount, isTotalAmountReasonable, analysisResult.Confidence, analysisResult.TotalAmountConfidence);

        if (analysisResult.IsReasonableResult() && classificationResult is not null)
        {
            logger.LogInformation("Analysis Result is reasonable. Create bill.");
            await HandleCreateBillAsync(
                request,
                file,
                analysisResult,
                classificationResult,
                cancellationToken);

            return Results.Ok();
        }

        logger.LogInformation("Analysis Result is not reasonable. Create analyzed bill for manual review.");
        await HandleCreateAnalyzedBillAsync(
            request,
            file,
            analysisResult,
            classificationResult,
            cancellationToken);

        return Results.Ok();
    }

    private async Task HandleCreateAnalyzedBillAsync(
        AnalyzeBillMessageV1 request,
        (Stream Image, Guid UserId) file,
        InvoiceAnalysisResult analysisResult,
        CategoryClassificationResult? classificationResult,
        CancellationToken cancellationToken)
    {
        var analyzedBill = CreateAnalyzedBill(file, analysisResult, classificationResult);

        dbContext.AnalyzedBill.Add(analyzedBill);

        await CreateAndUploadAnalyzedBillImageAsync(analyzedBill, file.Image, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        await analysisImageRepository.DeleteImageAsync(request.ImageName, cancellationToken);

        logger.LogInformation("Successfully created analyzed bill.");
    }

    private async Task HandleCreateBillAsync(
        AnalyzeBillMessageV1 request,
        (Stream Image, Guid UserId) file, 
        InvoiceAnalysisResult analysisResult, 
        CategoryClassificationResult? classificationResult,
        CancellationToken cancellationToken)
    {
        var bill = new Core.Bill(
                        Guid.NewGuid(),
                        file.UserId,
                        categoryId: classificationResult.CategoryId,
                        subCategoryId: classificationResult.SubCategoryId,
                        shopName: analysisResult.VendorName!,
                        price: analysisResult.TotalAmount!.Value,
                        date: analysisResult.InvoiceDate!.Value.Date,
                        notes: null,
                        fromAutoAnalysis: true,
                        confidence: analysisResult.Confidence,
                        totalAmountConfidence: analysisResult.TotalAmountConfidence);

        foreach (var lineItem in analysisResult.LineItems)
        {
            bill.AddLineItem(lineItem.Description, lineItem.UnitPrice, lineItem.TotalPrice!.Value, lineItem.Quantity);
        }

        dbContext.Bill.Add(bill);

        await CreateAndUploadBillImageAsync(bill, file.Image, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        await analysisImageRepository.DeleteImageAsync(request.ImageName, cancellationToken);

        logger.LogInformation("Successfully created bill from analyzed image.");
    }

    private async Task CreateAndUploadBillImageAsync(Core.Bill bill, Stream imageStream, CancellationToken ct)
    {
        string imageName = GetImageName(bill.Id);

        using Stream thumbnailStream = ImageResizer.ShrinkProportional(imageStream, thumbnailPixelSize);

        thumbnailStream.Position = 0;
        var thumbnail = ReadStreamToBytes(thumbnailStream);

        bill.AddImage(imageName, thumbnail);

        imageStream.Position = 0;

        await imageRepository.UploadImageAsync(imageName, imageStream, ct);
    }

    private async Task CreateAndUploadAnalyzedBillImageAsync(
        Core.AnalyzedBill bill,
        Stream imageStream, 
       CancellationToken ct)
    {
        string imageName = GetImageName(bill.Id);

        using Stream thumbnailStream = ImageResizer.ShrinkProportional(imageStream, thumbnailPixelSize);

        thumbnailStream.Position = 0;
        var thumbnail = ReadStreamToBytes(thumbnailStream);

        bill.AddImage(imageName, thumbnail);

        imageStream.Position = 0;

        await imageRepository.UploadImageAsync(imageName, imageStream, ct);
    }

    private async Task<CategoryClassificationResult?> GetCategoryClassification(
        (Stream Image, Guid UserId) file,
        InvoiceAnalysisResult analysisResult,
        CancellationToken cancellationToken)
    {
        var billCategories = await GetBillCategoriesAsync(file.UserId, cancellationToken);

        var classificationResult = await categoryClassificationService.ClassifyAsync(
            analysisResult.VendorName!,
            analysisResult.LineItems.Select(li => li.Description).ToArray()!,
            [.. billCategories],
            cancellationToken);

        if (!billCategories.Any(category => category.Id == classificationResult.CategoryId))
        {
            logger.LogWarning("the classified category is not valid. Classification result: {Result}", classificationResult);

            return null;
        }

        var classifiedCategory = billCategories.First(category => category.Id == classificationResult.CategoryId);

        if (classificationResult.SubCategoryId is not null &&
            !classifiedCategory.SubCategories.Any(subCategory => subCategory.Id == classificationResult.SubCategoryId))
        {
            logger.LogWarning(
                "The classified subCategory is not valid. Classification result: {Result}. Available subCategories: {SubCategories}",
                classificationResult,
                string.Join(", ", classifiedCategory.SubCategories.Select(subCateg => subCateg.Id)));

            return null;
        }

        return classificationResult;
    }

    private static AnalyzedBill CreateAnalyzedBill(
        (Stream Image, Guid UserId) file,
        InvoiceAnalysisResult analysisResult,
        CategoryClassificationResult? classificationResult)
    {
        var analyzedBill = new AnalyzedBill(
                    createdByUserId: file.UserId,
                    categoryId: classificationResult?.CategoryId,
                    subCategoryId: null,
                    shopName: analysisResult.VendorName!,
                    price: analysisResult.TotalAmount!.Value,
                    date: analysisResult.InvoiceDate!.Value.Date,
                    confidence: analysisResult.Confidence,
                    totalAmountConfidence: analysisResult.TotalAmountConfidence);

        foreach (var lineItem in analysisResult.LineItems)
        {
            analyzedBill.AddLineItem(
                lineItem.Description,
                lineItem.UnitPrice,
                lineItem.TotalPrice,
                lineItem.Quantity);
        }

        return analyzedBill;
    }

    private async Task<ICollection<Core.BillCategory>> GetBillCategoriesAsync(Guid userId, CancellationToken cancellationToken)
        => await dbContext.BillCategory
            .AsNoTracking()
            .Include(category => category.SubCategories)
            .Where(category => category.UserId == userId)
            .ToListAsync(cancellationToken);

    private static string GetImageName(Guid billId) => $"{billId}-1";

    private static byte[] ReadStreamToBytes(Stream input)
    {
        using MemoryStream ms = new();
        input.CopyTo(ms);
        return ms.ToArray();
    }
}
