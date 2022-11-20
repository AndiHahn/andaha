using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.BudgetPlan.Requests.Income.Dtos.V1;
using LinqKit;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.Income.ListIncomes.V2;

internal class ListIncomesRequestHandler : IRequestHandler<ListIncomesRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;

    public ListIncomesRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(ListIncomesRequest request, CancellationToken cancellationToken)
    {
        var incomes = await dbContext.Income
            .AsNoTracking()
            .AsExpandable()
            .Select(income => IncomeDto.MapFromEntity.Invoke(income))
            .ToListAsync(cancellationToken);

        return Results.Ok(incomes);
    }
}
