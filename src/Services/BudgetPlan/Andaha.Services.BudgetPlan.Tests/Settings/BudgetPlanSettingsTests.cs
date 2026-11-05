using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Requests.Settings.Dtos.V1;
using Andaha.Services.BudgetPlan.Requests.Settings.GetBudgetPlanSettings.V1;
using Andaha.Services.BudgetPlan.Requests.Settings.UpdateBudgetPlanSettings.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using NSubstitute;

namespace Andaha.Services.BudgetPlan.Tests.Settings;

public class BudgetPlanSettingsTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    private static IIdentityService Identity(Guid userId)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(userId);
        return identity;
    }

    // Each call runs on its own context, as in a request scope.
    private static async Task<int> GetAsync(SqliteConnection connection, Guid userId)
    {
        using var context = TestDb.NewContext(connection);
        var handler = new GetBudgetPlanSettingsQueryHandler(context, Identity(userId));

        var result = await handler.Handle(new GetBudgetPlanSettingsQuery(), CancellationToken.None);

        return Assert.IsType<Ok<BudgetPlanSettingsDto>>(result).Value.LivingCostShare;
    }

    private static async Task<IResult> PutAsync(SqliteConnection connection, Guid userId, int livingCostShare)
    {
        using var context = TestDb.NewContext(connection);
        var handler = new UpdateBudgetPlanSettingsCommandHandler(context, Identity(userId));

        return await handler.Handle(new UpdateBudgetPlanSettingsCommand(livingCostShare), CancellationToken.None);
    }

    [Fact]
    public async Task Get_returns_35_when_nothing_saved()
    {
        var (context, connection) = TestDb.CreateBudgetPlan();
        using (connection)
        using (context)
        {
            Assert.Equal(35, await GetAsync(connection, UserA));
            Assert.Empty(context.BudgetPlanSettings);
        }
    }

    [Fact]
    public async Task Put_then_get_returns_saved_value()
    {
        var (context, connection) = TestDb.CreateBudgetPlan();
        using (connection)
        using (context)
        {
            Assert.IsType<NoContent>(await PutAsync(connection, UserA, 40));
            Assert.Equal(40, await GetAsync(connection, UserA));

            // A second PUT changes the existing row instead of adding one.
            Assert.IsType<NoContent>(await PutAsync(connection, UserA, 0));
            Assert.Equal(0, await GetAsync(connection, UserA));
            Assert.Single(context.BudgetPlanSettings);
        }
    }

    [Fact]
    public async Task Put_is_per_user()
    {
        var (context, connection) = TestDb.CreateBudgetPlan();
        using (connection)
        using (context)
        {
            await PutAsync(connection, UserA, 20);
            await PutAsync(connection, UserB, 100);

            Assert.Equal(20, await GetAsync(connection, UserA));
            Assert.Equal(100, await GetAsync(connection, UserB));
            Assert.Equal(35, await GetAsync(connection, Guid.NewGuid()));
        }
    }

    [Theory]
    [InlineData(101)]
    [InlineData(-1)]
    public void Put_rejects_101_and_minus_1(int livingCostShare)
    {
        var validator = new UpdateBudgetPlanSettingsCommandValidator();

        var result = validator.Validate(new UpdateBudgetPlanSettingsCommand(livingCostShare));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(UpdateBudgetPlanSettingsCommand.LivingCostShare));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(100)]
    public void Put_accepts_the_bounds_0_and_100(int livingCostShare)
    {
        var validator = new UpdateBudgetPlanSettingsCommandValidator();

        Assert.True(validator.Validate(new UpdateBudgetPlanSettingsCommand(livingCostShare)).IsValid);
    }
}
