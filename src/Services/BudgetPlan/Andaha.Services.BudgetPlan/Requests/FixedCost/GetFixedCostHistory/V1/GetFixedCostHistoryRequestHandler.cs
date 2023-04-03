using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.BudgetPlan.Requests.FixedCost.Dtos.V1;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using LinqKit;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.GetFixedCostHistory.V1;

internal class GetFixedCostHistoryRequestHandler : IRequestHandler<GetFixedCostHistoryRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public GetFixedCostHistoryRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(GetFixedCostHistoryRequest request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsersAsync(cancellationToken);

        var fixedCosts = await dbContext.FixedCost
            .TemporalAll()
            .Where(fixedCost => fixedCost.Id == request.Id &&
                                (fixedCost.UserId == userId || connectedUsers.Contains(fixedCost.UserId)))
            .AsExpandable()
            .Select(fixedCost => FixedCostHistoryDto.MapFromEntity.Invoke(fixedCost))
            .ToListAsync(cancellationToken);

        if (!fixedCosts.Any())
        {
            return Results.NotFound();
        }

        return Results.Ok(fixedCosts);
    }
}
