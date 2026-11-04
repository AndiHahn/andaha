using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;

namespace Andaha.Services.Shopping.BackgroundJobs;

internal class FailedAnalysisImageHandler(
    ShoppingDbContext dbContext,
    IAnalysisImageRepository analysisImageRepository,
    IImageRepository imageRepository,
    ILogger<FailedAnalysisImageHandler> logger) : IFailedAnalysisImageHandler
{
    private const int thumbnailPixelSize = 60;

    public async Task HandleAsync(string imageName, CancellationToken ct)
    {
        var file = await analysisImageRepository.GetImageAsync(imageName, ct);
        using var imageStream = file.Image;

        var analyzedBill = new AnalyzedBill(
            createdByUserId: file.UserId,
            categoryId: null,
            subCategoryId: null,
            shopName: null,
            price: null,
            confidence: null,
            totalAmountConfidence: null);

        string billImageName = $"{analyzedBill.Id}-1";

        analyzedBill.AddImage(billImageName, CreateThumbnail(imageName, imageStream));

        dbContext.AnalyzedBill.Add(analyzedBill);

        imageStream.Position = 0;
        await imageRepository.UploadImageAsync(billImageName, imageStream, ct);

        await dbContext.SaveChangesAsync(ct);

        await analysisImageRepository.DeleteImageAsync(imageName, ct);

        logger.LogInformation("Created empty analyzed bill {AnalyzedBillId} from analysis image '{ImageName}'.", analyzedBill.Id, imageName);
    }

    private byte[] CreateThumbnail(string imageName, Stream imageStream)
    {
        // A file that cannot be decoded may be the very reason the analysis failed; keep it without thumbnail.
        try
        {
            using var thumbnailStream = ImageResizer.ShrinkProportional(imageStream, thumbnailPixelSize);
            using MemoryStream ms = new();
            thumbnailStream.CopyTo(ms);
            return ms.ToArray();
        }
        catch (SixLabors.ImageSharp.ImageFormatException ex)
        {
            logger.LogWarning(ex, "Could not create thumbnail for analysis image '{ImageName}'.", imageName);
            return [];
        }
    }
}
