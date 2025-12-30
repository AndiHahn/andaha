using Andaha.Services.Shopping.Contracts;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification;
using Andaha.Services.Shopping.Infrastructure.ImageRepository;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.AnalyzeBill.V1;

internal class AnalyzeBillMessageHandler(
    IImageRepository imageRepository,
    IInvoiceAnalysisService invoiceAnalysisService,
    ICategoryClassificationService categoryClassificationService,
    ShoppingDbContext dbContext) : IRequestHandler<AnalyzeBillMessageV1, IResult>
{
    public async Task<IResult> Handle(AnalyzeBillMessageV1 request, CancellationToken cancellationToken)
    {
        var file = await imageRepository.GetAnalysisImageAsync(request.Id.ToString(), cancellationToken);

        if (file.Image is null)
        {
            return Results.NotFound();
        }

        var analysisResult = await invoiceAnalysisService.AnalyzeAsync(file.Image, cancellationToken);

        if (!analysisResult.IsReasonableResult())
        {
            // TODO logging

            return Results.BadRequest();
        }

        var billCategories = await GetBillCategoriesAsync(file.UserId, cancellationToken);

        var classificationResult = await categoryClassificationService.ClassifyAsync(
            analysisResult.VendorName!,
            analysisResult.LineItems.Select(li => li.Description).ToArray()!,
            [.. billCategories],
            cancellationToken);

        var analyzedBill = new AnalyzedBill(
            createdByUserId: file.UserId,
            categoryId: classificationResult.CategoryId,
            subCategoryId: null,
            shopName: analysisResult.VendorName!,
            price: analysisResult.TotalAmount!.Value,
            date: analysisResult.InvoiceDate!.Value.Date);

        return Results.Ok();
    }

    private async Task<ICollection<Core.BillCategory>> GetBillCategoriesAsync(Guid userId, CancellationToken cancellationToken)
        => await dbContext.BillCategory
            .AsNoTracking()
            .Where(category => category.UserId == userId)
            .ToListAsync(cancellationToken);
}
