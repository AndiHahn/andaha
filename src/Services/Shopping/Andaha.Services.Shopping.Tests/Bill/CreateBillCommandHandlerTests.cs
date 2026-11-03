using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using Andaha.Services.Shopping.Requests.Bill.CreateBill.V1;
using Andaha.Services.Shopping.Requests.Bill.UploadBillImage.V1;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Bill;

public class CreateBillCommandHandlerTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    private sealed record Fixture(
        ShoppingDbContext Context,
        ISender Sender,
        CreateBillCommandHandler Handler,
        Guid CategoryId);

    private static Fixture Create(ShoppingDbContext context, Guid currentUser)
    {
        var category = new BillCategory(UserA, "K1", "#111111", 0, new[] { ("U1", 0) });
        context.BillCategory.Add(category);
        context.SaveChanges();

        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(currentUser);
        var sender = Substitute.For<ISender>();

        return new Fixture(context, sender, new CreateBillCommandHandler(sender, context, identity), category.Id);
    }

    private static CreateBillCommand Command(Fixture f, Guid id, IFormFile? image = null)
        => new(id, f.CategoryId, null, "Shop", 12.5, DateTime.UtcNow, null, image);

    [Fact]
    public async Task Create_same_id_twice_returns_existing_bill()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Create(context, UserA);
            var id = Guid.NewGuid();

            await f.Handler.Handle(Command(f, id), CancellationToken.None);
            var second = await f.Handler.Handle(Command(f, id), CancellationToken.None);

            Assert.Equal(1, context.Bill.Count());
            var ok = Assert.IsType<Ok<BillDto>>(second);
            Assert.Equal(id, ok.Value!.Id);
        }
    }

    [Fact]
    public async Task Create_existing_id_of_other_user_returns_conflict()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Create(context, UserA);
            var id = Guid.NewGuid();
            context.Bill.Add(new Core.Bill(id, UserB, f.CategoryId, null, "Other", 1, DateTime.UtcNow));
            context.SaveChanges();

            var result = await f.Handler.Handle(Command(f, id), CancellationToken.None);

            Assert.IsType<Conflict>(result);
            Assert.Equal(1, context.Bill.Count());
        }
    }

    [Fact]
    public async Task Create_existing_bill_without_image_uploads_image()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Create(context, UserA);
            var id = Guid.NewGuid();
            await f.Handler.Handle(Command(f, id), CancellationToken.None);

            var image = Substitute.For<IFormFile>();
            await f.Handler.Handle(Command(f, id, image), CancellationToken.None);

            await f.Sender.Received(1).Send(
                Arg.Is<UploadBillImageCommand>(c => c.Id == id),
                Arg.Any<CancellationToken>());
        }
    }

    [Fact]
    public async Task Create_existing_bill_with_image_does_not_upload_again()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Create(context, UserA);
            var id = Guid.NewGuid();
            var bill = new Core.Bill(id, UserA, f.CategoryId, null, "Shop", 1, DateTime.UtcNow);
            bill.AddImage("img.jpg", new byte[] { 1 });
            context.Bill.Add(bill);
            context.SaveChanges();

            var image = Substitute.For<IFormFile>();
            var result = await f.Handler.Handle(Command(f, id, image), CancellationToken.None);

            Assert.IsType<Ok<BillDto>>(result);
            await f.Sender.DidNotReceiveWithAnyArgs().Send(default(UploadBillImageCommand)!, default);
        }
    }
}
