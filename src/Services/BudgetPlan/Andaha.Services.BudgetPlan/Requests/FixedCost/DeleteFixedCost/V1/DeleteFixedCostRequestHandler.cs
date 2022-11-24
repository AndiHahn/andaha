using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.FixedCost.DeleteFixedCost.V1;

public class DeleteFixedCostRequestHandler : IRequestHandler<DeleteFixedCostRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;

    public DeleteFixedCostRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(DeleteFixedCostRequest request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        var deleted = await this.dbContext.FixedCost
            .Where(fixedCost => fixedCost.Id == request.Id &&
                                fixedCost.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        if (deleted <= 0)
        {
            return Results.NotFound();
        }

        return Results.NoContent();
    }
}
