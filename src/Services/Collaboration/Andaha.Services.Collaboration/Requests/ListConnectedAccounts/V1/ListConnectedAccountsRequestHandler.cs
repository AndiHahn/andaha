﻿using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Collaboration.Dtos.V1;
using Andaha.Services.Collaboration.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.Collaboration.Requests.ListConnectedAccounts.V1;

public class ListConnectedAccountsRequestHandler : IRequestHandler<ListConnectedAccountsRequest, IResult>
{
    private readonly IIdentityService identityService;
    private readonly CollaborationDbContext dbContext;

    public ListConnectedAccountsRequestHandler(
        IIdentityService identityService,
        CollaborationDbContext dbContext)
    {
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<IResult> Handle(ListConnectedAccountsRequest request, CancellationToken cancellationToken)
    {
        Guid currentUserId = identityService.GetUserId();

        var connections = await dbContext.ConnectionRequest
            .Where(request => (request.FromUserId == currentUserId ||
                              request.TargetUserId == currentUserId) &&
                              request.AcceptedAt != null)
            .ToListAsync(cancellationToken);

        return Results.Ok(connections
            .Select(request => new ConnectionDto(request.FromUserId == currentUserId ? request.TargetUserEmail : request.FromUserEmail)));
    }
}
