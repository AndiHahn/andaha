using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Collaboration.Core;
using Andaha.Services.Collaboration.Dtos;
using Andaha.Services.Collaboration.Infrastructure;
using Dapr.Client;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Collaboration.Requests.RequestAccountConnection;

public class RequestAccountConnectionRequestHandler : IRequestHandler<RequestAccountConnectionRequest, IResult>
{
    private readonly DaprClient daprClient;
    private readonly IIdentityService identityService;
    private readonly CollaborationDbContext dbContext;

    public RequestAccountConnectionRequestHandler(
        DaprClient daprClient,
        IIdentityService identityService,
        CollaborationDbContext dbContext)
    {
        this.daprClient = daprClient ?? throw new ArgumentNullException(nameof(daprClient));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<IResult> Handle(RequestAccountConnectionRequest request, CancellationToken cancellationToken)
    {
        Guid currentUserId = this.identityService.GetUserId();
        string currentUserEmail = this.identityService.GetUserEmailAddress();

        var response = await daprClient.InvokeMethodAsync<GetUserResponse>(
            HttpMethod.Get,
            "identity-api",
            $"/api/user/{request.TargetUserEmailAddress}",
            cancellationToken);
        
        var existingRequest = await this.dbContext.ConnectionRequest
            .FirstOrDefaultAsync(
                request => (request.FromUserId == currentUserId &&
                           request.TargetUserId == response.Id) ||
                           (request.FromUserId == response.Id &&
                           request.TargetUserId == currentUserId),
                cancellationToken);
        if (existingRequest is not null)
        {
            return Results.BadRequest("There is already a connection request to this user.");
        }

        var connectionRequest = new ConnectionRequest(currentUserId, currentUserEmail, response.Id, response.Email);

        dbContext.ConnectionRequest.Add(connectionRequest);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
