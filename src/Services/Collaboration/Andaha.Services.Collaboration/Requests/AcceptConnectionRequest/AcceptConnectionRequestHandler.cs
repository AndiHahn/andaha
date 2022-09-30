using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Collaboration.Core;
using Andaha.Services.Collaboration.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Collaboration.Requests.AcceptConnectionRequest;

public class AcceptConnectionRequestHandler : IRequestHandler<AcceptConnectionRequestRequest, IResult>
{
    private readonly IIdentityService identityService;
    private readonly CollaborationDbContext dbContext;

    public AcceptConnectionRequestHandler(
        IIdentityService identityService,
        CollaborationDbContext dbContext)
    {
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<IResult> Handle(AcceptConnectionRequestRequest request, CancellationToken cancellationToken)
    {
        Guid currentUserId = identityService.GetUserId();
        Guid fromUserId = request.FromUserId;

        var connectionRequest = await this.dbContext.ConnectionRequest
            .FirstOrDefaultAsync(
                request => request.FromUserId == fromUserId &&
                           request.TargetUserId == currentUserId,
                cancellationToken);
        if (connectionRequest is null)
        {
            return Results.BadRequest("There is no connection request between these users.");
        }

        connectionRequest.Accept();

        var connection1 = new Connection(connectionRequest.FromUserId, connectionRequest.TargetUserId);
        var connection2 = new Connection(connectionRequest.TargetUserId, connectionRequest.FromUserId);

        this.dbContext.Connection.Add(connection1);
        this.dbContext.Connection.Add(connection2);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
