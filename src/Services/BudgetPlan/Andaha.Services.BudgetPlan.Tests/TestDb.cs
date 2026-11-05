using Andaha.Services.BudgetPlan.Infrastructure;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Tests;

internal static class TestDb
{
    /// <summary>
    /// Creates a BudgetPlanDbContext on an open SQLite in-memory connection. The caller disposes the connection.
    /// </summary>
    public static (BudgetPlanDbContext Context, SqliteConnection Connection) CreateBudgetPlan()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var context = NewContext(connection);
        context.Database.EnsureCreated();

        return (context, connection);
    }

    /// <summary>
    /// A further context on the same connection, as a request scope would get it.
    /// </summary>
    public static BudgetPlanDbContext NewContext(SqliteConnection connection)
        => new SqliteBudgetPlanDbContext(
            new DbContextOptionsBuilder<BudgetPlanDbContext>().UseSqlite(connection).Options);

    /// <summary>
    /// The production model maps FixedCost and Income as SQL Server temporal tables. SQLite ignores the
    /// temporal part but keeps the period columns as NOT NULL columns that SQL Server would fill. They get
    /// a default value here, in the test context only, so inserts work under SQLite.
    /// </summary>
    private sealed class SqliteBudgetPlanDbContext(DbContextOptions<BudgetPlanDbContext> options)
        : BudgetPlanDbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            foreach (var entityType in modelBuilder.Model.GetEntityTypes().Where(entityType => entityType.IsTemporal()).ToList())
            {
                var entity = modelBuilder.Entity(entityType.ClrType);
                entity.Property<DateTime>(entityType.GetPeriodStartPropertyName()!).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property<DateTime>(entityType.GetPeriodEndPropertyName()!).HasDefaultValue(DateTime.MaxValue);
            }
        }
    }
}
