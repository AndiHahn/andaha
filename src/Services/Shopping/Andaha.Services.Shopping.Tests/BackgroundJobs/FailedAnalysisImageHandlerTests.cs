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

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Skips_and_deletes_image_already_turned_into_bill(bool asAnalyzedBill)
    {
        var owner = Guid.NewGuid();
        var analysisImages = Substitute.For<IAnalysisImageRepository>();
        var images = Substitute.For<IImageRepository>();

        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            if (asAnalyzedBill)
            {
                context.AnalyzedBill.Add(new Core.AnalyzedBill(owner, null, null, "ZZ Markt", 4.15, 0.5, 0.5, sourceUploadId: "a.jpg"));
            }
            else
            {
                var category = new Core.BillCategory(owner, "ZZ Lebensmittel", "red", 0, Array.Empty<(string, int)>());
                context.BillCategory.Add(category);
                context.Bill.Add(new Core.Bill(null, owner, category.Id, null, "ZZ Markt", 4.15, sourceUploadId: "a.jpg"));
            }

            await context.SaveChangesAsync();
            context.ChangeTracker.Clear();

            var handler = new FailedAnalysisImageHandler(
                context,
                analysisImages,
                images,
                NullLogger<FailedAnalysisImageHandler>.Instance);

            await handler.HandleAsync("a.jpg", CancellationToken.None);

            Assert.Equal(asAnalyzedBill ? 1 : 0, await context.AnalyzedBill.CountAsync());
            Assert.Equal(asAnalyzedBill ? 0 : 1, await context.Bill.CountAsync());
            await analysisImages.DidNotReceiveWithAnyArgs().GetImageAsync(default!, default);
            await images.DidNotReceiveWithAnyArgs().UploadImageAsync(default!, default!, default);
            await analysisImages.Received(1).DeleteImageAsync("a.jpg", Arg.Any<CancellationToken>());
        }
    }
}
