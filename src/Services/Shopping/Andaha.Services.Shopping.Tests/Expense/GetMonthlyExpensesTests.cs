using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using Andaha.Services.Shopping.Requests.Expense.Dtos.V1;
using Andaha.Services.Shopping.Requests.Expense.GetMonthlyExpenses.V1;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.Expense;

public class GetMonthlyExpensesTests
{
    private static readonly Guid UserA = Guid.NewGuid();

    private static async Task<MonthlyCostsDto[]> Run(
        Infrastructure.ShoppingDbContext context, string until, int months)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(UserA);
        var collaboration = Substitute.For<ICollaborationApiProxy>();
        collaboration.GetConnectedUsers(Arg.Any<CancellationToken>()).Returns(Array.Empty<Guid>());
        var handler = new GetMonthlyExpensesQueryHandler(context, identity, collaboration);
        var result = await handler.Handle(new GetMonthlyExpensesQuery(until, months), CancellationToken.None);
        return Assert.IsType<Ok<MonthlyCostsDto[]>>(result).Value!;
    }

    [Fact]
    public async Task Monthly_returns_exact_months_with_zero_gaps()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var food = new BillCategory(UserA, "Food", "#111111", 0, Array.Empty<(string, int)>());
            context.BillCategory.Add(food);
            context.Bill.AddRange(
                new Core.Bill(null, UserA, food.Id, null, "A", 12.5, new DateTime(2026, 2, 28, 23, 0, 0, DateTimeKind.Utc)),
                new Core.Bill(null, UserA, food.Id, null, "Out", 99.0, new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc)),
                new Core.Bill(null, UserA, food.Id, null, "Out", 99.0, new DateTime(2025, 12, 31, 23, 0, 0, DateTimeKind.Utc)));
            context.SaveChanges();

            var result = await Run(context, "2026-03", 3);

            Assert.Equal(
                new[] { new MonthlyCostsDto("2026-01", 0), new MonthlyCostsDto("2026-02", 12.5), new MonthlyCostsDto("2026-03", 0) },
                result);
        }
    }

    [Fact]
    public async Task Monthly_excludes_categories_not_in_statistics()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var food = new BillCategory(UserA, "Food", "#111111", 0, Array.Empty<(string, int)>());
            var hidden = new BillCategory(UserA, "Hidden", "#222222", 1, Array.Empty<(string, int)>(), includeToStatistics: false);
            context.BillCategory.AddRange(food, hidden);
            context.Bill.AddRange(
                new Core.Bill(null, UserA, food.Id, null, "A", 10.0, new DateTime(2026, 3, 5, 12, 0, 0, DateTimeKind.Utc)),
                new Core.Bill(null, UserA, hidden.Id, null, "B", 50.0, new DateTime(2026, 3, 6, 12, 0, 0, DateTimeKind.Utc)));
            context.SaveChanges();

            var result = await Run(context, "2026-03", 1);

            Assert.Equal(new[] { new MonthlyCostsDto("2026-03", 10.0) }, result);
        }
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(1, true)]
    [InlineData(24, true)]
    [InlineData(25, false)]
    public void Monthly_validator_checks_months_range(int months, bool valid)
    {
        var validator = new GetMonthlyExpensesQueryValidator();
        Assert.Equal(valid, validator.Validate(new GetMonthlyExpensesQuery("2026-03", months)).IsValid);
    }

    [Theory]
    [InlineData("2026-03", true)]
    [InlineData("2026-3", false)]
    [InlineData("03-2026", false)]
    [InlineData("2026-13", false)]
    [InlineData("", false)]
    public void Monthly_validator_checks_until_format(string until, bool valid)
    {
        var validator = new GetMonthlyExpensesQueryValidator();
        Assert.Equal(valid, validator.Validate(new GetMonthlyExpensesQuery(until, 12)).IsValid);
    }
}
