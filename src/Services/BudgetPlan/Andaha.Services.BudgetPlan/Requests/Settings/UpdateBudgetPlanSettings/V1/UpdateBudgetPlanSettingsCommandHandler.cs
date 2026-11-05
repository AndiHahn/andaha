using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.BudgetPlan.Core;
using Andaha.Services.BudgetPlan.Infrastructure;
using MediatR;

namespace Andaha.Services.BudgetPlan.Requests.Settings.UpdateBudgetPlanSettings.V1;

internal class UpdateBudgetPlanSettingsCommandHandler : IRequestHandler<UpdateBudgetPlanSettingsCommand, IResult>
{
    private readonly BudgetPlanDbContext dbContext;
    private readonly IIdentityService identityService;

    public UpdateBudgetPlanSettingsCommandHandler(
        BudgetPlanDbContext dbContext,
        IIdentityService identityService)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        this.identityService = identityService ?? throw new ArgumentNullException(nameof(identityService));
    }

    public async Task<IResult> Handle(UpdateBudgetPlanSettingsCommand request, CancellationToken cancellationToken)
    {
        Guid userId = this.identityService.GetUserId();

        var settings = await this.dbContext.BudgetPlanSettings.FindAsync([userId], cancellationToken);
        if (settings is null)
        {
            this.dbContext.BudgetPlanSettings.Add(new BudgetPlanSettings(userId, request.LivingCostShare));
        }
        else
        {
            settings.UpdateLivingCostShare(request.LivingCostShare);
        }

        await this.dbContext.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
