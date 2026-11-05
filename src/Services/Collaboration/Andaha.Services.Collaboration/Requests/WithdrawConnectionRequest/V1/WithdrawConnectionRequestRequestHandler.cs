using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Collaboration.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Collaboration.Requests.WithdrawConnectionRequest.V1;

public class WithdrawConnectionRequestRequestHandler : IRequestHandler<WithdrawConnectionRequestRequest, IResult>
{
    private readonly IIdentityService identityService;
    private readonly CollaborationDbContext dbContext;

    public WithdrawConnectionRequestRequestHandler(
        IIdentityService identityService,
        CollaborationDbContext dbContext)
    {
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<IResult> Handle(WithdrawConnectionRequestRequest request, CancellationToken cancellationToken)
    {
        Guid currentUserId = identityService.GetUserId();
        Guid targetUserId = request.TargetUserId;

        var connectionRequest = await dbContext.ConnectionRequest
            .FirstOrDefaultAsync(
                connectionRequest => connectionRequest.FromUserId == currentUserId &&
                                     connectionRequest.TargetUserId == targetUserId &&
                                     connectionRequest.AcceptedAt == null &&
                                     connectionRequest.DeclinedAt == null,
                cancellationToken);
        if (connectionRequest is null)
        {
            return Results.NotFound("There is no open connection request to this user.");
        }

        dbContext.ConnectionRequest.Remove(connectionRequest);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
