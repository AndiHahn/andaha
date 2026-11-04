using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.ImageRepositories.Image;
using Andaha.Services.Shopping.Requests.Bill.DeleteAnalyzedBill.V1;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using Andaha.Services.Shopping.Requests.Bill.GetAnalyzedBills.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Bill;

public class DeleteAnalyzedBillTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    private static IIdentityService Identity(Guid user)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(user);
        return identity;
    }

    private static AnalyzedBill SeedAnalyzedBill(Infrastructure.ShoppingDbContext context, Guid owner, string imageName)
    {
        var bill = new AnalyzedBill(owner, null, null, "Shop", 10, 0.4, null, DateTime.UtcNow);
        bill.AddLineItem("Milch", 1.25, 2.5, 2);
        bill.AddImage(imageName, [1]);
        context.AnalyzedBill.Add(bill);
        context.SaveChanges();
        context.ChangeTracker.Clear();
        return bill;
    }

    [Fact]
    public async Task Delete_analyzed_bill_removes_entry_line_items_and_image()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var bill = SeedAnalyzedBill(context, UserA, "img-a");
            var images = Substitute.For<IImageRepository>();

            var handler = new DeleteAnalyzedBillCommandHandler(context, Identity(UserA), images);
            var result = await handler.Handle(new DeleteAnalyzedBillCommand(bill.Id), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            context.ChangeTracker.Clear();
            Assert.False(await context.AnalyzedBill.AnyAsync(b => b.Id == bill.Id));
            Assert.False(await context.AnalyzedBillLineItem.AnyAsync(l => l.BillId == bill.Id));
            Assert.False(await context.BillImage.AnyAsync(i => i.Name == "img-a"));
            await images.Received(1).DeleteImageAsync("img-a", Arg.Any<CancellationToken>());
        }
    }

    [Fact]
    public async Task Delete_foreign_analyzed_bill_returns_not_found()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var bill = SeedAnalyzedBill(context, UserA, "img-a");
            var images = Substitute.For<IImageRepository>();

            var handler = new DeleteAnalyzedBillCommandHandler(context, Identity(UserB), images);

            Assert.IsType<NotFound<string>>(await handler.Handle(new DeleteAnalyzedBillCommand(bill.Id), CancellationToken.None));
            Assert.IsType<NotFound<string>>(await handler.Handle(new DeleteAnalyzedBillCommand(Guid.NewGuid()), CancellationToken.None));

            context.ChangeTracker.Clear();
            Assert.True(await context.AnalyzedBill.AnyAsync(b => b.Id == bill.Id));
            await images.DidNotReceiveWithAnyArgs().DeleteImageAsync(default!, default);
        }
    }

    [Fact]
    public async Task Get_analyzed_bills_does_not_contain_deleted_entry()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var deleted = SeedAnalyzedBill(context, UserA, "img-a");
            var kept = SeedAnalyzedBill(context, UserA, "img-b");

            var handler = new DeleteAnalyzedBillCommandHandler(context, Identity(UserA), Substitute.For<IImageRepository>());
            await handler.Handle(new DeleteAnalyzedBillCommand(deleted.Id), CancellationToken.None);
            context.ChangeTracker.Clear();

            var result = await new GetAnalyzedBillsQueryHandler(context, Identity(UserA))
                .Handle(new GetAnalyzedBillsQuery(), CancellationToken.None);

            var list = Assert.IsType<Ok<List<AnalyzedBillDto>>>(result).Value!;
            var remaining = Assert.Single(list);
            Assert.Equal(kept.Id, remaining.Id);
        }
    }
}
