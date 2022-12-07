using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Collaboration.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Collaboration.Requests.GetConnectedUserIds.V1;

public class GetConnectedUserIdsRequestHandler : IRequestHandler<GetConnectedUserIdsRequest, IResult>
{
    private readonly IIdentityService identityService;
    private readonly CollaborationDbContext dbContext;

    public GetConnectedUserIdsRequestHandler(
        IIdentityService identityService,
        CollaborationDbContext dbContext)
    {
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<IResult> Handle(GetConnectedUserIdsRequest request, CancellationToken cancellationToken)
    {
        Guid currentUserId = identityService.GetUserId();

        var connections = await dbContext.Connection
            .Where(connection => connection.FromUserId == currentUserId)
            .Select(connection => connection.TargetUserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        return Results.Ok(connections);
    }
}
