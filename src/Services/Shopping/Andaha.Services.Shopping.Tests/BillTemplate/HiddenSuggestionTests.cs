using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Requests.BillTemplate.Dtos.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.ListHiddenSuggestions.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.UnhideBillSuggestion.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.BillTemplate;

public class HiddenSuggestionTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    private static IIdentityService IdentityOf(Guid userId)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(userId);
        return identity;
    }

    [Fact]
    public async Task Hidden_list_returns_only_own_with_names()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var food = new Core.BillCategory(UserA, "Lebensmittel", "red", 0, new[] { ("Obst", 0) });
            var leisure = new Core.BillCategory(UserA, "Freizeit", "blue", 1, Array.Empty<(string, int)>());
            var foreign = new Core.BillCategory(UserB, "Fremd", "green", 0, Array.Empty<(string, int)>());
            context.BillCategory.AddRange(food, leisure, foreign);
            context.SaveChanges();

            var withSub = new HiddenBillSuggestion(UserA, "Spar", food.Id, food.SubCategories.Single().Id);
            var withoutSub = new HiddenBillSuggestion(UserA, "Kino", leisure.Id, null);
            var foreignHidden = new HiddenBillSuggestion(UserB, "Hofer", foreign.Id, null);
            context.HiddenBillSuggestion.AddRange(withSub, withoutSub, foreignHidden);
            context.SaveChanges();

            var handler = new ListHiddenSuggestionsQueryHandler(context, IdentityOf(UserA));

            var result = await handler.Handle(new ListHiddenSuggestionsQuery(), CancellationToken.None);

            var items = Assert.IsType<Ok<HiddenBillSuggestionDto[]>>(result).Value!;
            Assert.Equal(
                new[]
                {
                    new HiddenBillSuggestionDto(withoutSub.Id, "Kino", leisure.Id, "Freizeit", null, null),
                    new HiddenBillSuggestionDto(withSub.Id, "Spar", food.Id, "Lebensmittel", food.SubCategories.Single().Id, "Obst"),
                },
                items);
        }
    }

    [Fact]
    public async Task Unhide_removes_own_and_404_for_foreign()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var own = new Core.BillCategory(UserA, "Lebensmittel", "red", 0, Array.Empty<(string, int)>());
            var foreign = new Core.BillCategory(UserB, "Fremd", "green", 0, Array.Empty<(string, int)>());
            context.BillCategory.AddRange(own, foreign);
            context.SaveChanges();

            var ownHidden = new HiddenBillSuggestion(UserA, "Spar", own.Id, null);
            var foreignHidden = new HiddenBillSuggestion(UserB, "Hofer", foreign.Id, null);
            context.HiddenBillSuggestion.AddRange(ownHidden, foreignHidden);
            context.SaveChanges();

            var handler = new UnhideBillSuggestionCommandHandler(context, IdentityOf(UserA));

            var ownResult = await handler.Handle(new UnhideBillSuggestionCommand(ownHidden.Id), CancellationToken.None);
            var foreignResult = await handler.Handle(new UnhideBillSuggestionCommand(foreignHidden.Id), CancellationToken.None);
            var unknownResult = await handler.Handle(new UnhideBillSuggestionCommand(Guid.NewGuid()), CancellationToken.None);

            Assert.IsType<NoContent>(ownResult);
            Assert.Equal(StatusCodes.Status404NotFound, Assert.IsAssignableFrom<IStatusCodeHttpResult>(foreignResult).StatusCode);
            Assert.Equal(StatusCodes.Status404NotFound, Assert.IsAssignableFrom<IStatusCodeHttpResult>(unknownResult).StatusCode);

            var remaining = context.HiddenBillSuggestion.AsNoTracking().Select(h => h.Id).ToList();
            Assert.Equal(new[] { foreignHidden.Id }, remaining);
        }
    }
}
