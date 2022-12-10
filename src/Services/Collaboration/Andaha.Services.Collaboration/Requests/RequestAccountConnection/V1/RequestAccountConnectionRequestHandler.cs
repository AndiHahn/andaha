using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Collaboration.Core;
using Andaha.Services.Collaboration.Infrastructure;
using Andaha.Services.Collaboration.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Collaboration.Requests.RequestAccountConnection.V1;

public class RequestAccountConnectionRequestHandler : IRequestHandler<RequestAccountConnectionRequest, IResult>
{
    private readonly IIdentityService identityService;
    private readonly CollaborationDbContext dbContext;
    private readonly IIdentityApiProxy identityApiProxy;

    public RequestAccountConnectionRequestHandler(
        IIdentityService identityService,
        CollaborationDbContext dbContext,
        IIdentityApiProxy identityApiProxy)
    {
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityApiProxy = identityApiProxy ?? throw new ArgumentNullException(nameof(identityApiProxy));
    }

    public async Task<IResult> Handle(RequestAccountConnectionRequest request, CancellationToken cancellationToken)
    {
        Guid currentUserId = identityService.GetUserId();
        string currentUserEmail = identityService.GetUserEmailAddress();

        var userResult = await identityApiProxy.GetUserByEmailAsync(request.TargetUserEmailAddress, cancellationToken);
        if (userResult.Status != CrossCutting.Application.Result.ResultStatus.Success)
        {
            return Results.NotFound("User not found");
        }

        var existingRequest = await dbContext.ConnectionRequest
            .FirstOrDefaultAsync(
                request => request.FromUserId == currentUserId &&
                           request.TargetUserId == userResult.Value.Id ||
                           request.FromUserId == userResult.Value.Id &&
                           request.TargetUserId == currentUserId,
                cancellationToken);
        if (existingRequest is not null)
        {
            return Results.BadRequest("There is already a connection request to this user.");
        }

        var connectionRequest = new ConnectionRequest(currentUserId, currentUserEmail, userResult.Value.Id, userResult.Value.Email);

        dbContext.ConnectionRequest.Add(connectionRequest);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
