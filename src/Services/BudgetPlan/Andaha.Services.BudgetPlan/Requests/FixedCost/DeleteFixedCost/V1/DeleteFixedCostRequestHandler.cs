using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.DeleteFixedCost.V1;

internal class DeleteFixedCostRequestHandler : IRequestHandler<DeleteFixedCostRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public DeleteFixedCostRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(DeleteFixedCostRequest request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsersAsync(cancellationToken);

        var deleted = await this.dbContext.FixedCost
            .Where(fixedCost => fixedCost.Id == request.Id &&
                                (fixedCost.UserId == userId ||
                                 connectedUsers.Contains(userId)))
            .ExecuteDeleteAsync(cancellationToken);

        if (deleted <= 0)
        {
            return Results.NotFound();
        }

        return Results.NoContent();
    }
}
