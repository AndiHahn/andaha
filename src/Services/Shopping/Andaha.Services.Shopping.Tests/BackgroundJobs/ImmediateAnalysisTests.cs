using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.BackgroundJobs;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification;
using Andaha.Services.Shopping.Infrastructure.CategoryClassification.Models;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Analysis;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Nas;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis;
using Andaha.Services.Shopping.Infrastructure.InvoiceAnalysis.Models;
using Andaha.Services.Shopping.Requests.Bill.AnalyzeBill;
using Andaha.Services.Shopping.Requests.Bill.UploadForAnalysis.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace Andaha.Services.Shopping.Tests.BackgroundJobs;

public sealed class ImmediateAnalysisTests : IDisposable
{
    private static readonly DateTimeOffset Now = new(2026, 11, 5, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid UserA = Guid.NewGuid();

    private readonly string folder = Path.Combine(Path.GetTempPath(), "andaha-immediate-" + Guid.NewGuid().ToString("N"));
    private readonly FileSystemAnalysisImageRepository analysisImages;
    private readonly AnalysisQueue queue = new();
    private readonly FixedTimeProvider time = new(Now);
    private readonly IInvoiceAnalysisService invoiceAnalysis = Substitute.For<IInvoiceAnalysisService>();
    private readonly ICategoryClassificationService classification = Substitute.For<ICategoryClassificationService>();
    private readonly IImageRepository billImages = Substitute.For<IImageRepository>();
    private readonly SqliteConnection connection;
    private readonly Guid categoryId;

    public ImmediateAnalysisTests()
    {
        analysisImages = new FileSystemAnalysisImageRepository(folder);

        var (context, openConnection) = TestDb.CreateShopping();
        connection = openConnection;

        using (context)
        {
            var category = new Core.BillCategory(UserA, "ZZ Lebensmittel", "red", 0, Array.Empty<(string, int)>());
            context.BillCategory.Add(category);
            context.SaveChanges();
            categoryId = category.Id;
        }

        classification
            .ClassifyAsync(Arg.Any<string?>(), Arg.Any<string[]>(), Arg.Any<Core.BillCategory[]>(), Arg.Any<CancellationToken>())
            .Returns(_ => new CategoryClassificationResult { CategoryId = categoryId });
    }

    public void Dispose()
    {
        connection.Dispose();

        if (Directory.Exists(folder))
        {
            Directory.Delete(folder, recursive: true);
        }
    }

    [Fact]
    public async Task Upload_returns_id_writes_claim_and_enqueues()
    {
        var result = await CreateUploadHandler().Handle(new UploadBillForAnalysisCommand(File()), CancellationToken.None);

        var accepted = Assert.IsType<Accepted<UploadBillForAnalysisResponse>>(result);
        string id = accepted.Value!.Id;
        Assert.Equal(36, id.Length);

        var image = Assert.Single(await analysisImages.ListImagesAsync());
        Assert.Equal(id, image.ImageName);
        Assert.Equal(UserA, image.UserId);
        Assert.Equal(Now, image.UploadedAtUtc);
        Assert.Equal("app", image.Origin);
        Assert.Equal(Now.AddMinutes(2), image.ClaimedUntilUtc);
        Assert.Equal(1, image.Attempts);

        Assert.True(queue.TryDequeue(out var queued));
        Assert.Equal(id, queued);
        Assert.False(queue.TryDequeue(out _));
    }

    [Fact]
    public async Task Immediate_processing_creates_bill_with_source_upload_id()
    {
        invoiceAnalysis.AnalyzeAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>()).Returns(Plausible());
        using var services = BuildServices();
        var service = new ImmediateAnalysisService(
            queue,
            services.GetRequiredService<IServiceScopeFactory>(),
            analysisImages,
            NullLogger<ImmediateAnalysisService>.Instance);

        await service.StartAsync(CancellationToken.None);
        string id = await UploadAsync();

        var bill = await WaitForAsync(context => context.Bill.SingleOrDefaultAsync());
        await service.StopAsync(CancellationToken.None);

        Assert.Equal(id, bill.SourceUploadId);
        Assert.True(bill.FromAutoAnalysis);
        Assert.Equal(UserA, bill.UserId);
        Assert.Equal(categoryId, bill.CategoryId);
        Assert.Empty(await analysisImages.ListImagesAsync());
        await using var check = TestDb.Open(connection);
        Assert.Empty(await check.AnalyzedBill.ToListAsync());
    }

    [Fact]
    public async Task Immediate_processing_creates_analyzed_bill_when_not_plausible()
    {
        var result = Plausible();
        result.Confidence = 0.2;
        invoiceAnalysis.AnalyzeAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>()).Returns(result);
        using var services = BuildServices();
        string id = await UploadAsync();

        await CreateService(services).ProcessAsync(id, CancellationToken.None);

        await using var context = TestDb.Open(connection);
        var analyzedBill = await context.AnalyzedBill.Include(b => b.LineItems).SingleAsync();
        Assert.Equal(id, analyzedBill.SourceUploadId);
        Assert.Equal(UserA, analyzedBill.UserId);
        Assert.Equal(
            ["Brot", "Pfand", "Milch"],
            analyzedBill.LineItems.OrderBy(item => item.Position).Select(item => item.Description));
        Assert.Equal([0, 1, 2], analyzedBill.LineItems.Select(item => item.Position).Order());
        Assert.Empty(await context.Bill.ToListAsync());
        Assert.Empty(await analysisImages.ListImagesAsync());
    }

    [Fact]
    public async Task Auto_created_bill_keeps_sanitized_line_items_in_order()
    {
        invoiceAnalysis.AnalyzeAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>()).Returns(Plausible());
        using var services = BuildServices();
        string id = await UploadAsync();

        await CreateService(services).ProcessAsync(id, CancellationToken.None);

        await using var context = TestDb.Open(connection);
        var items = (await context.Bill.Include(b => b.LineItems).SingleAsync())
            .LineItems
            .OrderBy(item => item.Position)
            .ToList();

        Assert.Equal([0, 1, 2], items.Select(item => item.Position));
        Assert.Equal(["Brot", "Pfand", "Milch"], items.Select(item => item.Description));
        Assert.Equal([2, null, null], items.Select(item => item.Quantity));
        Assert.Equal(-0.25, items[1].TotalPrice);
        Assert.Equal(-0.25, items[1].UnitPrice);
    }

    [Fact]
    public async Task Failure_releases_claim_and_counts_attempt()
    {
        invoiceAnalysis.AnalyzeAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("analysis down"));
        using var services = BuildServices();
        string id = await UploadAsync();

        await CreateService(services).ProcessAsync(id, CancellationToken.None);

        var image = Assert.Single(await analysisImages.ListImagesAsync());
        Assert.Equal(id, image.ImageName);
        Assert.Null(image.ClaimedUntilUtc);
        Assert.Equal(1, image.Attempts);
        Assert.Equal("app", image.Origin);
        Assert.Equal(Now, image.UploadedAtUtc);

        await using var context = TestDb.Open(connection);
        Assert.Empty(await context.Bill.ToListAsync());
        Assert.Empty(await context.AnalyzedBill.ToListAsync());
    }

    [Fact]
    public async Task Nas_images_get_origin_nas()
    {
        var nasImages = Substitute.For<INasImageRepository>();
        nasImages.ListImagesAsync(Arg.Any<CancellationToken>()).Returns(
        [
            new ImageMetadata { ImageName = "nas.jpg", LastModified = Now.AddMinutes(-5) },
        ]);
        nasImages.GetImageAsync("nas.jpg", Arg.Any<CancellationToken>())
            .Returns(_ => ((Stream)new MemoryStream(Png()), UserA));
        using var services = BuildServices();
        var worker = new NasBillWorker(
            nasImages,
            analysisImages,
            services.GetRequiredService<IServiceScopeFactory>(),
            time,
            NullLogger<NasBillWorker>.Instance);

        await worker.PollAndProcessAsync(CancellationToken.None);

        var image = Assert.Single(await analysisImages.ListImagesAsync());
        Assert.Equal("nas.jpg", image.ImageName);
        Assert.Equal("nas", image.Origin);
        Assert.Equal(Now, image.UploadedAtUtc);
        Assert.Equal(UserA, image.UserId);
        Assert.Null(image.ClaimedUntilUtc);
        Assert.Equal(0, image.Attempts);
        Assert.False(queue.TryDequeue(out _));
    }

    private UploadBillForAnalysisCommandHandler CreateUploadHandler()
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(UserA);

        return new UploadBillForAnalysisCommandHandler(analysisImages, identity, queue, time);
    }

    private async Task<string> UploadAsync()
    {
        var result = await CreateUploadHandler().Handle(new UploadBillForAnalysisCommand(File()), CancellationToken.None);

        return Assert.IsType<Accepted<UploadBillForAnalysisResponse>>(result).Value!.Id;
    }

    private ImmediateAnalysisService CreateService(ServiceProvider services)
        => new(
            queue,
            services.GetRequiredService<IServiceScopeFactory>(),
            analysisImages,
            NullLogger<ImmediateAnalysisService>.Instance);

    private ServiceProvider BuildServices()
        => new ServiceCollection()
            .AddLogging()
            .AddScoped(_ => TestDb.Open(connection))
            .AddSingleton<IAnalysisImageRepository>(analysisImages)
            .AddSingleton(billImages)
            .AddSingleton(invoiceAnalysis)
            .AddSingleton(classification)
            .AddScoped<IBillAnalysisProcessor, BillAnalysisProcessor>()
            .BuildServiceProvider();

    private async Task<T> WaitForAsync<T>(Func<ShoppingDbContext, Task<T?>> query)
        where T : class
    {
        var deadline = DateTime.UtcNow.AddSeconds(10);

        while (DateTime.UtcNow < deadline)
        {
            await using var context = TestDb.Open(connection);
            if (await query(context) is { } found)
            {
                return found;
            }

            await Task.Delay(50);
        }

        throw new TimeoutException("The immediate analysis did not finish in time.");
    }

    private static InvoiceAnalysisResult Plausible()
        => new()
        {
            VendorName = "ZZ Markt",
            InvoiceDate = new DateTimeOffset(2026, 11, 5, 0, 0, 0, TimeSpan.Zero),
            TotalAmount = 4.15,
            Confidence = 0.95,
            TotalAmountConfidence = 0.9,
            LineItems =
            [
                new InvoiceLineItem { Description = "  Brot ", Quantity = 2, UnitPrice = 1.5, TotalPrice = 3.0 },
                new InvoiceLineItem { Description = "   ", Quantity = 1, UnitPrice = 9.0, TotalPrice = 9.0 },
                new InvoiceLineItem { Description = "Pfand", Quantity = 0, UnitPrice = -0.25, TotalPrice = -0.25 },
                new InvoiceLineItem { Description = null, Quantity = 1, UnitPrice = 1.0, TotalPrice = 1.0 },
                new InvoiceLineItem { Description = "Milch", Quantity = null, UnitPrice = 1.4, TotalPrice = 1.4 },
            ],
        };

    private static IFormFile File()
    {
        var bytes = Png();
        var file = Substitute.For<IFormFile>();
        file.Length.Returns(bytes.Length);
        file.OpenReadStream().Returns(_ => new MemoryStream(bytes));
        return file;
    }

    private static byte[] Png()
    {
        using var image = new Image<Rgba32>(120, 80);
        using var stream = new MemoryStream();
        image.SaveAsPng(stream);
        return stream.ToArray();
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
