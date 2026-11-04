using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.BillTemplate.CreateBillTemplate.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.UpdateBillTemplate.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.UpdateBillTemplateOrder.V1;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.BillTemplate;

public class BillTemplateValidatorTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    private sealed record Fixture(
        ShoppingDbContext Context,
        IIdentityService Identity,
        Guid K1,
        Guid U1,
        Guid U2,
        Guid ForeignCategory);

    private static Fixture Seed(ShoppingDbContext context)
    {
        var k1 = new BillCategory(UserA, "K1", "#111111", 0, new[] { ("U1", 0) });
        var k2 = new BillCategory(UserA, "K2", "#222222", 1, new[] { ("U2", 0) });
        var foreign = new BillCategory(UserB, "KB", "#333333", 0, new[] { ("UB", 0) });
        context.BillCategory.AddRange(k1, k2, foreign);
        context.SaveChanges();

        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(UserA);

        return new Fixture(
            context, identity, k1.Id, k1.SubCategories.Single().Id, k2.SubCategories.Single().Id, foreign.Id);
    }

    private static async Task<bool> ValidateCreate(Func<Fixture, CreateBillTemplateCommand> command)
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var validator = new CreateBillTemplateCommandValidator(f.Context, f.Identity);
            return (await validator.ValidateAsync(command(f))).IsValid;
        }
    }

    private static async Task<bool> ValidateUpdate(Func<Fixture, UpdateBillTemplateCommand> command)
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var validator = new UpdateBillTemplateCommandValidator(f.Context, f.Identity);
            return (await validator.ValidateAsync(command(f))).IsValid;
        }
    }

    [Fact]
    public async Task Create_with_own_category_and_subcategory_is_valid()
        => Assert.True(await ValidateCreate(f => new CreateBillTemplateCommand("N", "S", f.K1, f.U1)));

    [Fact]
    public async Task Create_without_name_shop_and_subcategory_is_valid()
        => Assert.True(await ValidateCreate(f => new CreateBillTemplateCommand(null, null, f.K1, null)));

    [Fact]
    public async Task Create_with_foreign_category_is_invalid()
        => Assert.False(await ValidateCreate(f => new CreateBillTemplateCommand("N", "S", f.ForeignCategory, null)));

    [Fact]
    public async Task Create_with_unknown_category_is_invalid()
        => Assert.False(await ValidateCreate(f => new CreateBillTemplateCommand("N", "S", Guid.NewGuid(), null)));

    [Fact]
    public async Task Create_with_subcategory_of_other_category_is_invalid()
        => Assert.False(await ValidateCreate(f => new CreateBillTemplateCommand("N", "S", f.K1, f.U2)));

    [Fact]
    public async Task Create_with_name_of_100_characters_is_valid_and_101_is_invalid()
    {
        Assert.True(await ValidateCreate(f => new CreateBillTemplateCommand(new string('a', 100), null, f.K1, null)));
        Assert.False(await ValidateCreate(f => new CreateBillTemplateCommand(new string('a', 101), null, f.K1, null)));
    }

    [Fact]
    public async Task Create_with_shop_name_of_200_characters_is_valid_and_201_is_invalid()
    {
        Assert.True(await ValidateCreate(f => new CreateBillTemplateCommand(null, new string('a', 200), f.K1, null)));
        Assert.False(await ValidateCreate(f => new CreateBillTemplateCommand(null, new string('a', 201), f.K1, null)));
    }

    [Fact]
    public async Task Update_with_foreign_category_is_invalid()
        => Assert.False(await ValidateUpdate(f => new UpdateBillTemplateCommand(Guid.NewGuid(), "N", "S", f.ForeignCategory, null)));

    [Fact]
    public async Task Update_with_subcategory_of_other_category_is_invalid()
        => Assert.False(await ValidateUpdate(f => new UpdateBillTemplateCommand(Guid.NewGuid(), "N", "S", f.K1, f.U2)));

    [Fact]
    public async Task Update_with_own_category_and_subcategory_is_valid()
        => Assert.True(await ValidateUpdate(f => new UpdateBillTemplateCommand(Guid.NewGuid(), "N", "S", f.K1, f.U1)));

    [Fact]
    public async Task Update_with_too_long_name_is_invalid()
        => Assert.False(await ValidateUpdate(f => new UpdateBillTemplateCommand(Guid.NewGuid(), new string('a', 101), "S", f.K1, null)));

    private static async Task<bool> ValidateOrder(Func<Guid[], Guid[]> ids)
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var own = Enumerable.Range(0, 3)
                .Select(i => new Core.BillTemplate(UserA, "T" + i, null, f.K1, null, i))
                .ToArray();
            var foreign = new Core.BillTemplate(UserB, "B", null, f.ForeignCategory, null, 0);
            context.BillTemplate.AddRange(own);
            context.BillTemplate.Add(foreign);
            context.SaveChanges();

            var validator = new UpdateBillTemplateOrderCommandValidator(f.Context, f.Identity);
            var command = new UpdateBillTemplateOrderCommand(ids(own.Select(t => t.Id).Append(foreign.Id).ToArray()));
            return (await validator.ValidateAsync(command)).IsValid;
        }
    }

    [Fact]
    public async Task Update_order_with_all_own_ids_in_any_sequence_is_valid()
        => Assert.True(await ValidateOrder(ids => new[] { ids[2], ids[0], ids[1] }));

    [Fact]
    public async Task Update_order_with_missing_id_is_rejected()
        => Assert.False(await ValidateOrder(ids => new[] { ids[0], ids[1] }));

    [Fact]
    public async Task Update_order_with_duplicate_id_is_rejected()
        => Assert.False(await ValidateOrder(ids => new[] { ids[0], ids[1], ids[1] }));

    [Fact]
    public async Task Update_order_with_foreign_id_is_rejected()
        => Assert.False(await ValidateOrder(ids => new[] { ids[0], ids[1], ids[3] }));

    [Fact]
    public async Task Update_order_with_additional_foreign_id_is_rejected()
        => Assert.False(await ValidateOrder(ids => ids));
}
