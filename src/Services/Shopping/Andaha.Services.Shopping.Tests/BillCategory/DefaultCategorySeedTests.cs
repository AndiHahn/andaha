using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;
using Andaha.Services.Shopping.Requests.BillCategory.ListBillCategories.V1;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.CategoryOwnership;

public class DefaultCategorySeedTests
{
    private static readonly Guid UserA = Guid.NewGuid();

    private static IIdentityService IdentityOf(Guid userId)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(userId);
        return identity;
    }

    private static async Task<List<CategoryDto>> ListAsync(ShoppingDbContext context)
    {
        var handler = new ListBillCategoriesQueryHandler(context, IdentityOf(UserA));
        var result = await handler.Handle(new ListBillCategoriesQuery(), CancellationToken.None);
        return Assert.IsType<Ok<List<CategoryDto>>>(result).Value!;
    }

    // Two handlers on two contexts sharing one SQLite connection. SQLite cannot interleave two
    // write transactions on one connection, so the calls run one after the other: the second
    // call must see the first call's categories and create nothing.
    [Fact]
    public async Task List_seeds_defaults_once_when_called_twice_concurrently()
    {
        var (first, connection) = TestDb.CreateShopping();
        using (connection)
        using (first)
        {
            var options = new DbContextOptionsBuilder<ShoppingDbContext>().UseSqlite(connection).Options;
            using var second = new ShoppingDbContext(options);

            var firstResult = await ListAsync(first);
            var secondResult = await ListAsync(second);

            int expected = ShoppingDbContextSeed.CreateInitialCategories(UserA).Count;
            Assert.Equal(expected, firstResult.Count);
            Assert.Equal(firstResult.Select(c => c.Id), secondResult.Select(c => c.Id));
            Assert.Equal(expected, first.BillCategory.AsNoTracking().Count(c => c.UserId == UserA));
            Assert.Single(first.BillCategory.AsNoTracking(), c => c.UserId == UserA && c.IsDefault);
        }
    }
}
