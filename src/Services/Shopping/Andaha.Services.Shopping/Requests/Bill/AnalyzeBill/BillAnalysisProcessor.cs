using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification.Models;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;
using Andaha.Services.Shopping.Requests.Bill.LineItems;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.AnalyzeBill;

internal sealed class BillAnalysisProcessor(
    IImageRepository imageRepository,
    IAnalysisImageRepository analysisImageRepository,
    IInvoiceAnalysisService invoiceAnalysisService,
    ICategoryClassificationService categoryClassificationService,
    ShoppingDbContext dbContext,
    ILogger<BillAnalysisProcessor> logger) : IBillAnalysisProcessor
{
    public async Task ProcessAsync(string imageName, CancellationToken ct)
    {
        // An earlier attempt may have saved its result but failed to delete the source image.
        // Finish that attempt instead of analyzing (and creating) a second time.
        if (await dbContext.IsAnalysisUploadProcessedAsync(imageName, ct))
        {
            logger.LogWarning("Image '{ImageName}' was already turned into a bill or analyzed bill. Deleting the leftover image.", imageName);

            await analysisImageRepository.DeleteImageAsync(imageName, ct);

            return;
        }

        var file = await analysisImageRepository.GetImageAsync(imageName, ct);
        using var fileStream = file.Image;

        var analysisResult = await invoiceAnalysisService.AnalyzeAsync(fileStream, ct);

        var classificationResult = await GetCategoryClassification(file.UserId, analysisResult, ct);

        var totalAmount = analysisResult.TotalAmount;
        var lineItemsAmount = analysisResult.LineItems.Sum(lineItem => lineItem.TotalPrice);
        logger.LogInformation("Total amount: {TotalAmount}, line items total amount: {LineItemsAmount}, confidence: {C}, totalAmountConfidence: {tAC}",
            totalAmount, lineItemsAmount, analysisResult.Confidence, analysisResult.TotalAmountConfidence);

        // Empty descriptions are dropped, quantity 0 becomes null, negative prices stay; the order is kept.
        var lineItems = LineItemSanitizer.Sanitize(analysisResult.LineItems
            .Select(lineItem => (lineItem.Description, lineItem.Quantity, lineItem.UnitPrice, lineItem.TotalPrice)));

        var notCreatedReasons = AutoCreationRules.Evaluate(
            analysisResult.VendorName,
            analysisResult.InvoiceDate?.Date,
            totalAmount,
            analysisResult.Confidence,
            analysisResult.TotalAmountConfidence,
            lineItemsAmount ?? 0,
            categoryValid: classificationResult is not null);

        logger.LogInformation("Not-created reasons: {Reasons}", string.Join(", ", notCreatedReasons));

        if (notCreatedReasons.Count == 0 && classificationResult is not null)
        {
            logger.LogInformation("Analysis Result is reasonable. Create bill.");
            await CreateBillAsync(imageName, file, analysisResult, classificationResult, lineItems, ct);

            return;
        }

        logger.LogInformation("Analysis Result is not reasonable. Create analyzed bill for manual review.");
        await CreateAnalyzedBillAsync(imageName, file, analysisResult, classificationResult, lineItems, notCreatedReasons, ct);
    }

    private async Task CreateAnalyzedBillAsync(
        string sourceImageName,
        (Stream Image, Guid UserId) file,
        InvoiceAnalysisResult analysisResult,
        CategoryClassificationResult? classificationResult,
        IReadOnlyList<LineItemData> lineItems,
        IReadOnlyList<NotCreatedReason> notCreatedReasons,
        CancellationToken ct)
    {
        var analyzedBill = new AnalyzedBill(
            createdByUserId: file.UserId,
            categoryId: classificationResult?.CategoryId,
            subCategoryId: classificationResult?.SubCategoryId,
            shopName: analysisResult.VendorName,
            price: analysisResult.TotalAmount,
            date: analysisResult.InvoiceDate?.Date,
            confidence: analysisResult.Confidence,
            totalAmountConfidence: analysisResult.TotalAmountConfidence,
            sourceUploadId: sourceImageName,
            notCreatedReasons: notCreatedReasons);

        foreach (var lineItem in lineItems)
        {
            analyzedBill.AddLineItem(lineItem.Description, lineItem.UnitPrice, lineItem.TotalPrice, lineItem.Quantity);
        }

        dbContext.AnalyzedBill.Add(analyzedBill);

        var imageName = await UploadImageAsync(
            analyzedBill.Id,
            file.Image,
            fileType => BillImagePath.ForScan(file.UserId, analyzedBill.CreatedAt, analyzedBill.Id, fileType.Extension),
            ct);
        analyzedBill.AddImage(imageName, []);

        await dbContext.SaveChangesAsync(ct);

        await analysisImageRepository.DeleteImageAsync(sourceImageName, ct);

        logger.LogInformation("Successfully created analyzed bill.");
    }

    private async Task CreateBillAsync(
        string sourceImageName,
        (Stream Image, Guid UserId) file,
        InvoiceAnalysisResult analysisResult,
        CategoryClassificationResult classificationResult,
        IReadOnlyList<LineItemData> lineItems,
        CancellationToken ct)
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
            totalAmountConfidence: analysisResult.TotalAmountConfidence,
            sourceUploadId: sourceImageName);

        bill.ReplaceLineItems(lineItems);

        dbContext.Bill.Add(bill);

        var imageName = await UploadImageAsync(
            bill.Id,
            file.Image,
            fileType => BillImagePath.ForBill(bill.UserId, bill.Date, bill.ShopName, bill.Id, 1, fileType.Extension),
            ct);
        bill.AddImage(imageName, []);

        await dbContext.SaveChangesAsync(ct);

        await analysisImageRepository.DeleteImageAsync(sourceImageName, ct);

        logger.LogInformation("Successfully created bill from analyzed image.");
    }

    /// <summary>
    /// Detects the file type, uploads the image under the path built for it and returns the name.
    /// </summary>
    private async Task<string> UploadImageAsync(
        Guid billId,
        Stream imageStream,
        Func<ImageFileType, string> buildName,
        CancellationToken ct)
    {
        imageStream.Position = 0;

        var fileType = await logger.DetectOrWarnAsync(imageStream, $"bill {billId}", ct);
        string imageName = buildName(fileType);

        await imageRepository.UploadImageAsync(imageName, imageStream, fileType.ContentType, ct);

        return imageName;
    }

    private async Task<CategoryClassificationResult?> GetCategoryClassification(
        Guid userId,
        InvoiceAnalysisResult analysisResult,
        CancellationToken cancellationToken)
    {
        var billCategories = await GetBillCategoriesAsync(userId, cancellationToken);

        var classificationResult = await categoryClassificationService.ClassifyAsync(
            analysisResult.VendorName,
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

    private async Task<ICollection<Core.BillCategory>> GetBillCategoriesAsync(Guid userId, CancellationToken cancellationToken)
        => await dbContext.BillCategory
            .AsNoTracking()
            .Include(category => category.SubCategories)
            .Where(category => category.UserId == userId)
            .ToListAsync(cancellationToken);
}
