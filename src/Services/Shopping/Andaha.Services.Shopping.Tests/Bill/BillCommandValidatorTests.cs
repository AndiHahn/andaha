using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.Bill.CreateBill.V1;
using Andaha.Services.Shopping.Requests.Bill.UpdateBill.V1;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Bill;

public class BillCommandValidatorTests
{
    private static readonly Guid UserA = Guid.NewGuid();

    private sealed record Fixture(
        ShoppingDbContext Context,
        IIdentityService Identity,
        Guid K1,
        Guid U1,
        Guid U2);

    private static Fixture Seed(ShoppingDbContext context)
    {
        var k1 = new BillCategory(UserA, "K1", "#111111", 0, new[] { ("U1", 0) });
        var k2 = new BillCategory(UserA, "K2", "#222222", 1, new[] { ("U2", 0) });
        context.BillCategory.AddRange(k1, k2);
        context.SaveChanges();

        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(UserA);

        return new Fixture(context, identity, k1.Id, k1.SubCategories.Single().Id, k2.SubCategories.Single().Id);
    }

    private static async Task<bool> ValidateCreate(Func<Fixture, Guid?> subCategory)
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var validator = new CreateBillCommandValidator(f.Context, f.Identity);
            var command = new CreateBillCommand(null, f.K1, subCategory(f), "Shop", 1.0, DateTime.UtcNow, null, null);
            return (await validator.ValidateAsync(command)).IsValid;
        }
    }

    private static async Task<bool> ValidateUpdate(Func<Fixture, Guid?> subCategory)
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var validator = new UpdateBillCommandValidator(f.Context, f.Identity);
            var command = new UpdateBillCommand(Guid.NewGuid(), f.K1, subCategory(f), "Shop", 1.0, DateTime.UtcNow, null, null);
            return (await validator.ValidateAsync(command)).IsValid;
        }
    }

    [Fact]
    public async Task Create_with_valid_subcategory_is_valid() =>
        Assert.True(await ValidateCreate(f => f.U1));

    [Fact]
    public async Task Create_with_subcategory_of_other_category_is_invalid() =>
        Assert.False(await ValidateCreate(f => f.U2));

    [Fact]
    public async Task Create_without_subcategory_is_valid() =>
        Assert.True(await ValidateCreate(_ => null));

    [Fact]
    public async Task Update_with_valid_subcategory_is_valid() =>
        Assert.True(await ValidateUpdate(f => f.U1));

    [Fact]
    public async Task Update_with_subcategory_of_other_category_is_invalid() =>
        Assert.False(await ValidateUpdate(f => f.U2));
}
