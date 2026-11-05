using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Collaboration.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Collaboration.Requests.DeleteUserData.V1;

public class DeleteUserDataRequestHandler : IRequestHandler<DeleteUserDataRequest, IResult>
{
    private readonly IIdentityService identityService;
    private readonly CollaborationDbContext dbContext;

    public DeleteUserDataRequestHandler(
        IIdentityService identityService,
        CollaborationDbContext dbContext)
    {
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<IResult> Handle(DeleteUserDataRequest request, CancellationToken cancellationToken)
    {
        Guid userId = identityService.GetUserId();

        var connections = await dbContext.Connection
            .Where(connection => connection.FromUserId == userId || connection.TargetUserId == userId)
            .ToListAsync(cancellationToken);
        var connectionRequests = await dbContext.ConnectionRequest
            .Where(connectionRequest => connectionRequest.FromUserId == userId || connectionRequest.TargetUserId == userId)
            .ToListAsync(cancellationToken);

        dbContext.Connection.RemoveRange(connections);
        dbContext.ConnectionRequest.RemoveRange(connectionRequests);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
