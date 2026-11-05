using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.BillCategory.DeleteBillCategory.V1;
using Andaha.Services.Shopping.Requests.BillCategory.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.CategoryOwnership;

public class DeleteDefaultCategoryTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    private static IIdentityService IdentityOf(Guid userId)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(userId);
        return identity;
    }

    private static Core.BillCategory Default(Guid userId, int order = 0) =>
        new(userId, "Keine", "white", order, Array.Empty<(string, int)>(), includeToStatistics: false, isDefault: true);

    private static Core.Bill BillIn(Guid userId, Core.BillCategory category, Guid? subCategoryId = null) =>
        new(null, userId, category.Id, subCategoryId, "Shop", 10.0, new DateTime(2026, 3, 1));

    [Fact]
    public async Task Delete_default_category_returns_bad_request_and_changes_nothing()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var defaultCategory = Default(UserA);
            context.BillCategory.Add(defaultCategory);
            context.SaveChanges();
            var bill = BillIn(UserA, defaultCategory);
            context.Bill.Add(bill);
            context.SaveChanges();

            var handler = new DeleteBillCategoryCommandHandler(context, IdentityOf(UserA));

            var result = await handler.Handle(new DeleteBillCategoryCommand(defaultCategory.Id), CancellationToken.None);

            var statusCode = Assert.IsAssignableFrom<IStatusCodeHttpResult>(result).StatusCode;
            Assert.Equal(StatusCodes.Status400BadRequest, statusCode);
            Assert.Single(context.BillCategory.AsNoTracking(), c => c.Id == defaultCategory.Id);
            Assert.Equal(defaultCategory.Id, context.Bill.AsNoTracking().Single(b => b.Id == bill.Id).CategoryId);
        }
    }

    [Fact]
    public async Task Delete_category_moves_own_bills_to_own_default_and_clears_subcategory()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var defaultCategory = Default(UserA);
            var food = new Core.BillCategory(UserA, "Lebensmittel", "red", 1, new[] { ("Obst", 0) });
            context.BillCategory.AddRange(defaultCategory, food);
            context.SaveChanges();
            var bill = BillIn(UserA, food, food.SubCategories.Single().Id);
            context.Bill.Add(bill);
            context.SaveChanges();

            var handler = new DeleteBillCategoryCommandHandler(context, IdentityOf(UserA));

            var result = await handler.Handle(new DeleteBillCategoryCommand(food.Id), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            var stored = context.Bill.AsNoTracking().Single(b => b.Id == bill.Id);
            Assert.Equal(defaultCategory.Id, stored.CategoryId);
            Assert.Null(stored.SubCategoryId);
            Assert.DoesNotContain(context.BillCategory.AsNoTracking(), c => c.Id == food.Id);
            Assert.Empty(context.BillSubCategory.AsNoTracking());
        }
    }

    [Fact]
    public async Task Delete_category_moves_partner_bill_to_partner_default()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var defaultA = Default(UserA);
            var food = new Core.BillCategory(UserA, "Lebensmittel", "red", 1, new[] { ("Obst", 0) });
            var defaultB = Default(UserB);
            context.BillCategory.AddRange(defaultA, food, defaultB);
            context.SaveChanges();
            var partnerBill = BillIn(UserB, food, food.SubCategories.Single().Id);
            context.Bill.Add(partnerBill);
            context.SaveChanges();

            var handler = new DeleteBillCategoryCommandHandler(context, IdentityOf(UserA));

            var result = await handler.Handle(new DeleteBillCategoryCommand(food.Id), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            var stored = context.Bill.AsNoTracking().SingleOrDefault(b => b.Id == partnerBill.Id);
            Assert.NotNull(stored);
            Assert.Equal(defaultB.Id, stored.CategoryId);
            Assert.Null(stored.SubCategoryId);
        }
    }

    [Fact]
    public async Task Never_reassigns_to_the_category_being_deleted()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            // Duplicate default categories exist in older databases (double seeding on first login).
            var firstDefault = Default(UserA, order: 0);
            var secondDefault = Default(UserA, order: 1);
            context.BillCategory.AddRange(firstDefault, secondDefault);
            context.SaveChanges();
            var bill = BillIn(UserA, firstDefault);
            context.Bill.Add(bill);
            context.SaveChanges();

            await BillCategoryReassignment.MoveBillsToOwnersDefaultCategoryAsync(
                context, new[] { firstDefault.Id }, CancellationToken.None);
            context.BillCategory.Remove(firstDefault);
            await context.SaveChangesAsync();

            Assert.Equal(secondDefault.Id, context.Bill.AsNoTracking().Single(b => b.Id == bill.Id).CategoryId);
        }
    }

    [Fact]
    public async Task Delete_category_with_duplicate_defaults_moves_bills_to_one_of_them()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var firstDefault = Default(UserA, order: 0);
            var secondDefault = Default(UserA, order: 1);
            var food = new Core.BillCategory(UserA, "Lebensmittel", "red", 2, Array.Empty<(string, int)>());
            context.BillCategory.AddRange(firstDefault, secondDefault, food);
            context.SaveChanges();
            var bill = BillIn(UserA, food);
            context.Bill.Add(bill);
            context.SaveChanges();

            var handler = new DeleteBillCategoryCommandHandler(context, IdentityOf(UserA));

            var result = await handler.Handle(new DeleteBillCategoryCommand(food.Id), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            Assert.Equal(firstDefault.Id, context.Bill.AsNoTracking().Single(b => b.Id == bill.Id).CategoryId);
        }
    }

    [Fact]
    public async Task Delete_category_seeds_default_for_partner_without_categories()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var defaultA = Default(UserA);
            var food = new Core.BillCategory(UserA, "Lebensmittel", "red", 1, Array.Empty<(string, int)>());
            context.BillCategory.AddRange(defaultA, food);
            context.SaveChanges();
            var partnerBill = BillIn(UserB, food);
            context.Bill.Add(partnerBill);
            context.SaveChanges();

            var handler = new DeleteBillCategoryCommandHandler(context, IdentityOf(UserA));

            var result = await handler.Handle(new DeleteBillCategoryCommand(food.Id), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            var partnerCategories = context.BillCategory.AsNoTracking().Where(c => c.UserId == UserB).ToList();
            Assert.Equal(ShoppingDbContextSeed.CreateInitialCategories(UserB).Count, partnerCategories.Count);
            var partnerDefault = Assert.Single(partnerCategories, c => c.IsDefault);
            Assert.Equal(partnerDefault.Id, context.Bill.AsNoTracking().Single(b => b.Id == partnerBill.Id).CategoryId);
        }
    }
}
