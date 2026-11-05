using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Collaboration.Core;
using Andaha.Services.Collaboration.Requests.RemoveConnection.V1;
using Andaha.Services.Collaboration.Requests.WithdrawConnectionRequest.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Andaha.Services.Collaboration.Tests;

public class ConnectionTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();
    private static readonly Guid UserC = Guid.NewGuid();

    private static IIdentityService IdentityOf(Guid userId)
    {
        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(userId);
        return identity;
    }

    private static ConnectionRequest AcceptedRequest(Guid from, Guid to)
    {
        var request = new ConnectionRequest(from, "from@example.com", to, "to@example.com");
        request.Accept();
        return request;
    }

    private static ConnectionRequest PendingRequest(Guid from, Guid to)
        => new(from, "from@example.com", to, "to@example.com");

    [Fact]
    public async Task Remove_connection_deletes_both_directions_and_allows_new_request()
    {
        var (seed, connection) = TestDb.CreateCollaboration();
        using var _ = connection;
        using (seed)
        {
            seed.ConnectionRequest.Add(AcceptedRequest(UserA, UserB));
            seed.ConnectionRequest.Add(AcceptedRequest(UserC, UserA));
            seed.Connection.AddRange(
                new Connection(UserA, UserB), new Connection(UserB, UserA),
                new Connection(UserA, UserC), new Connection(UserC, UserA));
            await seed.SaveChangesAsync();
        }

        IResult result;
        using (var context = TestDb.NewContext(connection))
        {
            var handler = new RemoveConnectionRequestHandler(IdentityOf(UserA), context);
            result = await handler.Handle(new RemoveConnectionRequest(UserB), CancellationToken.None);
        }

        Assert.IsType<NoContent>(result);

        using var verify = TestDb.NewContext(connection);
        var remaining = await verify.Connection.ToListAsync();
        Assert.Equal(2, remaining.Count);
        Assert.All(remaining, c => Assert.DoesNotContain(UserB, new[] { c.FromUserId, c.TargetUserId }));
        // The accepted request with UserB is gone (a new request is possible); the one with UserC stays.
        var kept = Assert.Single(await verify.ConnectionRequest.ToListAsync());
        Assert.Equal(UserC, kept.FromUserId);
    }

    [Fact]
    public async Task Remove_unknown_connection_returns_not_found()
    {
        var (seed, connection) = TestDb.CreateCollaboration();
        using var _ = connection;
        using (seed)
        {
            seed.Connection.AddRange(new Connection(UserB, UserC), new Connection(UserC, UserB));
            await seed.SaveChangesAsync();
        }

        using var context = TestDb.NewContext(connection);
        var handler = new RemoveConnectionRequestHandler(IdentityOf(UserA), context);

        var result = await handler.Handle(new RemoveConnectionRequest(UserB), CancellationToken.None);

        Assert.IsType<NotFound<string>>(result);
        Assert.Equal(2, await context.Connection.CountAsync());
    }

    [Fact]
    public async Task Withdraw_removes_own_pending_request_only()
    {
        var (seed, connection) = TestDb.CreateCollaboration();
        using var _ = connection;
        Guid pendingId, acceptedId, declinedId, foreignId;
        var userD = Guid.NewGuid();
        var userE = Guid.NewGuid();
        using (seed)
        {
            var pending = PendingRequest(UserA, UserB);
            var accepted = AcceptedRequest(UserA, UserC);
            var declined = PendingRequest(UserA, userD);
            declined.Decline();
            var foreign = PendingRequest(UserB, userE);
            var incoming = PendingRequest(userE, UserA);
            seed.ConnectionRequest.AddRange(pending, accepted, declined, foreign, incoming);
            await seed.SaveChangesAsync();
            (pendingId, acceptedId, declinedId, foreignId) = (pending.Id, accepted.Id, declined.Id, foreign.Id);
        }

        async Task<IResult> WithdrawAsync(Guid target)
        {
            using var context = TestDb.NewContext(connection);
            var handler = new WithdrawConnectionRequestRequestHandler(IdentityOf(UserA), context);
            return await handler.Handle(new WithdrawConnectionRequestRequest(target), CancellationToken.None);
        }

        Assert.IsType<NotFound<string>>(await WithdrawAsync(UserC));
        Assert.IsType<NotFound<string>>(await WithdrawAsync(userD));
        Assert.IsType<NotFound<string>>(await WithdrawAsync(userE));
        Assert.IsType<NotFound<string>>(await WithdrawAsync(Guid.NewGuid()));
        Assert.IsType<NoContent>(await WithdrawAsync(UserB));

        using var verify = TestDb.NewContext(connection);
        var ids = await verify.ConnectionRequest.Select(r => r.Id).ToListAsync();
        Assert.DoesNotContain(pendingId, ids);
        Assert.Contains(acceptedId, ids);
        Assert.Contains(declinedId, ids);
        Assert.Contains(foreignId, ids);
        Assert.Equal(4, ids.Count);
    }
}
