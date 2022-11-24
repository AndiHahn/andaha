using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Core;
using Andaha.Services.BudgetPlan.Infrastructure;
using MediatR;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.CreateFixedCost.V1;

internal class CreateFixedCostRequestHandler : IRequestHandler<CreateFixedCostRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;

    public CreateFixedCostRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(CreateFixedCostRequest request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        var fixedCost = new Core.FixedCost(userId, request.Name, request.Value, Duration.Monthly, request.Category);

        dbContext.FixedCost.Add(fixedCost);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
