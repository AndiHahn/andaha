using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.BudgetPlan.Requests.Income.Dtos.V1;
using LinqKit;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.Income.GetIncomeHistory.V1;

public class GetIncomeHistoryRequestHandler : IRequestHandler<GetIncomeHistoryRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;

    public GetIncomeHistoryRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(GetIncomeHistoryRequest request, CancellationToken cancellationToken)
    {
        var incomes = await dbContext.Income
            .TemporalAll()
            .Where(income => income.Id == request.Id)
            .AsExpandable()
            .Select(income => IncomeHistoryDto.MapFromEntity.Invoke(income))
            .ToListAsync(cancellationToken);

        return Results.Ok(incomes);
    }
}
