using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Collaboration.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Collaboration.Requests.DeclineConnectionRequest;

public class DeclineConnectionRequestHandler : IRequestHandler<DeclineConnectionRequestRequest, IResult>
{
    private readonly IIdentityService identityService;
    private readonly CollaborationDbContext dbContext;

    public DeclineConnectionRequestHandler(
        IIdentityService identityService,
        CollaborationDbContext dbContext)
    {
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<IResult> Handle(DeclineConnectionRequestRequest request, CancellationToken cancellationToken)
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

        connectionRequest.Decline();

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
