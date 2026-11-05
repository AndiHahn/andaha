using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Core;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.BudgetPlan.Requests.UserData.DeleteUserData.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Andaha.Services.BudgetPlan.Tests.UserData;

public class DeleteUserDataTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    // The handler always runs on its own context (as in a request scope), not on the one used for seeding.
    private static async Task<IResult> DeleteAsync(SqliteConnection connection, Guid userId)
    {
        using var context = TestDb.NewContext(connection);

        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(userId);

        var handler = new DeleteUserDataCommandHandler(context, identity);

        return await handler.Handle(new DeleteUserDataCommand(), CancellationToken.None);
    }

    private static void Seed(BudgetPlanDbContext context, Guid userId, int livingCostShare)
    {
        context.FixedCost.AddRange(
            new FixedCost(userId, "Miete", 800, Duration.Monthly, CostCategory.FlatAndOperating),
            new FixedCost(userId, "Versicherung", 300, Duration.Year, CostCategory.Insurance));
        context.Income.Add(new Income(userId, "Gehalt", 3000, Duration.Monthly));
        context.BudgetPlanSettings.Add(new BudgetPlanSettings(userId, livingCostShare));
        context.SaveChanges();
    }

    private static void AssertNothingLeftFor(BudgetPlanDbContext context, Guid userId)
    {
        Assert.False(context.FixedCost.Any(fixedCost => fixedCost.UserId == userId));
        Assert.False(context.Income.Any(income => income.UserId == userId));
        Assert.False(context.BudgetPlanSettings.Any(settings => settings.UserId == userId));
    }

    [Fact]
    public async Task DeleteUserData_removes_own_fixed_costs_incomes_settings_and_keeps_others()
    {
        var (context, connection) = TestDb.CreateBudgetPlan();
        using (connection)
        using (context)
        {
            Seed(context, UserA, 40);
            Seed(context, UserB, 25);

            var result = await DeleteAsync(connection, UserA);

            Assert.IsType<NoContent>(result);
            AssertNothingLeftFor(context, UserA);

            Assert.Equal(2, context.FixedCost.AsNoTracking().Count(fixedCost => fixedCost.UserId == UserB));
            Assert.Single(context.Income.AsNoTracking(), income => income.UserId == UserB);
            var settingsB = Assert.Single(context.BudgetPlanSettings.AsNoTracking());
            Assert.Equal(UserB, settingsB.UserId);
            Assert.Equal(25, settingsB.LivingCostShare);
        }
    }

    [Fact]
    public async Task DeleteUserData_twice_returns_no_content()
    {
        var (context, connection) = TestDb.CreateBudgetPlan();
        using (connection)
        using (context)
        {
            Seed(context, UserA, 40);

            var first = await DeleteAsync(connection, UserA);
            var second = await DeleteAsync(connection, UserA);

            Assert.IsType<NoContent>(first);
            Assert.IsType<NoContent>(second);
            AssertNothingLeftFor(context, UserA);
        }
    }
}
