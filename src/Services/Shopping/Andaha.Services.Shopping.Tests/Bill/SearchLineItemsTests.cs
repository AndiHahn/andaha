using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Bill.Dtos.V1;
using Andaha.Services.Shopping.Requests.Bill.SearchBills.V1;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Bill;

public class SearchLineItemsTests
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

    private static async Task<BillSearchResultDto> Search(Infrastructure.ShoppingDbContext context, string? search)
    {
        var result = await CreateHandler(context).Handle(
            new SearchBillsQuery(10, 0, search, null, null, null), CancellationToken.None);
        return Assert.IsType<Ok<BillSearchResultDto>>(result).Value!;
    }

    /// <summary>
    /// "Elektro" (Oct) has two cartridge items, "Patronen Shop" (Nov) matches "Patronen" by shop name only,
    /// "Bäcker" (Oct) matches nothing. SQLite compares case-sensitively, so the terms keep their case.
    /// </summary>
    private static void Seed(Infrastructure.ShoppingDbContext context)
    {
        var category = new BillCategory(UserA, "Food", "#111111", 0, Array.Empty<(string, int)>());
        context.BillCategory.Add(category);

        var electro = new Core.Bill(null, UserA, category.Id, null, "Elektro", 50.0, new DateTime(2026, 10, 3, 12, 0, 0, DateTimeKind.Utc));
        // Stored out of order: the match is the first matching item by Position, not by insertion.
        electro.LineItems.Add(new BillLineItem(electro.Id, "Kabel", null, 5.0, 1, 0));
        electro.LineItems.Add(new BillLineItem(electro.Id, "Patronen XL Farbe", null, 10.0, 1, 2));
        electro.LineItems.Add(new BillLineItem(electro.Id, "Patronen XL", 34.99, 34.99, 1, 1));

        var shopMatch = new Core.Bill(null, UserA, category.Id, null, "Patronen Shop", 20.0, new DateTime(2026, 11, 2, 12, 0, 0, DateTimeKind.Utc));
        shopMatch.LineItems.Add(new BillLineItem(shopMatch.Id, "Tinte", null, 20.0, 1, 0));

        var baker = new Core.Bill(null, UserA, category.Id, null, "Bäcker", 7.0, new DateTime(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc));
        baker.LineItems.Add(new BillLineItem(baker.Id, "Semmel", null, 7.0, 1, 0));

        context.Bill.AddRange(electro, shopMatch, baker);
        context.SaveChanges();
        context.ChangeTracker.Clear();
    }

    [Fact]
    public async Task Search_finds_bill_by_line_item_and_returns_match()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            Seed(context);

            var dto = await Search(context, "Patronen XL");

            var bill = Assert.Single(dto.Values);
            Assert.Equal("Elektro", bill.ShopName);
            Assert.Equal(new MatchedLineItemDto("Patronen XL", 34.99), bill.MatchedLineItem);
            // The list stays lean: no line items, only the match.
            Assert.Empty(bill.LineItems);
        }
    }

    [Fact]
    public async Task Search_match_is_null_when_shop_matches()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            Seed(context);

            var dto = await Search(context, "Patronen");

            // "Elektro" matches by line item, "Patronen Shop" only by its shop name.
            Assert.Equal(new[] { "Patronen Shop", "Elektro" }, dto.Values.Select(bill => bill.ShopName));
            Assert.Null(dto.Values.Single(bill => bill.ShopName == "Patronen Shop").MatchedLineItem);
            Assert.Equal("Patronen XL", dto.Values.Single(bill => bill.ShopName == "Elektro").MatchedLineItem?.Description);

            // Without a search term no bill carries a match.
            var all = await Search(context, null);
            Assert.Equal(3, all.TotalCount);
            Assert.All(all.Values, bill => Assert.Null(bill.MatchedLineItem));
        }
    }

    [Fact]
    public async Task Search_sums_include_line_item_matches()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            Seed(context);

            var dto = await Search(context, "Patronen");

            Assert.Equal(2, dto.TotalCount);
            Assert.Equal(70.0, dto.TotalSum);
            Assert.Equal(new[] { new MonthSumDto("2026-11", 20.0), new MonthSumDto("2026-10", 50.0) }, dto.MonthSums);
        }
    }
}
