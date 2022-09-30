using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Collaboration.Dtos;
using Andaha.Services.Collaboration.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Collaboration.Requests.ListIncomingConnectionRequests;

internal class ListIncomingConnectionRequestsHandler : IRequestHandler<ListIncomingConnectionRequestsRequest, IResult>
{
    private readonly IIdentityService identityService;
    private readonly CollaborationDbContext dbContext;

    public ListIncomingConnectionRequestsHandler(
        IIdentityService identityService,
        CollaborationDbContext dbContext)
    {
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<IResult> Handle(ListIncomingConnectionRequestsRequest request, CancellationToken cancellationToken)
    {
        Guid currentUserId = identityService.GetUserId();

        var connectionRequests = await dbContext.ConnectionRequest
            .Where(request => request.TargetUserId == currentUserId &&
                              request.AcceptedAt == null &&
                              request.DeclinedAt == null)
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
