using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Collaboration.Core;
using Andaha.Services.Collaboration.Requests.DeleteUserData.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Andaha.Services.Collaboration.Tests;

public class DeleteUserDataTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();
    private static readonly Guid UserC = Guid.NewGuid();
    private static readonly Guid UserD = Guid.NewGuid();

    private static async Task<IResult> DeleteAsync(SqliteConnection connection, Guid userId)
    {
        using var context = TestDb.NewContext(connection);
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(userId);
        var handler = new DeleteUserDataRequestHandler(identity, context);
        return await handler.Handle(new DeleteUserDataRequest(), CancellationToken.None);
    }

    [Fact]
    public async Task DeleteUserData_removes_everything_involving_user_and_keeps_others()
    {
        var (seed, connection) = TestDb.CreateCollaboration();
        using var _ = connection;
        using (seed)
        {
            var accepted = new ConnectionRequest(UserA, "a@example.com", UserB, "b@example.com");
            accepted.Accept();
            seed.ConnectionRequest.AddRange(
                accepted,
                new ConnectionRequest(UserC, "c@example.com", UserA, "a@example.com"),
                new ConnectionRequest(UserA, "a@example.com", UserD, "d@example.com"),
                new ConnectionRequest(UserB, "b@example.com", UserC, "c@example.com"));
            seed.Connection.AddRange(
                new Connection(UserA, UserB), new Connection(UserB, UserA),
                new Connection(UserB, UserC), new Connection(UserC, UserB));
            await seed.SaveChangesAsync();
        }

        var result = await DeleteAsync(connection, UserA);

        Assert.IsType<NoContent>(result);
        using var verify = TestDb.NewContext(connection);
        var connections = await verify.Connection.ToListAsync();
        Assert.Equal(2, connections.Count);
        Assert.All(connections, c => Assert.NotEqual(UserA, c.FromUserId));
        var request = Assert.Single(await verify.ConnectionRequest.ToListAsync());
        Assert.Equal(UserB, request.FromUserId);
        Assert.Equal(UserC, request.TargetUserId);
    }

    [Fact]
    public async Task DeleteUserData_twice_returns_no_content()
    {
        var (seed, connection) = TestDb.CreateCollaboration();
        using var _ = connection;
        using (seed)
        {
            seed.Connection.AddRange(new Connection(UserA, UserB), new Connection(UserB, UserA));
            await seed.SaveChangesAsync();
        }

        Assert.IsType<NoContent>(await DeleteAsync(connection, UserA));
        Assert.IsType<NoContent>(await DeleteAsync(connection, UserA));
    }
}
