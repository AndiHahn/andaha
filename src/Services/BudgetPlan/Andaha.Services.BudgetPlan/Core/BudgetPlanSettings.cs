namespace Andaha.Services.BudgetPlan.Core;

/// <summary>
/// Budget plan settings of one user.
/// </summary>
public class BudgetPlanSettings
{
    /// <summary>
    /// Share of the income (in percent) that is set aside for living costs, unless the user saved another value.
    /// </summary>
    public const int DefaultLivingCostShare = 35;

    public const int MinLivingCostShare = 0;

    public const int MaxLivingCostShare = 100;

    private BudgetPlanSettings()
    {
    }

    public BudgetPlanSettings(Guid userId, int livingCostShare)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id must not be empty.");
        }

        this.UserId = userId;
        this.UpdateLivingCostShare(livingCostShare);
    }

    public Guid UserId { get; private set; }

    /// <summary>
    /// Share of the income in percent, 0 to 100.
    /// </summary>
    public int LivingCostShare { get; private set; }

    public void UpdateLivingCostShare(int livingCostShare)
    {
        if (livingCostShare is < MinLivingCostShare or > MaxLivingCostShare)
        {
            throw new ArgumentOutOfRangeException(
                nameof(livingCostShare),
                livingCostShare,
                $"Living cost share must be between {MinLivingCostShare} and {MaxLivingCostShare}.");
        }

        this.LivingCostShare = livingCostShare;
    }
}
