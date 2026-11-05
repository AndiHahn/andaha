using Andaha.Services.Shopping.Infrastructure;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Shopping.Tests;

internal static class TestDb
{
    /// <summary>
    /// Creates a ShoppingDbContext on an open SQLite in-memory connection. The caller disposes the connection.
    /// </summary>
    public static (ShoppingDbContext Context, SqliteConnection Connection) CreateShopping()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<ShoppingDbContext>()
            .UseSqlite(connection)
            .Options;

        var context = new ShoppingDbContext(options);
        context.Database.EnsureCreated();

        return (context, connection);
    }

    /// <summary>
    /// Creates a fresh ShoppingDbContext on an existing connection, e.g. for a service container in a pipeline test.
    /// </summary>
    public static ShoppingDbContext Open(SqliteConnection connection)
    {
        var options = new DbContextOptionsBuilder<ShoppingDbContext>()
            .UseSqlite(connection)
            .Options;

        return new ShoppingDbContext(options);
    }
}
