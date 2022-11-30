using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Common;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.BudgetPlan.Requests.BudgetPlan.Dtos.V1;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.BudgetPlan.GetBudgetPlan.V1;

internal class GetBudgetPlanRequestHandler : IRequestHandler<GetBudgetPlanRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public GetBudgetPlanRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(GetBudgetPlanRequest request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var income = (await this.dbContext.Income
                .AsNoTracking()
                .Where(income => income.UserId == userId ||
                                 connectedUsers.Contains(income.UserId))
                .ToListAsync(cancellationToken))
            .Sum(income => income.GetMonthlyValue())
            .RoundTo(2);

        var expenses = (await this.dbContext.FixedCost
                .AsNoTracking()
                .Where(fixedCost => fixedCost.UserId == userId ||
                                    connectedUsers.Contains(fixedCost.UserId))
                .GroupBy(fixedCost => fixedCost.Category)
                .ToListAsync(cancellationToken))
            .Select(fixedCost => new BudgetPlanFixedCostDto(
                fixedCost.Key,
                fixedCost.Sum(cost => cost.GetMonthlyValue()).RoundTo(2)))
            .ToArray();

        var budgetPlanDto = new BudgetPlanDto(income, expenses);

        return Results.Ok(budgetPlanDto);
    }
}
