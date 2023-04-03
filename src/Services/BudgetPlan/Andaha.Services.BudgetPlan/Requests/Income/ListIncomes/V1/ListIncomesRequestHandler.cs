using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.BudgetPlan.Requests.Income.Dtos.V1;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using LinqKit;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.Income.ListIncomes.V1;

internal class ListIncomesRequestHandler : IRequestHandler<ListIncomesRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public ListIncomesRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(ListIncomesRequest request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsersAsync(cancellationToken);

        var incomes = await dbContext.Income
            .AsNoTracking()
            .AsExpandable()
            .Where(income => income.UserId == userId ||
                             connectedUsers.Contains(income.UserId))
            .Select(income => IncomeDto.MapFromEntity.Invoke(income))
            .ToListAsync(cancellationToken);

        return Results.Ok(incomes);
    }
}
