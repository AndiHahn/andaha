using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Bill.UpdateBill.V1;
using Andaha.Services.Shopping.Requests.Bill.UploadBillImage.V1;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace Andaha.Services.Shopping.Tests.Bill;

public class BillImageMoveTests
{
    private static readonly Guid Owner = Guid.NewGuid();
    private static readonly DateTime OldDate = new(2026, 10, 30);
    private static readonly DateTime NewDate = new(2026, 11, 2);

    [Fact]
    public async Task Changed_date_copies_to_the_new_path_renames_and_deletes_the_old_blob()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var (bill, oldName) = Seed(context, "Billa", OldDate);
            var images = Substitute.For<IImageRepository>();
            string newName = BillImagePath.ForBill(Owner, NewDate, "Billa", bill.Id, 1, ".jpg");

            var result = await Handler(context, images).Handle(Command(bill, "Billa", NewDate), CancellationToken.None);

            Assert.IsType<Ok<Requests.Bill.Dtos.V1.BillDto>>(result);
            Assert.Contains("/2026/11/2026-11-02_", newName);
            await images.Received(1).CopyImageAsync(oldName, newName, Arg.Any<CancellationToken>());
            await images.Received(1).DeleteImageAsync(oldName, Arg.Any<CancellationToken>());
            Assert.Equal([newName], await StoredImages(context, bill.Id));
        }
    }

    [Fact]
    public async Task Changed_shop_moves_the_image()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var (bill, oldName) = Seed(context, "Billa", OldDate);
            var images = Substitute.For<IImageRepository>();
            string newName = BillImagePath.ForBill(Owner, OldDate, "Spar", bill.Id, 1, ".jpg");

            await Handler(context, images).Handle(Command(bill, "Spar", OldDate), CancellationToken.None);

            await images.Received(1).CopyImageAsync(oldName, newName, Arg.Any<CancellationToken>());
            await images.Received(1).DeleteImageAsync(oldName, Arg.Any<CancellationToken>());
            Assert.Equal([newName], await StoredImages(context, bill.Id));
        }
    }

    [Fact]
    public async Task Changed_price_only_does_not_copy_or_delete()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var (bill, oldName) = Seed(context, "Billa", OldDate);
            var images = Substitute.For<IImageRepository>();

            await Handler(context, images).Handle(Command(bill, "Billa", OldDate, price: 9.99), CancellationToken.None);

            await images.DidNotReceiveWithAnyArgs().CopyImageAsync(default!, default!, default);
            await images.DidNotReceiveWithAnyArgs().DeleteImageAsync(default!, default);
            Assert.Equal([oldName], await StoredImages(context, bill.Id));
        }
    }

    [Fact]
    public async Task Shop_name_with_the_same_slug_does_not_move()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var (bill, oldName) = Seed(context, "Billa Plus", OldDate);
            var images = Substitute.For<IImageRepository>();

            await Handler(context, images).Handle(Command(bill, "Billa  Plus!", OldDate), CancellationToken.None);

            await images.DidNotReceiveWithAnyArgs().CopyImageAsync(default!, default!, default);
            await images.DidNotReceiveWithAnyArgs().DeleteImageAsync(default!, default);
            Assert.Equal([oldName], await StoredImages(context, bill.Id));
        }
    }

    [Fact]
    public async Task Failing_copy_saves_nothing_deletes_nothing_and_returns_a_problem()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var (bill, oldName) = Seed(context, "Billa", OldDate);
            var images = Substitute.For<IImageRepository>();
            images.CopyImageAsync(default!, default!, default).ThrowsForAnyArgs(new IOException("nas down"));

            var result = await Handler(context, images).Handle(Command(bill, "Spar", NewDate, price: 9.99), CancellationToken.None);

            Assert.IsType<ProblemHttpResult>(result);
            await images.DidNotReceiveWithAnyArgs().DeleteImageAsync(default!, default);
            Assert.Equal([oldName], await StoredImages(context, bill.Id));
            context.ChangeTracker.Clear();
            var stored = await context.Bill.SingleAsync(b => b.Id == bill.Id);
            Assert.Equal("Billa", stored.ShopName);
            Assert.Equal(OldDate, stored.Date);
            Assert.Equal(5, stored.Price);
        }
    }

    [Fact]
    public async Task Failing_delete_of_the_old_blob_logs_a_warning_and_stays_successful()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var (bill, oldName) = Seed(context, "Billa", OldDate);
            var images = Substitute.For<IImageRepository>();
            images.DeleteImageAsync(oldName, Arg.Any<CancellationToken>()).ThrowsAsync(new IOException("nas down"));
            var logger = new CapturingLogger();

            var result = await Handler(context, images, logger: logger).Handle(Command(bill, "Billa", NewDate), CancellationToken.None);

            Assert.IsType<Ok<Requests.Bill.Dtos.V1.BillDto>>(result);
            Assert.Contains(logger.Entries, e => e.Level == LogLevel.Warning);
        }
    }

    [Fact]
    public async Task With_a_new_image_no_copy_happens_and_the_upload_command_runs()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var (bill, oldName) = Seed(context, "Billa", OldDate);
            var images = Substitute.For<IImageRepository>();
            var sender = Substitute.For<ISender>();
            var file = Substitute.For<IFormFile>();

            await Handler(context, images, sender).Handle(Command(bill, "Billa", NewDate, image: file), CancellationToken.None);

            await images.DidNotReceiveWithAnyArgs().CopyImageAsync(default!, default!, default);
            await images.DidNotReceiveWithAnyArgs().DeleteImageAsync(default!, default);
            await sender.Received(1).Send(Arg.Is<UploadBillImageCommand>(c => c.Id == bill.Id), Arg.Any<CancellationToken>());
            Assert.Equal([oldName], await StoredImages(context, bill.Id));
        }
    }

    [Fact]
    public async Task Legacy_name_without_a_slash_is_not_moved()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var (bill, _) = Seed(context, "Billa", OldDate, imageName: "legacy-image-1");
            var images = Substitute.For<IImageRepository>();

            await Handler(context, images).Handle(Command(bill, "Spar", NewDate), CancellationToken.None);

            await images.DidNotReceiveWithAnyArgs().CopyImageAsync(default!, default!, default);
            await images.DidNotReceiveWithAnyArgs().DeleteImageAsync(default!, default);
            Assert.Equal(["legacy-image-1"], await StoredImages(context, bill.Id));
        }
    }

    private static (Core.Bill Bill, string ImageName) Seed(
        Infrastructure.ShoppingDbContext context, string shop, DateTime date, string? imageName = null)
    {
        var category = new Core.BillCategory(Owner, "ZZ Lebensmittel", "red", 0, Array.Empty<(string, int)>());
        context.BillCategory.Add(category);
        var bill = new Core.Bill(null, Owner, category.Id, null, shop, 5, date);
        string name = imageName ?? BillImagePath.ForBill(Owner, date, shop, bill.Id, 1, ".jpg");
        bill.AddImage(name, []);
        context.Bill.Add(bill);
        context.SaveChanges();
        context.ChangeTracker.Clear();

        return (bill, name);
    }

    private static UpdateBillCommand Command(Core.Bill bill, string shop, DateTime date, double price = 5, IFormFile? image = null)
        => new(bill.Id, bill.CategoryId, null, shop, price, date, null, image);

    private static async Task<List<string>> StoredImages(Infrastructure.ShoppingDbContext context, Guid billId)
    {
        context.ChangeTracker.Clear();

        return await context.BillImage.Where(i => i.BillId == billId).Select(i => i.Name).ToListAsync();
    }

    private static UpdateBillCommandHandler Handler(
        Infrastructure.ShoppingDbContext context, IImageRepository images, ISender? sender = null, ILogger<UpdateBillCommandHandler>? logger = null)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(Owner);

        return new UpdateBillCommandHandler(
            sender ?? Substitute.For<ISender>(), context, identity, Substitute.For<ICollaborationApiProxy>(), images, logger ?? new CapturingLogger());
    }

    private sealed class CapturingLogger : ILogger<UpdateBillCommandHandler>
    {
        public List<(LogLevel Level, string Message)> Entries { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            => Entries.Add((logLevel, formatter(state, exception)));
    }
}
