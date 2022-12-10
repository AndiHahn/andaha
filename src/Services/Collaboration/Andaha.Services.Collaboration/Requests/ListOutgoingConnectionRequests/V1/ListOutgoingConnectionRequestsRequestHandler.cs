using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Collaboration.Dtos.V1;
using Andaha.Services.Collaboration.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Collaboration.Requests.ListOutgoingConnectionRequests.V1;

public class ListOutgoingConnectionRequestsRequestHandler : IRequestHandler<ListOutgoingConnectionRequestsRequest, IResult>
{
    private readonly IIdentityService identityService;
    private readonly CollaborationDbContext dbContext;

    public ListOutgoingConnectionRequestsRequestHandler(
        IIdentityService identityService,
        CollaborationDbContext dbContext)
    {
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<IResult> Handle(ListOutgoingConnectionRequestsRequest request, CancellationToken cancellationToken)
    {
        Guid currentUserId = identityService.GetUserId();

        var connectionRequests = await dbContext.ConnectionRequest
            .Where(request => request.FromUserId == currentUserId &&
                              request.AcceptedAt == null)
            .ToListAsync(cancellationToken);

        return Results.Ok(connectionRequests
            .Select(request => new ConnectionRequestDto(
                request.FromUserId,
                request.FromUserEmail,
                request.TargetUserId,
                request.TargetUserEmail,
                request.DeclinedAt is not null)));
    }
}
