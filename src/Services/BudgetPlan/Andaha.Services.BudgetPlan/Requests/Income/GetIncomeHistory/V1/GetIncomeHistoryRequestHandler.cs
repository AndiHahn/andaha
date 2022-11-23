using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.BudgetPlan.Requests.Income.Dtos.V1;
using Andaha.Services.Shopping.Infrastructure.Proxies;
using LinqKit;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.Income.GetIncomeHistory.V1;

internal class GetIncomeHistoryRequestHandler : IRequestHandler<GetIncomeHistoryRequest, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;
    private readonly ICollaborationApiProxy collaborationApiProxy;

    public GetIncomeHistoryRequestHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService,
        ICollaborationApiProxy collaborationApiProxy)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
        this.collaborationApiProxy = collaborationApiProxy ?? throw new ArgumentNullException(nameof(collaborationApiProxy));
    }

    public async Task<IResult> Handle(GetIncomeHistoryRequest request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();
        var connectedUsers = await this.collaborationApiProxy.GetConnectedUsers(cancellationToken);

        var incomes = await dbContext.Income
            .TemporalAll()
            .Where(income => income.Id == request.Id &&
                             (income.UserId == userId || connectedUsers.Contains(income.UserId)))
            .AsExpandable()
            .Select(income => IncomeHistoryDto.MapFromEntity.Invoke(income))
            .ToListAsync(cancellationToken);

        if (!incomes.Any())
        {
            return Results.NotFound();
        }

        return Results.Ok(incomes);
    }
}
