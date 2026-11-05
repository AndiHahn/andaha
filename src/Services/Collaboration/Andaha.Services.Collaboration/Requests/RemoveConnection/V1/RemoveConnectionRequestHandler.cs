using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Collaboration.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Collaboration.Requests.RemoveConnection.V1;

public class RemoveConnectionRequestHandler : IRequestHandler<RemoveConnectionRequest, IResult>
{
    private readonly IIdentityService identityService;
    private readonly CollaborationDbContext dbContext;

    public RemoveConnectionRequestHandler(
        IIdentityService identityService,
        CollaborationDbContext dbContext)
    {
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<IResult> Handle(RemoveConnectionRequest request, CancellationToken cancellationToken)
    {
        Guid currentUserId = identityService.GetUserId();
        Guid otherUserId = request.UserId;

        // A connection is stored as two rows, one per direction.
        var connections = await dbContext.Connection
            .Where(connection =>
                connection.FromUserId == currentUserId && connection.TargetUserId == otherUserId ||
                connection.FromUserId == otherUserId && connection.TargetUserId == currentUserId)
            .ToListAsync(cancellationToken);
        if (connections.Count == 0)
        {
            return Results.NotFound("There is no connection to this user.");
        }

        // Accepted requests are removed too, otherwise a new request would be rejected as a duplicate.
        var acceptedRequests = await dbContext.ConnectionRequest
            .Where(connectionRequest =>
                connectionRequest.AcceptedAt != null &&
                (connectionRequest.FromUserId == currentUserId && connectionRequest.TargetUserId == otherUserId ||
                 connectionRequest.FromUserId == otherUserId && connectionRequest.TargetUserId == currentUserId))
            .ToListAsync(cancellationToken);

        dbContext.Connection.RemoveRange(connections);
        dbContext.ConnectionRequest.RemoveRange(acceptedRequests);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
