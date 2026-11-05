using Andaha.CrossCutting.Application.Requests;

namespace Andaha.Services.BudgetPlan.Requests.Settings.UpdateBudgetPlanSettings.V1;

public record UpdateBudgetPlanSettingsCommand(int LivingCostShare) : IHttpRequest;
