using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.Income.DeleteIncome.V1;

internal class DeleteIncomeRequestHandler : IRequestHandler<DeleteIncomeRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public DeleteIncomeRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(DeleteIncomeRequest request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsersAsync(cancellationToken);

        var deleted = await this.dbContext.Income
            .Where(income => income.Id == request.Id &&
                             (income.UserId == userId ||
                              connectedUsers.Contains(income.UserId)))
            .ExecuteDeleteAsync(cancellationToken);

        if (deleted <= 0)
        {
            return Results.NotFound();
        }

        return Results.NoContent();
    }
}
