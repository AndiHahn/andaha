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

        var options = new DbContextOptionsBuilder<WorkDbContext>()
            .UseSqlite(connection)
            .Options;

        var context = new WorkDbContext(options);
        context.Database.EnsureCreated();

        return (context, connection);
    }
}
