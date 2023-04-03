using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.UpdateFixedCost.V1;

internal class UpdateFixedCostRequestHandler : IRequestHandler<UpdateFixedCostRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public UpdateFixedCostRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(UpdateFixedCostRequest request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        var fixedCost = await dbContext.FixedCost.FindByIdAsync(request.Id, cancellationToken);
        if (fixedCost is null)
        {
            return Results.NotFound($"FixedCost with id '{request.Id}' not found.");
        }

        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsersAsync(cancellationToken);
        if (fixedCost.UserId != userId && !connectedUsers.Contains(userId))
        {
            return Results.Forbid();
        }

        fixedCost.Update(request.FixedCost.Name, request.FixedCost.Value, request.FixedCost.Duration, request.FixedCost.Category);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}

