using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Requests.Bill;

namespace Andaha.Services.Shopping.BackgroundJobs;

internal class FailedAnalysisImageHandler(
    ShoppingDbContext dbContext,
    IAnalysisImageRepository analysisImageRepository,
    IImageRepository imageRepository,
    ILogger<FailedAnalysisImageHandler> logger) : IFailedAnalysisImageHandler
{
    public async Task HandleAsync(string imageName, CancellationToken ct)
    {
        // An earlier run (or the analysis itself) already created the entry but did not delete the image.
        if (await dbContext.IsAnalysisUploadProcessedAsync(imageName, ct))
        {
            logger.LogWarning("Image '{ImageName}' was already turned into a bill or analyzed bill. Deleting the leftover image.", imageName);

            await analysisImageRepository.DeleteImageAsync(imageName, ct);

            return;
        }

        var file = await analysisImageRepository.GetImageAsync(imageName, ct);
        using var imageStream = file.Image;

        var analyzedBill = new AnalyzedBill(
            createdByUserId: file.UserId,
            categoryId: null,
            subCategoryId: null,
            shopName: null,
            price: null,
            confidence: null,
            totalAmountConfidence: null,
            sourceUploadId: imageName,
            notCreatedReasons: [NotCreatedReason.AnalysisFailed]);

        string billImageName = $"{analyzedBill.Id}-1";

        analyzedBill.AddImage(billImageName, []);

        dbContext.AnalyzedBill.Add(analyzedBill);

        imageStream.Position = 0;
        await imageRepository.UploadImageAsync(billImageName, imageStream, ct);

        await dbContext.SaveChangesAsync(ct);

        await analysisImageRepository.DeleteImageAsync(imageName, ct);

        logger.LogInformation("Created empty analyzed bill {AnalyzedBillId} from analysis image '{ImageName}'.", analyzedBill.Id, imageName);
    }
}
