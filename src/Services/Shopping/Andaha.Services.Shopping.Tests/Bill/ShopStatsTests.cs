using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using Andaha.Services.Shopping.Requests.Bill.GetShopStats.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Bill;

public class ShopStatsTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    [Fact]
    public async Task Shop_stats_last_365_days_grouped_with_count_and_last_used()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var k1 = new BillCategory(UserA, "K1", "#111111", 0, new[] { ("U1", 0) });
            context.BillCategory.Add(k1);
            context.SaveChanges();
            var u1 = k1.SubCategories.Single().Id;

            var identity = Substitute.For<IIdentityService>();
            identity.GetUserId().Returns(UserA);

            var now = DateTime.UtcNow;
            var newest = now.AddDays(-2);

            void Add(string shop, DateTime date, Guid? user = null, Guid? sub = null) =>
                context.Bill.Add(new Core.Bill(null, user ?? UserA, k1.Id, sub, shop, 1.0, date));

            Add("Billa", now.AddDays(-10));
            Add("billa ", newest);
            Add("Billa", now.AddDays(-20));
            Add("Billa", now.AddDays(-5), sub: u1);
            Add("Edge365", now.AddDays(-365).AddHours(2));
            Add("Edge366", now.AddDays(-366).AddHours(-2));
            Add("Foreign", now.AddDays(-1), user: UserB);
            context.SaveChanges();

            var handler = new GetShopStatsQueryHandler(context, identity);
            var result = await handler.Handle(new GetShopStatsQuery(), CancellationToken.None);
            var stats = Assert.IsType<Ok<ShopStatDto[]>>(result).Value!;

            Assert.Equal(3, stats.Length);

            var billa = stats[0];
            Assert.Equal("Billa", billa.ShopName);
            Assert.Null(billa.SubCategoryId);
            Assert.Equal(3, billa.Count);
            Assert.Equal(newest, billa.LastUsed, TimeSpan.FromSeconds(1));

            Assert.Contains(stats, s => s.ShopName == "Billa" && s.SubCategoryId == u1 && s.Count == 1);
            Assert.Contains(stats, s => s.ShopName == "Edge365");
            Assert.DoesNotContain(stats, s => s.ShopName == "Edge366");
            Assert.DoesNotContain(stats, s => s.ShopName == "Foreign");
        }
    }
}
