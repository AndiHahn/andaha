using Andaha.Services.BudgetPlan.Core;
using FluentValidation;

namespace Andaha.Services.BudgetPlan.Requests.Settings.UpdateBudgetPlanSettings.V1;

public class UpdateBudgetPlanSettingsCommandValidator : AbstractValidator<UpdateBudgetPlanSettingsCommand>
{
    public UpdateBudgetPlanSettingsCommandValidator()
    {
        RuleFor(command => command.LivingCostShare)
            .InclusiveBetween(BudgetPlanSettings.MinLivingCostShare, BudgetPlanSettings.MaxLivingCostShare);
    }
}
