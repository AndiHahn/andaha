using Andaha.Services.Work.Infrastructure;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Work.Tests;

internal static class TestDb
{
    /// <summary>
    /// Creates a WorkDbContext on an open SQLite in-memory connection. The caller disposes the connection.
    /// </summary>
    public static (WorkDbContext Context, SqliteConnection Connection) CreateWork()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var context = Open(connection);
        context.Database.EnsureCreated();

        return (context, connection);
    }

    /// <summary>
    /// Creates a fresh WorkDbContext on an existing connection, e.g. to act on data seeded through another context.
    /// </summary>
    public static WorkDbContext Open(SqliteConnection connection)
    {
        var options = new DbContextOptionsBuilder<WorkDbContext>()
            .UseSqlite(connection)
            .Options;

        return new WorkDbContext(options);
    }
}
