using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using Andaha.Services.Shopping.Requests.Bill.SearchBills.V1;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Bill;

public class SearchBillsSumTests
{
    private static readonly Guid UserA = Guid.NewGuid();

    private static SearchBillsQueryHandler CreateHandler(Infrastructure.ShoppingDbContext context)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(UserA);
        var collaboration = Substitute.For<ICollaborationApiProxy>();
        collaboration.GetConnectedUsers(Arg.Any<CancellationToken>()).Returns(Array.Empty<Guid>());
        return new SearchBillsQueryHandler(context, identity, collaboration);
    }

    private static void Seed(Infrastructure.ShoppingDbContext context)
    {
        var food = new BillCategory(UserA, "Food", "#111111", 0, Array.Empty<(string, int)>());
        var other = new BillCategory(UserA, "Other", "#222222", 1, Array.Empty<(string, int)>());
        context.BillCategory.AddRange(food, other);
        context.Bill.AddRange(
            new Core.Bill(null, UserA, food.Id, null, "A", 10.0, new DateTime(2026, 10, 3, 12, 0, 0, DateTimeKind.Utc)),
            new Core.Bill(null, UserA, food.Id, null, "B", 20.0, new DateTime(2026, 10, 15, 12, 0, 0, DateTimeKind.Utc)),
            new Core.Bill(null, UserA, other.Id, null, "C", 5.0, new DateTime(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc)),
            new Core.Bill(null, UserA, food.Id, null, "D", 7.0, new DateTime(2026, 11, 2, 12, 0, 0, DateTimeKind.Utc)));
        context.SaveChanges();
    }

    private static async Task<BillSearchResultDto> Search(
        Infrastructure.ShoppingDbContext context, SearchBillsQuery query)
    {
        var result = await CreateHandler(context).Handle(query, CancellationToken.None);
        return Assert.IsType<Ok<BillSearchResultDto>>(result).Value!;
    }

    [Fact]
    public async Task Search_returns_total_sum_and_month_sums_over_all_pages()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            Seed(context);

            var dto = await Search(context, new SearchBillsQuery(2, 0, null, null, null, null));

            Assert.Equal(2, dto.Values.Count);
            Assert.Equal(4, dto.TotalCount);
            Assert.Equal(42.0, dto.TotalSum);
            Assert.Equal(new[] { new MonthSumDto("2026-11", 7.0), new MonthSumDto("2026-10", 35.0) }, dto.MonthSums);
        }
    }

    [Fact]
    public async Task Search_sums_respect_category_and_date_filter()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            Seed(context);

            var dto = await Search(context, new SearchBillsQuery(
                10, 0, null, new[] { "Food" }, new DateTime(2026, 10, 10), null));

            Assert.Equal(2, dto.TotalCount);
            Assert.Equal(27.0, dto.TotalSum);
            Assert.Equal(new[] { new MonthSumDto("2026-11", 7.0), new MonthSumDto("2026-10", 20.0) }, dto.MonthSums);
        }
    }

    [Fact]
    public async Task Search_without_matches_returns_zero_sum_and_no_months()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            Seed(context);

            var dto = await Search(context, new SearchBillsQuery(
                10, 0, null, new[] { "Other" }, new DateTime(2026, 11, 1), null));

            Assert.Empty(dto.Values);
            Assert.Equal(0, dto.TotalCount);
            Assert.Equal(0.0, dto.TotalSum);
            Assert.Empty(dto.MonthSums);
        }
    }
}
