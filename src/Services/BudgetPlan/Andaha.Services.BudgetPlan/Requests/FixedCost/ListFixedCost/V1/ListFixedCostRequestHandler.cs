using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.BudgetPlan.Requests.FixedCost.Dtos.V1;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using LinqKit;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.ListFixedCosts.V1;

internal class ListFixedCostsRequestHandler : IRequestHandler<ListFixedCostsRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public ListFixedCostsRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(ListFixedCostsRequest request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var fixedCosts = await dbContext.FixedCost
            .AsNoTracking()
            .AsExpandable()
            .Where(fixedCost => fixedCost.UserId == userId ||
                                connectedUsers.Contains(fixedCost.UserId))
            .Select(fixedCost => FixedCostDto.MapFromEntity.Invoke(fixedCost))
            .ToListAsync(cancellationToken);

        return Results.Ok(fixedCosts);
    }
}
