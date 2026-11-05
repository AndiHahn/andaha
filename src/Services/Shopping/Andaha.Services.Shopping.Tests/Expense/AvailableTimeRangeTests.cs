using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Expense.Dtos.V1;
using Andaha.Services.Shopping.Requests.Expense.GetAvailableTimeRange.V1;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Expense;

public class AvailableTimeRangeTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid PartnerB = Guid.NewGuid();
    private static readonly Guid StrangerC = Guid.NewGuid();

    private static void SeedBill(Infrastructure.ShoppingDbContext context, Guid userId, DateTime date)
    {
        var category = new BillCategory(userId, "Lebensmittel", "red", 0, Array.Empty<(string, int)>());
        context.BillCategory.Add(category);
        context.SaveChanges();

        context.Bill.Add(new Core.Bill(null, userId, category.Id, null, "Shop", 1.0, date));
        context.SaveChanges();
    }

    private static async Task<TimeRangeDto> TimeRangeAsync(Action<Infrastructure.ShoppingDbContext> seed)
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            seed(context);

            var identity = Substitute.For<IIdentityService>();
            identity.GetUserId().Returns(UserA);
            var collaboration = Substitute.For<ICollaborationApiProxy>();
            collaboration.GetConnectedUsers(Arg.Any<CancellationToken>()).Returns(new[] { PartnerB });
            var handler = new GetAvailableTimeRangeQueryHandler(context, identity, collaboration);

            var result = await handler.Handle(new GetAvailableTimeRangeQuery(), CancellationToken.None);

            return Assert.IsType<Ok<TimeRangeDto>>(result).Value;
        }
    }

    [Fact]
    public async Task Time_range_of_account_without_bills_is_empty_when_database_has_no_bills()
    {
        var range = await TimeRangeAsync(_ => { });

        Assert.Equal(default, range);
    }

    [Fact]
    public async Task Time_range_of_account_without_bills_is_empty_when_other_users_have_bills()
    {
        var range = await TimeRangeAsync(context => SeedBill(context, StrangerC, new DateTime(2026, 3, 15)));

        Assert.Equal(default, range);
    }

    [Fact]
    public async Task Time_range_spans_own_and_connected_bills()
    {
        var range = await TimeRangeAsync(context =>
        {
            SeedBill(context, UserA, new DateTime(2026, 2, 1));
            SeedBill(context, PartnerB, new DateTime(2026, 5, 20));
            SeedBill(context, StrangerC, new DateTime(2025, 1, 1));
        });

        Assert.Equal(new DateTime(2026, 2, 1), range.StartTimeUtc);
        Assert.Equal(new DateTime(2026, 5, 20), range.EndTimeUtc);
    }
}
