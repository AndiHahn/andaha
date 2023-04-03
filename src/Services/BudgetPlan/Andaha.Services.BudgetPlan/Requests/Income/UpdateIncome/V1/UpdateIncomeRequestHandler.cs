using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.Income.UpdateIncome.V1;

internal class UpdateIncomeRequestHandler : IRequestHandler<UpdateIncomeRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public UpdateIncomeRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(UpdateIncomeRequest request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        var income = await dbContext.Income.FindByIdAsync(request.Id, cancellationToken);
        if (income is null)
        {
            return Results.NotFound($"Income with id '{request.Id}' not found.");
        }

        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsersAsync(cancellationToken);
        if (income.UserId != userId && !connectedUsers.Contains(userId))
        {
            return Results.Forbid();
        }

        income.Update(request.Income.Name, request.Income.Value, null);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}

