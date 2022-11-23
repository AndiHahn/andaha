using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.Income.DeleteIncome.V1;

public class DeleteIncomeRequestHandler : IRequestHandler<DeleteIncomeRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;

    public DeleteIncomeRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(DeleteIncomeRequest request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        var deleted = await this.dbContext.Income
            .Where(income => income.Id == request.Id &&
                             income.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        if (deleted <= 0)
        {
            return Results.NotFound();
        }

        return Results.NoContent();
    }
}
