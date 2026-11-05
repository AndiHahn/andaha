using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Core;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.BudgetPlan.Requests.UserData.DeleteUserData.V1;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Andaha.Services.BudgetPlan.Tests.UserData;

/// <summary>
/// Skips the test when SQL Server LocalDB is not available (e.g. on a build agent without it).
/// </summary>
public sealed class LocalDbFactAttribute : FactAttribute
{
    public const string Server = @"(localdb)\MSSQLLocalDB";

    private static readonly Lazy<bool> Available = new(IsLocalDbReachable);

    public LocalDbFactAttribute()
    {
        if (!Available.Value)
        {
            Skip = $"SQL Server LocalDB ({Server}) is not available.";
        }
    }

    private static bool IsLocalDbReachable()
    {
        try
        {
            // The first connection may have to start the LocalDB instance, which takes a few seconds.
            using var connection = new SqlConnection($"Server={Server};Database=master;Integrated Security=true;Connect Timeout=30");
            connection.Open();
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }
}

/// <summary>
/// Runs against a throwaway LocalDB database, because the history of temporal tables only exists on SQL Server.
/// </summary>
public class DeleteUserDataHistorySqlServerTests : IAsyncLifetime
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    private readonly string connectionString =
        $"Server={LocalDbFactAttribute.Server};Database=andaha-budgetplan-tests-{Guid.NewGuid():N};Integrated Security=true;Connect Timeout=30";

    private BudgetPlanDbContext NewContext()
        => new(new DbContextOptionsBuilder<BudgetPlanDbContext>().UseSqlServer(this.connectionString).Options);

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await using var context = this.NewContext();
        await context.Database.EnsureDeletedAsync();
    }

    private async Task SeedWithHistoryAsync(Guid userId)
    {
        await using var context = this.NewContext();

        var fixedCost = new FixedCost(userId, "Miete", 800, Duration.Monthly, CostCategory.FlatAndOperating);
        var income = new Income(userId, "Gehalt", 3000, Duration.Monthly);
        context.FixedCost.Add(fixedCost);
        context.Income.Add(income);
        context.BudgetPlanSettings.Add(new BudgetPlanSettings(userId, 40));
        await context.SaveChangesAsync();

        // Every update moves the previous version into the history table.
        fixedCost.Update(null, 850, null, null);
        income.Update(null, 3100, null);
        await context.SaveChangesAsync();
    }

    private async Task<int> CountAllVersionsAsync(Guid userId)
    {
        await using var context = this.NewContext();

        int fixedCosts = await context.FixedCost.TemporalAll().CountAsync(fixedCost => fixedCost.UserId == userId);
        int incomes = await context.Income.TemporalAll().CountAsync(income => income.UserId == userId);

        return fixedCosts + incomes;
    }

    private async Task<string?> HistoryTableOfAsync(string tableName)
    {
        await using var context = this.NewContext();

        return await context.Database
            .SqlQuery<string>($"""
                SELECT history.name AS [Value]
                FROM sys.tables AS current_table
                JOIN sys.tables AS history ON history.object_id = current_table.history_table_id
                WHERE current_table.name = {tableName} AND current_table.temporal_type = 2
                """)
            .SingleOrDefaultAsync();
    }

    [LocalDbFact]
    public async Task DeleteUserData_purges_history()
    {
        await using (var context = this.NewContext())
        {
            await context.Database.MigrateAsync();
        }

        await this.SeedWithHistoryAsync(UserA);
        await this.SeedWithHistoryAsync(UserB);
        Assert.Equal(4, await this.CountAllVersionsAsync(UserA));

        await using (var context = this.NewContext())
        {
            var identity = Substitute.For<IIdentityService>();
            identity.GetUserId().Returns(UserA);

            var result = await new DeleteUserDataCommandHandler(context, identity)
                .Handle(new DeleteUserDataCommand(), CancellationToken.None);

            Assert.IsType<NoContent>(result);
        }

        Assert.Equal(0, await this.CountAllVersionsAsync(UserA));
        Assert.Equal(4, await this.CountAllVersionsAsync(UserB));

        await using (var context = this.NewContext())
        {
            Assert.False(await context.BudgetPlanSettings.AnyAsync(settings => settings.UserId == UserA));
            Assert.True(await context.BudgetPlanSettings.AnyAsync(settings => settings.UserId == UserB));
        }

        // System versioning is on again, with the same history tables.
        Assert.Equal("FixedCostHistory", await this.HistoryTableOfAsync("FixedCost"));
        Assert.Equal("IncomeHistory", await this.HistoryTableOfAsync("Income"));
    }
}
