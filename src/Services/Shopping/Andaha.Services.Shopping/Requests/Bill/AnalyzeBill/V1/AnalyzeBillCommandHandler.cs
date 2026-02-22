using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification.Models;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Requests.Bill.AnalyzeBill.V1;

public class AnalyzeBillCommandHandler(
    IInvoiceAnalysisService invoiceAnalysisService,
    ICategoryClassificationService categoryClassificationService,
    IIdentityService identityService,
    ShoppingDbContext dbContext,
    ILogger<AnalyzeBillCommandHandler> logger) : IRequestHandler<AnalyzeBillCommand, IResult>
{
    public async Task<IResult> Handle(AnalyzeBillCommand request, CancellationToken cancellationToken)
    {
        var analysisResult = await invoiceAnalysisService.AnalyzeAsync(request.BillImageStream, cancellationToken);

        Guid userId = identityService.GetUserId();

        var classificationResult = await GetCategoryClassification(
            (request.BillImageStream, userId),
            analysisResult,
            cancellationToken);

        return Results.Ok(new
        {
            AnalysisResult = analysisResult,
            ClassificationResult = classificationResult
        });
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
    private async Task<ICollection<Core.BillCategory>> GetBillCategoriesAsync(Guid userId, CancellationToken cancellationToken)
        => await dbContext.BillCategory
            .AsNoTracking()
            .Include(category => category.SubCategories)
            .Where(category => category.UserId == userId)
            .ToListAsync(cancellationToken);
}
