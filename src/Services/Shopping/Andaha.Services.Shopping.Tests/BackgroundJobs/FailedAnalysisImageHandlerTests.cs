using Andaha.Services.Shopping.BackgroundJobs;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace Andaha.Services.Shopping.Tests.BackgroundJobs;

public class FailedAnalysisImageHandlerTests
{
    private static byte[] Png()
    {
        using var image = new Image<Rgba32>(120, 80);
        using var stream = new MemoryStream();
        image.SaveAsPng(stream);
        return stream.ToArray();
    }

    [Fact]
    public async Task Creates_analyzed_bill_with_empty_fields_and_image_for_owner()
    {
        var owner = Guid.NewGuid();
        var source = Png();
        var analysisImages = Substitute.For<IAnalysisImageRepository>();
        analysisImages.GetImageAsync("a.jpg", Arg.Any<CancellationToken>())
            .Returns(_ => ((Stream)new MemoryStream(source), owner));
        var images = Substitute.For<IImageRepository>();
        byte[]? uploaded = null;
        string? uploadedName = null;
        await images.UploadImageAsync(
            Arg.Do<string>(name => uploadedName = name),
            Arg.Do<Stream>(stream => { using var ms = new MemoryStream(); stream.CopyTo(ms); uploaded = ms.ToArray(); }),
            Arg.Any<CancellationToken>());

        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var handler = new FailedAnalysisImageHandler(
                context,
                analysisImages,
                images,
                NullLogger<FailedAnalysisImageHandler>.Instance);

            await handler.HandleAsync("a.jpg", CancellationToken.None);

            context.ChangeTracker.Clear();
            var bill = await context.AnalyzedBill
                .Include(b => b.Images)
                .Include(b => b.LineItems)
                .SingleAsync();
            Assert.Equal(owner, bill.UserId);
            Assert.Equal("a.jpg", bill.SourceUploadId);
            Assert.Null(bill.ShopName);
            Assert.Null(bill.Price);
            Assert.Null(bill.CategoryId);
            Assert.Null(bill.SubCategoryId);
            Assert.Null(bill.Confidence);
            Assert.Null(bill.TotalAmountConfidence);
            Assert.Empty(bill.LineItems);

            var image = Assert.Single(bill.Images);
            Assert.Equal($"{bill.Id}-1", image.Name);
            Assert.NotEmpty(image.Thumbnail);
            Assert.Equal(image.Name, uploadedName);
            Assert.Equal(source, uploaded);
            await analysisImages.Received(1).DeleteImageAsync("a.jpg", Arg.Any<CancellationToken>());
        }
    }
}
