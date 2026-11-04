using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.BillTemplate.Dtos.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.GetBillSuggestions.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.HideBillSuggestion.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.BillTemplate;

public class BillSuggestionTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    private sealed record Fixture(
        ShoppingDbContext Context,
        IIdentityService Identity,
        Guid K1,
        Guid U1,
        Guid K2,
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

        return new Fixture(context, identity, k1.Id, k1.SubCategories.Single().Id, k2.Id, foreign.Id);
    }

    private static void AddBill(Fixture f, string shop, DateTime date, Guid? user = null, Guid? category = null, Guid? subCategory = null)
    {
        f.Context.Bill.Add(new Core.Bill(null, user ?? UserA, category ?? f.K1, subCategory, shop, 1.0, date));
        f.Context.SaveChanges();
    }

    private static async Task<BillSuggestionDto[]> Suggestions(Fixture f)
    {
        var handler = new GetBillSuggestionsQueryHandler(f.Context, f.Identity);
        var result = await handler.Handle(new GetBillSuggestionsQuery(), CancellationToken.None);
        return Assert.IsType<Ok<BillSuggestionDto[]>>(result).Value!;
    }

    [Fact]
    public async Task Suggestions_group_by_shop_case_insensitive_and_use_most_frequent_spelling()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var now = DateTime.UtcNow;
            AddBill(f, "Billa", now.AddDays(-1));
            AddBill(f, "Billa", now.AddDays(-2));
            AddBill(f, "billa ", now.AddDays(-3));

            var suggestions = await Suggestions(f);

            var suggestion = Assert.Single(suggestions);
            Assert.Equal("Billa", suggestion.ShopName);
            Assert.Equal(3, suggestion.Count);
            Assert.Equal(f.K1, suggestion.CategoryId);
        }
    }

    [Fact]
    public async Task Suggestions_only_last_90_days()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var now = DateTime.UtcNow;
            AddBill(f, "Old", now.AddDays(-91));
            AddBill(f, "Old", now.AddDays(-1));
            AddBill(f, "Recent", now.AddDays(-89));
            AddBill(f, "Recent", now.AddDays(-1));

            var suggestions = await Suggestions(f);

            var suggestion = Assert.Single(suggestions);
            Assert.Equal("Recent", suggestion.ShopName);
            Assert.Equal(2, suggestion.Count);
        }
    }

    [Fact]
    public async Task Suggestions_require_at_least_two_bills()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var now = DateTime.UtcNow;
            AddBill(f, "Twice", now.AddDays(-1), category: f.K1);
            AddBill(f, "Twice", now.AddDays(-2), category: f.K1);
            AddBill(f, "Twice", now.AddDays(-3), category: f.K2);

            var suggestions = await Suggestions(f);

            var suggestion = Assert.Single(suggestions);
            Assert.Equal(f.K1, suggestion.CategoryId);
        }
    }

    [Fact]
    public async Task Suggestions_only_own_bills()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var now = DateTime.UtcNow;
            AddBill(f, "Mine", now.AddDays(-1));
            AddBill(f, "Mine", now.AddDays(-2), user: UserB);
            AddBill(f, "Theirs", now.AddDays(-1), user: UserB);
            AddBill(f, "Theirs", now.AddDays(-2), user: UserB);

            var suggestions = await Suggestions(f);

            Assert.Empty(suggestions);
        }
    }

    [Fact]
    public async Task Suggestions_exclude_hidden()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var now = DateTime.UtcNow;
            AddBill(f, "Billa", now.AddDays(-1));
            AddBill(f, "Billa", now.AddDays(-2));
            AddBill(f, "Spar", now.AddDays(-1));
            AddBill(f, "Spar", now.AddDays(-2));
            context.HiddenBillSuggestion.Add(new HiddenBillSuggestion(UserA, "BILLA", f.K1, null));
            context.SaveChanges();

            var suggestions = await Suggestions(f);

            Assert.Equal("Spar", Assert.Single(suggestions).ShopName);
        }
    }

    [Fact]
    public async Task Suggestions_ordered_by_count_then_last_used_max_20()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var now = DateTime.UtcNow;

            // 22 combinations with 2 bills each; "Top" has 3 bills.
            for (var i = 0; i < 22; i++)
            {
                AddBill(f, "Shop" + i.ToString("00"), now.AddDays(-30 - i));
                AddBill(f, "Shop" + i.ToString("00"), now.AddDays(-30 - i));
            }

            AddBill(f, "Top", now.AddDays(-80));
            AddBill(f, "Top", now.AddDays(-81));
            AddBill(f, "Top", now.AddDays(-82));

            var suggestions = await Suggestions(f);

            Assert.Equal(20, suggestions.Length);
            Assert.Equal("Top", suggestions[0].ShopName);
            // Same count: most recently used first.
            Assert.Equal("Shop00", suggestions[1].ShopName);
            Assert.Equal("Shop18", suggestions[19].ShopName);
        }
    }

    [Fact]
    public async Task Hide_suggestion_twice_creates_one_entry()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var handler = new HideBillSuggestionCommandHandler(f.Context, f.Identity);

            var first = await handler.Handle(new HideBillSuggestionCommand("Billa", f.K1, f.U1), CancellationToken.None);
            var second = await handler.Handle(new HideBillSuggestionCommand(" billa", f.K1, f.U1), CancellationToken.None);

            Assert.IsType<NoContent>(first);
            Assert.IsType<NoContent>(second);
            var hidden = Assert.Single(context.HiddenBillSuggestion);
            Assert.Equal("Billa", hidden.ShopName);
            Assert.Equal(UserA, hidden.UserId);
        }
    }

    [Fact]
    public async Task Hide_suggestion_with_foreign_category_is_rejected()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context);
            var validator = new HideBillSuggestionCommandValidator(f.Context, f.Identity);

            var foreign = await validator.ValidateAsync(new HideBillSuggestionCommand("Billa", f.ForeignCategory, null));
            var mismatch = await validator.ValidateAsync(new HideBillSuggestionCommand("Billa", f.K2, f.U1));
            var valid = await validator.ValidateAsync(new HideBillSuggestionCommand("Billa", f.K1, f.U1));

            Assert.False(foreign.IsValid);
            Assert.False(mismatch.IsValid);
            Assert.True(valid.IsValid);
        }
    }
}
