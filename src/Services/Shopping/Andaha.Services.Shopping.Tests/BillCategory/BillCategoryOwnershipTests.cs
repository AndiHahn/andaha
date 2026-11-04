using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.BillCategory.DeleteBillCategory.V1;
using Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;
using Andaha.Services.Shopping.Requests.BillCategory.UpdateBillCategory.V1;
using Andaha.Services.Shopping.Requests.BillCategory.UpdateOrder.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.CategoryOwnership;

public class BillCategoryOwnershipTests
{
    private static readonly Guid Owner = Guid.NewGuid();
    private static readonly Guid Intruder = Guid.NewGuid();

    private sealed record Fixture(
        ShoppingDbContext Context,
        IIdentityService IntruderIdentity,
        IIdentityService OwnerIdentity,
        Core.BillCategory OwnerCategory,
        Guid OwnerSubCategoryId);

    private static Fixture Seed(ShoppingDbContext context)
    {
        var ownerDefault = new Core.BillCategory(Owner, "Default", "#000000", 0, Array.Empty<(string, int)>(), isDefault: true);
        var ownerCategory = new Core.BillCategory(Owner, "Foreign", "#111111", 1, new[] { ("Sub", 0) });
        var intruderDefault = new Core.BillCategory(Intruder, "Default", "#000000", 0, Array.Empty<(string, int)>(), isDefault: true);
        context.BillCategory.AddRange(ownerDefault, ownerCategory, intruderDefault);
        context.SaveChanges();

        var subId = ownerCategory.SubCategories.Single().Id;
        context.BillTemplate.Add(new Core.BillTemplate(Owner, "T", "Shop", ownerCategory.Id, subId, 0));
        context.HiddenBillSuggestion.Add(new HiddenBillSuggestion(Owner, "Rewe", ownerCategory.Id, subId));
        context.SaveChanges();

        var intruderIdentity = Substitute.For<IIdentityService>();
        intruderIdentity.GetUserId().Returns(Intruder);
        var ownerIdentity = Substitute.For<IIdentityService>();
        ownerIdentity.GetUserId().Returns(Owner);

        return new Fixture(context, intruderIdentity, ownerIdentity, ownerCategory, subId);
    }

    private static void AssertOwnerDataIntact(ShoppingDbContext context, Fixture f)
    {
        var category = context.BillCategory.AsNoTracking().Include(c => c.SubCategories).Single(c => c.Id == f.OwnerCategory.Id);
        Assert.Equal("Foreign", category.Name);
        Assert.Equal(1, category.Order);
        Assert.Equal("Sub", category.SubCategories.Single().Name);
        Assert.Equal(f.OwnerCategory.Id, context.BillTemplate.AsNoTracking().Single().CategoryId);
        Assert.Equal(f.OwnerSubCategoryId, context.BillTemplate.AsNoTracking().Single().SubCategoryId);
        Assert.Single(context.HiddenBillSuggestion.AsNoTracking());
    }

    [Fact]
    public async Task Delete_foreign_category_returns_not_found_and_changes_nothing()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var handler = new DeleteBillCategoryCommandHandler(context, f.IntruderIdentity);

            var result = await handler.Handle(new DeleteBillCategoryCommand(f.OwnerCategory.Id), CancellationToken.None);

            Assert.IsType<NotFound>(result);
            AssertOwnerDataIntact(context, f);
        }
    }

    [Fact]
    public async Task Delete_unknown_category_returns_not_found()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var handler = new DeleteBillCategoryCommandHandler(context, f.OwnerIdentity);

            var result = await handler.Handle(new DeleteBillCategoryCommand(Guid.NewGuid()), CancellationToken.None);

            Assert.IsType<NotFound>(result);
        }
    }

    [Fact]
    public async Task Delete_own_category_still_works_and_cleans_up()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var handler = new DeleteBillCategoryCommandHandler(context, f.OwnerIdentity);

            var result = await handler.Handle(new DeleteBillCategoryCommand(f.OwnerCategory.Id), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            Assert.DoesNotContain(context.BillCategory.AsNoTracking(), c => c.Id == f.OwnerCategory.Id);
            Assert.Empty(context.BillTemplate);
            Assert.Empty(context.HiddenBillSuggestion);
        }
    }

    [Fact]
    public async Task Update_foreign_category_returns_not_found_and_changes_nothing()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var handler = new UpdateBillCategoryCommandHandler(context, f.IntruderIdentity);

            var result = await handler.Handle(
                new UpdateBillCategoryCommand(
                    f.OwnerCategory.Id,
                    new CategoryUpdateDto("Hacked", "#999999", true, new[] { new SubCategoryUpdateDto(null, "New", 0) })),
                CancellationToken.None);

            Assert.IsType<NotFound>(result);
            AssertOwnerDataIntact(context, f);
        }
    }

    [Fact]
    public async Task UpdateOrder_with_foreign_category_returns_not_found_and_changes_nothing()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var handler = new UpdateOrderCommandHandler(context, f.IntruderIdentity);

            var result = await handler.Handle(
                new UpdateOrderCommand(new[] { new CategoryOrderDto(f.OwnerCategory.Id, 0) }),
                CancellationToken.None);

            Assert.IsType<NotFound<string>>(result);
            AssertOwnerDataIntact(context, f);
        }
    }
}
