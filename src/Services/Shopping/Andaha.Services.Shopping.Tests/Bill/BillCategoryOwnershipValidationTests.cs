using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Requests.Bill.CreateBill.V1;
using Andaha.Services.Shopping.Requests.Bill.UpdateBill.V1;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Bill;

public class BillCategoryOwnershipValidationTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid Stranger = Guid.NewGuid();

    private static (IIdentityService Identity, Guid StrangerCategoryId) Seed(Infrastructure.ShoppingDbContext context)
    {
        var own = new BillCategory(UserA, "Eigene", "#111111", 0, Array.Empty<(string, int)>());
        var strangers = new BillCategory(Stranger, "Fremde", "#222222", 0, Array.Empty<(string, int)>());
        context.BillCategory.AddRange(own, strangers);
        context.SaveChanges();

        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(UserA);

        return (identity, strangers.Id);
    }

    [Fact]
    public async Task Create_bill_rejects_category_of_unconnected_user()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var (identity, strangerCategoryId) = Seed(context);
            var validator = new CreateBillCommandValidator(context, identity);

            var command = new CreateBillCommand(null, strangerCategoryId, null, "Shop", 1.0, DateTime.UtcNow, null, null);

            Assert.False((await validator.ValidateAsync(command)).IsValid);
        }
    }

    [Fact]
    public async Task Update_bill_rejects_category_of_unconnected_user()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var (identity, strangerCategoryId) = Seed(context);
            var validator = new UpdateBillCommandValidator(context, identity);

            var command = new UpdateBillCommand(Guid.NewGuid(), strangerCategoryId, null, "Shop", 1.0, DateTime.UtcNow, null, null);

            Assert.False((await validator.ValidateAsync(command)).IsValid);
        }
    }
}
