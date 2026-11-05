using Andaha.Services.Collaboration.Infrastructure;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Collaboration.Tests;

internal static class TestDb
{
    /// <summary>
    /// Creates a CollaborationDbContext on an open SQLite in-memory connection. The caller disposes the connection.
    /// </summary>
    public static (CollaborationDbContext Context, SqliteConnection Connection) CreateCollaboration()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var context = NewContext(connection);
        context.Database.EnsureCreated();

        return (context, connection);
    }

    public static CollaborationDbContext NewContext(SqliteConnection connection)
        => new(new DbContextOptionsBuilder<CollaborationDbContext>().UseSqlite(connection).Options);
}
