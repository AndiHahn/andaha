using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Bill.UploadBillImage.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace Andaha.Services.Shopping.Tests.Bill;

public class UploadBillImageTests
{
    private static readonly Guid Owner = Guid.NewGuid();
    private static readonly DateTime BillDate = new(2026, 3, 7);

    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 0x10, 0x4A, 0x46, 0x49, 0x46, 0, 1];
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3];

    [Fact]
    public async Task Upload_to_bill_without_image_uses_structured_path_and_content_type()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var bill = Seed(context, imageName: null);
            var images = Substitute.For<IImageRepository>();

            var result = await Handler(context, images).Handle(new UploadBillImageCommand(bill.Id, File(Jpeg)), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            string expected = BillImagePath.ForBill(Owner, BillDate, "Edeka Süd", bill.Id, 1, ".jpg");
            await images.Received(1).UploadImageAsync(expected, Arg.Any<Stream>(), "image/jpeg", Arg.Any<CancellationToken>());
            await images.DidNotReceiveWithAnyArgs().DeleteImageAsync(default!, default);
            Assert.Equal(expected, (await StoredImages(context, bill.Id)).Single());
        }
    }

    [Fact]
    public async Task Replacing_the_image_deletes_the_old_blob_after_saving_even_with_another_name()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var bill = Seed(context, imageName: "legacy-image-1");
            var images = Substitute.For<IImageRepository>();
            bool savedBeforeDelete = false;
            images.DeleteImageAsync("legacy-image-1", Arg.Any<CancellationToken>())
                .Returns(_ =>
                {
                    using var check = TestDb.Open(connection);
                    savedBeforeDelete = check.BillImage.Any(i => i.BillId == bill.Id && i.Name != "legacy-image-1");
                    return Task.CompletedTask;
                });

            var result = await Handler(context, images).Handle(new UploadBillImageCommand(bill.Id, File(Png)), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            string expected = BillImagePath.ForBill(Owner, BillDate, "Edeka Süd", bill.Id, 1, ".png");
            await images.Received(1).UploadImageAsync(expected, Arg.Any<Stream>(), "image/png", Arg.Any<CancellationToken>());
            await images.Received(1).DeleteImageAsync("legacy-image-1", Arg.Any<CancellationToken>());
            Assert.True(savedBeforeDelete);
            Assert.Equal([expected], await StoredImages(context, bill.Id));
        }
    }

    [Fact]
    public async Task Replacing_with_the_same_path_does_not_delete_the_blob()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var bill = Seed(context, imageName: null);
            string samePath = BillImagePath.ForBill(Owner, BillDate, "Edeka Süd", bill.Id, 1, ".jpg");
            context.Bill.Include(b => b.Images).Single(b => b.Id == bill.Id).AddImage(samePath, []);
            context.SaveChanges();
            context.ChangeTracker.Clear();
            var images = Substitute.For<IImageRepository>();

            var result = await Handler(context, images).Handle(new UploadBillImageCommand(bill.Id, File(Jpeg)), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            await images.Received(1).UploadImageAsync(samePath, Arg.Any<Stream>(), "image/jpeg", Arg.Any<CancellationToken>());
            await images.DidNotReceiveWithAnyArgs().DeleteImageAsync(default!, default);
            Assert.Equal([samePath], await StoredImages(context, bill.Id));
        }
    }

    [Fact]
    public async Task Failing_delete_of_the_old_blob_logs_a_warning_and_stays_successful()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var bill = Seed(context, imageName: "legacy-image-1");
            var images = Substitute.For<IImageRepository>();
            images.DeleteImageAsync("legacy-image-1", Arg.Any<CancellationToken>()).ThrowsAsync(new IOException("nas down"));
            var logger = new CapturingLogger();

            var result = await Handler(context, images, logger).Handle(new UploadBillImageCommand(bill.Id, File(Png)), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            Assert.Contains(logger.Entries, e => e.Level == LogLevel.Warning);
            Assert.Single(await StoredImages(context, bill.Id));
        }
    }

    [Fact]
    public async Task Non_seekable_stream_is_buffered_and_the_type_detected()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var bill = Seed(context, imageName: null);
            var images = Substitute.For<IImageRepository>();
            byte[]? uploaded = null;
            await images.UploadImageAsync(
                Arg.Any<string>(),
                Arg.Do<Stream>(stream => { using var ms = new MemoryStream(); stream.CopyTo(ms); uploaded = ms.ToArray(); }),
                Arg.Any<string?>(),
                Arg.Any<CancellationToken>());

            await Handler(context, images).Handle(new UploadBillImageCommand(bill.Id, File(Png, seekable: false)), CancellationToken.None);

            string expected = BillImagePath.ForBill(Owner, BillDate, "Edeka Süd", bill.Id, 1, ".png");
            await images.Received(1).UploadImageAsync(expected, Arg.Any<Stream>(), "image/png", Arg.Any<CancellationToken>());
            Assert.Equal(Png, uploaded);
        }
    }

    [Fact]
    public async Task Unknown_content_falls_back_to_bin_and_logs_a_warning()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var bill = Seed(context, imageName: null);
            var images = Substitute.For<IImageRepository>();
            var logger = new CapturingLogger();

            await Handler(context, images, logger).Handle(new UploadBillImageCommand(bill.Id, File([1, 2, 3])), CancellationToken.None);

            string expected = BillImagePath.ForBill(Owner, BillDate, "Edeka Süd", bill.Id, 1, ".bin");
            await images.Received(1).UploadImageAsync(expected, Arg.Any<Stream>(), "application/octet-stream", Arg.Any<CancellationToken>());
            Assert.Contains(logger.Entries, e => e.Level == LogLevel.Warning);
        }
    }

    private static Core.Bill Seed(Infrastructure.ShoppingDbContext context, string? imageName)
    {
        var category = new Core.BillCategory(Owner, "ZZ Lebensmittel", "red", 0, Array.Empty<(string, int)>());
        context.BillCategory.Add(category);
        var bill = new Core.Bill(null, Owner, category.Id, null, "Edeka Süd", 4.15, BillDate);
        if (imageName is not null)
        {
            bill.AddImage(imageName, []);
        }

        context.Bill.Add(bill);
        context.SaveChanges();
        context.ChangeTracker.Clear();

        return bill;
    }

    private static async Task<List<string>> StoredImages(Infrastructure.ShoppingDbContext context, Guid billId)
    {
        context.ChangeTracker.Clear();

        return await context.BillImage.Where(i => i.BillId == billId).Select(i => i.Name).ToListAsync();
    }

    private static UploadBillImageCommandHandler Handler(
        Infrastructure.ShoppingDbContext context, IImageRepository images, ILogger<UploadBillImageCommandHandler>? logger = null)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(Owner);

        return new UploadBillImageCommandHandler(
            context, identity, Substitute.For<ICollaborationApiProxy>(), images, logger ?? new CapturingLogger());
    }

    private static IFormFile File(byte[] bytes, bool seekable = true)
    {
        var file = Substitute.For<IFormFile>();
        file.Length.Returns(bytes.Length);
        file.OpenReadStream().Returns(_ => seekable ? new MemoryStream(bytes) : new NonSeekableStream(bytes));

        return file;
    }

    private sealed class NonSeekableStream(byte[] bytes) : MemoryStream(bytes)
    {
        public override bool CanSeek => false;

        public override long Position
        {
            get => base.Position;
            set => throw new NotSupportedException();
        }
    }

    private sealed class CapturingLogger : ILogger<UploadBillImageCommandHandler>
    {
        public List<(LogLevel Level, string Message)> Entries { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            => Entries.Add((logLevel, formatter(state, exception)));
    }
}
