using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Core;
using Andaha.Services.BudgetPlan.Infrastructure;
using Andaha.Services.BudgetPlan.Requests.Settings.Dtos.V1;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Andaha.Services.BudgetPlan.Requests.Settings.GetBudgetPlanSettings.V1;

internal class GetBudgetPlanSettingsQueryHandler : IRequestHandler<GetBudgetPlanSettingsQuery, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;

    public GetBudgetPlanSettingsQueryHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(GetBudgetPlanSettingsQuery request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        int? livingCostShare = await this.dbContext.BudgetPlanSettings
            .AsNoTracking()
            .Where(settings => settings.UserId == userId)
            .Select(settings => (int?)settings.LivingCostShare)
            .SingleOrDefaultAsync(cancellationToken);

        return Results.Ok(new BudgetPlanSettingsDto(livingCostShare ?? BudgetPlanSettings.DefaultLivingCostShare));
    }
}
